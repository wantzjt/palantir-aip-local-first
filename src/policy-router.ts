import { createEvidence, type EvidenceClock, type RouteDecision, type TaskRequest } from "./contracts.js";

const LOCAL_ONLY = new Set(["confidential", "restricted"]);

export function routeTask(
  request: TaskRequest,
  now?: EvidenceClock,
): RouteDecision {
  let target: RouteDecision["target"];
  let reason: RouteDecision["reason"];

  if (LOCAL_ONLY.has(request.sensitivity) && request.requiresFoundry) {
    target = "deny";
    reason = "policy-conflict";
  } else if (LOCAL_ONLY.has(request.sensitivity)) {
    target = "local";
    reason = "local-sensitive";
  } else if (request.connectivity === "offline" && request.offlineCapable) {
    target = "local";
    reason = "local-offline";
  } else if (request.connectivity === "offline") {
    target = "deny";
    reason = "policy-conflict";
  } else if (request.requiresFoundry) {
    target = "foundry";
    reason = "foundry-required";
  } else {
    target = "foundry";
    reason = "governed-default";
  }

  return {
    target,
    reason,
    evidence: createEvidence(
      request.id,
      "route.decided",
      {
        target,
        reason,
        sensitivity: request.sensitivity,
        connectivity: request.connectivity,
      },
      now,
    ),
  };
}
