import { createEvidence, type EvidenceClock, type EvidenceRecord } from "./contracts.js";

export interface SubscriptionHandle {
  unsubscribe(): void;
}

export interface SubscriptionCallbacks<T> {
  onChange(value: T): void;
  onOutOfDate(): void;
  onError(error: Error): void;
}

export interface SubscriptionAdapter<T> {
  load(): Promise<T>;
  subscribe(callbacks: SubscriptionCallbacks<T>): SubscriptionHandle;
}

export interface ResilientSubscription<T> {
  initial: T;
  close(): void;
  evidence: EvidenceRecord[];
}

export async function startResilientSubscription<T>(
  taskId: string,
  adapter: SubscriptionAdapter<T>,
  onValue: (value: T) => void,
  now: EvidenceClock = () => new Date(),
): Promise<ResilientSubscription<T>> {
  const evidence: EvidenceRecord[] = [];
  const initial = await adapter.load();
  onValue(initial);

  const recover = async (cause: string): Promise<void> => {
    const refreshed = await adapter.load();
    onValue(refreshed);
    evidence.push(
      createEvidence(taskId, "subscription.recovered", { cause }, now),
    );
  };

  const handle = adapter.subscribe({
    onChange: onValue,
    onOutOfDate: () => void recover("out-of-date"),
    onError: (error) => void recover(`error:${error.message}`),
  });

  return { initial, close: () => handle.unsubscribe(), evidence };
}
