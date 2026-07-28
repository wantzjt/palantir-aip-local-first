export type Sensitivity = "public" | "internal" | "confidential" | "restricted";
export type ExecutionTarget = "foundry" | "local" | "deny";

export interface TaskRequest {
  id: string;
  sensitivity: Sensitivity;
  connectivity: "online" | "offline";
  requiresFoundry: boolean;
  offlineCapable: boolean;
}

export interface EvidenceRecord {
  eventId: string;
  taskId: string;
  event: "route.decided" | "mutation.queued" | "mutation.replayed" | "subscription.recovered";
  occurredAt: string;
  details: Readonly<Record<string, string | number | boolean>>;
}

export interface RouteDecision {
  target: ExecutionTarget;
  reason:
    | "foundry-required"
    | "local-sensitive"
    | "local-offline"
    | "policy-conflict"
    | "governed-default";
  evidence: EvidenceRecord;
}

export type EvidenceClock = () => Date;

export function createEvidence(
  taskId: string,
  event: EvidenceRecord["event"],
  details: EvidenceRecord["details"],
  now: EvidenceClock = () => new Date(),
): EvidenceRecord {
  const occurredAt = now().toISOString();
  return {
    eventId: `${taskId}:${event}:${occurredAt}`,
    taskId,
    event,
    occurredAt,
    details,
  };
}
