/**
 * Bridge Palantir local-first route decisions into TARX-shaped governed action
 * contracts (proposal / decision / result). Portable JSON only — no network.
 *
 * Schema names align with tarx-ai/governed-agent-contracts without importing it
 * as a package dependency (keeps this repo zero-runtime-dep).
 */

import type { RouteDecision, TaskRequest } from "./contracts.js";
import { toTarxRouteTruth, type TarxRouteTruth } from "./tarx-route-map.js";

export type ActionProposalV1 = {
  schema: "tarx-action-proposal.v1";
  proposal_id: string;
  created_at: string;
  status: "proposed";
  intent: string;
  action: {
    name: string;
    summary: string;
    input: Record<string, unknown>;
  };
  grounding: {
    target: string;
    observed_at: string;
    confidence: number;
  };
  risk: {
    level: "read_only" | "low" | "medium" | "high" | "blocked";
    mutation: boolean;
    external_side_effect: boolean;
    requires_confirmation: boolean;
    reasons: string[];
  };
  route: {
    runtime: "computer" | "private" | "supercomputer";
    approved: boolean;
    reason: string;
  };
};

export type ActionDecisionV1 = {
  schema: "tarx-action-decision.v1";
  proposal_id: string;
  decided_at: string;
  decision: "approved" | "rejected" | "blocked";
  actor: { type: "human" | "policy"; id: string };
  reason: string;
};

export type ActionResultV1 = {
  schema: "tarx-action-result.v1";
  proposal_id: string;
  completed_at: string;
  executed: boolean;
  status: "succeeded" | "failed" | "blocked" | "cancelled";
  evidence: Array<Record<string, unknown>>;
  completion_claim_allowed: boolean;
};

function riskFor(request: TaskRequest, truth: TarxRouteTruth): ActionProposalV1["risk"] {
  if (truth.runtime === "deny") {
    return {
      level: "blocked",
      mutation: false,
      external_side_effect: false,
      requires_confirmation: true,
      reasons: [truth.reason, "policy_denied_route"],
    };
  }
  if (request.sensitivity === "restricted" || request.sensitivity === "confidential") {
    return {
      level: "high",
      mutation: true,
      external_side_effect: truth.runtime !== "computer",
      requires_confirmation: true,
      reasons: ["sensitive_classification", truth.reason],
    };
  }
  if (truth.runtime === "private") {
    return {
      level: "medium",
      mutation: true,
      external_side_effect: true,
      requires_confirmation: true,
      reasons: ["enterprise_side_effect", truth.reason],
    };
  }
  return {
    level: "low",
    mutation: false,
    external_side_effect: false,
    requires_confirmation: false,
    reasons: ["local_read_or_low_risk", truth.reason],
  };
}

export function proposalFromRoute(input: {
  request: TaskRequest;
  decision: RouteDecision;
  intent: string;
  actionName?: string;
  now?: () => Date;
}): ActionProposalV1 {
  const now = (input.now ?? (() => new Date()))().toISOString();
  const truth = toTarxRouteTruth(input.decision);
  const risk = riskFor(input.request, truth);

  if (truth.runtime === "deny") {
    return {
      schema: "tarx-action-proposal.v1",
      proposal_id: `prop_${input.request.id}`,
      created_at: now,
      status: "proposed",
      intent: input.intent,
      action: {
        name: input.actionName ?? "enterprise.task",
        summary: input.intent,
        input: { task_id: input.request.id, sensitivity: input.request.sensitivity },
      },
      grounding: {
        target: input.request.id,
        observed_at: now,
        confidence: 1,
      },
      risk,
      // Contract: blocked proposals cannot carry an approved supercomputer/private route.
      route: {
        runtime: "computer",
        approved: false,
        reason: truth.reason,
      },
    };
  }

  return {
    schema: "tarx-action-proposal.v1",
    proposal_id: `prop_${input.request.id}`,
    created_at: now,
    status: "proposed",
    intent: input.intent,
    action: {
      name: input.actionName ?? "enterprise.task",
      summary: input.intent,
      input: { task_id: input.request.id, sensitivity: input.request.sensitivity },
    },
    grounding: {
      target: input.request.id,
      observed_at: now,
      confidence: 0.9,
    },
    risk,
    route: {
      runtime: truth.runtime,
      approved: truth.approved,
      reason: truth.reason,
    },
  };
}

export function decideProposal(
  proposal: ActionProposalV1,
  input: {
    decision: "approved" | "rejected" | "blocked";
    actorType: "human" | "policy";
    actorId: string;
    reason: string;
    now?: () => Date;
  },
): ActionDecisionV1 {
  if (proposal.risk.level === "blocked" && input.decision === "approved") {
    throw new Error("blocked_proposal_cannot_be_approved");
  }
  return {
    schema: "tarx-action-decision.v1",
    proposal_id: proposal.proposal_id,
    decided_at: (input.now ?? (() => new Date()))().toISOString(),
    decision: input.decision,
    actor: { type: input.actorType, id: input.actorId },
    reason: input.reason,
  };
}

export function resultFromDecision(
  proposal: ActionProposalV1,
  decision: ActionDecisionV1,
  input: {
    evidence?: Array<Record<string, unknown>>;
    now?: () => Date;
  } = {},
): ActionResultV1 {
  const now = (input.now ?? (() => new Date()))().toISOString();
  if (decision.decision !== "approved") {
    return {
      schema: "tarx-action-result.v1",
      proposal_id: proposal.proposal_id,
      completed_at: now,
      executed: false,
      status: decision.decision === "blocked" ? "blocked" : "cancelled",
      evidence: input.evidence ?? [{ kind: "decision", decision: decision.decision }],
      completion_claim_allowed: false,
    };
  }

  const evidence = input.evidence ?? [
    {
      kind: "execution",
      runtime: proposal.route.runtime,
      summary: "synthetic enterprise execution evidence",
    },
  ];

  return {
    schema: "tarx-action-result.v1",
    proposal_id: proposal.proposal_id,
    completed_at: now,
    executed: true,
    status: "succeeded",
    evidence,
    completion_claim_allowed: evidence.length > 0,
  };
}

export function assertCompletionInvariants(result: ActionResultV1): void {
  if (result.completion_claim_allowed) {
    if (result.status !== "succeeded") {
      throw new Error("completion_requires_success");
    }
    if (!result.evidence.length) {
      throw new Error("completion_requires_evidence");
    }
  }
  if (result.executed && !result.evidence.length) {
    throw new Error("executed_requires_evidence");
  }
}
