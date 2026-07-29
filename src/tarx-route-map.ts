/**
 * Map Palantir-style placement decisions onto TARX route truth.
 *
 * TARX: Computer by default. Supercomputer by permission.
 * This module is pure and dependency-free so enterprise reviewers can audit it
 * without importing TARX private code.
 */

import type { RouteDecision } from "./contracts.js";

export type TarxRuntime = "computer" | "private" | "supercomputer" | "deny";

export type TarxRouteTruth = {
  runtime: TarxRuntime;
  approved: boolean;
  reason: string;
  /** Explicit remote/hosted escalation is never implicit. */
  requires_explicit_permission: boolean;
  source_target: RouteDecision["target"];
  source_reason: RouteDecision["reason"];
};

/**
 * Policy decides placement; model preference does not.
 * - foundry  → private (enterprise-governed plane)
 * - local    → computer (device-local inference)
 * - deny     → deny (no fallback to unapproved remote)
 */
export function toTarxRouteTruth(decision: RouteDecision): TarxRouteTruth {
  switch (decision.target) {
    case "local":
      return {
        runtime: "computer",
        approved: true,
        reason: `computer_default:${decision.reason}`,
        requires_explicit_permission: false,
        source_target: decision.target,
        source_reason: decision.reason,
      };
    case "foundry":
      return {
        runtime: "private",
        approved: true,
        reason: `private_enterprise:${decision.reason}`,
        requires_explicit_permission: false,
        source_target: decision.target,
        source_reason: decision.reason,
      };
    case "deny":
      return {
        runtime: "deny",
        approved: false,
        reason: `policy_deny:${decision.reason}`,
        requires_explicit_permission: false,
        source_target: decision.target,
        source_reason: decision.reason,
      };
    default: {
      const _exhaustive: never = decision.target;
      return _exhaustive;
    }
  }
}

/**
 * Supercomputer (approved remote/cloud) is never selected by the default policy
 * router. Callers must escalate deliberately with an explicit approval token.
 */
export function approveSupercomputerEscalation(input: {
  reason: string;
  approver: "human" | "policy";
  approval_id: string;
}): TarxRouteTruth {
  if (!input.approval_id.trim()) {
    throw new Error("supercomputer_approval_id_required");
  }
  return {
    runtime: "supercomputer",
    approved: true,
    reason: `supercomputer_explicit:${input.approver}:${input.reason}`,
    requires_explicit_permission: true,
    source_target: "foundry",
    source_reason: "governed-default",
  };
}
