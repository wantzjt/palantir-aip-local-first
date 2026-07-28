import { createEvidence, type EvidenceClock, type EvidenceRecord } from "./contracts.js";

export interface QueuedMutation<T> {
  id: string;
  taskId: string;
  payload: T;
  baseVersion: number;
  queuedAt: string;
}

export type ReplayResult = "applied" | "conflict" | "retry";

export interface ReplaySummary {
  applied: string[];
  conflicts: string[];
  pending: string[];
  evidence: EvidenceRecord[];
}

export class OfflineMutationQueue<T> {
  private readonly items = new Map<string, QueuedMutation<T>>();

  constructor(private readonly now: EvidenceClock = () => new Date()) {}

  enqueue(mutation: Omit<QueuedMutation<T>, "queuedAt">): EvidenceRecord {
    const deduplicated = this.items.has(mutation.id);
    if (!deduplicated) {
      this.items.set(mutation.id, { ...mutation, queuedAt: this.now().toISOString() });
    }
    return createEvidence(
      mutation.taskId,
      "mutation.queued",
      { mutationId: mutation.id, deduplicated },
      this.now,
    );
  }

  list(): QueuedMutation<T>[] {
    return [...this.items.values()];
  }

  async replay(
    apply: (mutation: QueuedMutation<T>) => Promise<ReplayResult>,
  ): Promise<ReplaySummary> {
    const summary: ReplaySummary = { applied: [], conflicts: [], pending: [], evidence: [] };

    for (const mutation of this.items.values()) {
      const result = await apply(mutation);
      if (result === "applied") {
        this.items.delete(mutation.id);
        summary.applied.push(mutation.id);
        summary.evidence.push(
          createEvidence(
            mutation.taskId,
            "mutation.replayed",
            { mutationId: mutation.id, result },
            this.now,
          ),
        );
      } else if (result === "conflict") {
        summary.conflicts.push(mutation.id);
      } else {
        summary.pending.push(mutation.id);
      }
    }
    return summary;
  }
}
