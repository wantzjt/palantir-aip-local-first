import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { routeTask } from "../src/policy-router.js";
import {
  approveSupercomputerEscalation,
  toTarxRouteTruth,
} from "../src/tarx-route-map.js";
import {
  assertCompletionInvariants,
  decideProposal,
  proposalFromRoute,
  resultFromDecision,
} from "../src/governed-action-bridge.js";

const fixed = () => new Date("2026-07-29T00:00:00.000Z");

describe("TARX route truth mapping", () => {
  it("maps local-sensitive work to Computer default", () => {
    const decision = routeTask(
      {
        id: "t1",
        sensitivity: "confidential",
        connectivity: "online",
        requiresFoundry: false,
        offlineCapable: true,
      },
      fixed,
    );
    const truth = toTarxRouteTruth(decision);
    assert.equal(truth.runtime, "computer");
    assert.equal(truth.approved, true);
    assert.equal(truth.requires_explicit_permission, false);
  });

  it("maps Foundry-required work to private enterprise plane", () => {
    const decision = routeTask(
      {
        id: "t2",
        sensitivity: "internal",
        connectivity: "online",
        requiresFoundry: true,
        offlineCapable: false,
      },
      fixed,
    );
    const truth = toTarxRouteTruth(decision);
    assert.equal(truth.runtime, "private");
    assert.equal(truth.approved, true);
  });

  it("maps policy conflicts to deny with no remote fallback", () => {
    const decision = routeTask(
      {
        id: "t3",
        sensitivity: "restricted",
        connectivity: "online",
        requiresFoundry: true,
        offlineCapable: false,
      },
      fixed,
    );
    const truth = toTarxRouteTruth(decision);
    assert.equal(truth.runtime, "deny");
    assert.equal(truth.approved, false);
  });

  it("requires explicit approval for Supercomputer escalation", () => {
    const truth = approveSupercomputerEscalation({
      reason: "batch_enrichment",
      approver: "human",
      approval_id: "appr_test_001",
    });
    assert.equal(truth.runtime, "supercomputer");
    assert.equal(truth.approved, true);
    assert.equal(truth.requires_explicit_permission, true);
    assert.throws(() =>
      approveSupercomputerEscalation({
        reason: "x",
        approver: "human",
        approval_id: "  ",
      }),
    );
  });
});

describe("governed action bridge", () => {
  it("builds a blocked proposal for policy-denied routes", () => {
    const request = {
      id: "t4",
      sensitivity: "restricted" as const,
      connectivity: "online" as const,
      requiresFoundry: true,
      offlineCapable: false,
    };
    const decision = routeTask(request, fixed);
    const proposal = proposalFromRoute({
      request,
      decision,
      intent: "Write ontology object while offline-sensitive",
      now: fixed,
    });
    assert.equal(proposal.risk.level, "blocked");
    assert.equal(proposal.route.approved, false);
    assert.throws(() =>
      decideProposal(proposal, {
        decision: "approved",
        actorType: "policy",
        actorId: "policy.router",
        reason: "should fail",
      }),
    );
  });

  it("requires evidence before a completion claim", () => {
    const request = {
      id: "t5",
      sensitivity: "internal" as const,
      connectivity: "online" as const,
      requiresFoundry: true,
      offlineCapable: false,
    };
    const decision = routeTask(request, fixed);
    const proposal = proposalFromRoute({
      request,
      decision,
      intent: "Apply approved Foundry action",
      now: fixed,
    });
    const dec = decideProposal(proposal, {
      decision: "approved",
      actorType: "human",
      actorId: "user.founder",
      reason: "reviewed grounding",
      now: fixed,
    });
    const result = resultFromDecision(proposal, dec, {
      evidence: [{ kind: "foundry.action", status: "applied" }],
      now: fixed,
    });
    assert.equal(result.executed, true);
    assert.equal(result.completion_claim_allowed, true);
    assertCompletionInvariants(result);
  });
});
