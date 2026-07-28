import assert from "node:assert/strict";
import test from "node:test";
import { OfflineMutationQueue } from "../src/index.js";

const fixedNow = () => new Date("2026-01-01T00:00:00.000Z");

test("deduplicates mutations by id", () => {
  const queue = new OfflineMutationQueue<{ value: number }>(fixedNow);
  const mutation = {
    id: "mutation-1",
    taskId: "task-1",
    payload: { value: 1 },
    baseVersion: 3,
  };
  queue.enqueue(mutation);
  const second = queue.enqueue({ ...mutation, payload: { value: 2 } });

  assert.equal(queue.list().length, 1);
  assert.equal(second.details.deduplicated, true);
  assert.deepEqual(queue.list()[0]?.payload, { value: 1 });
});

test("removes applied writes and retains conflicts", async () => {
  const queue = new OfflineMutationQueue<{ value: number }>(fixedNow);
  queue.enqueue({ id: "apply", taskId: "task-1", payload: { value: 1 }, baseVersion: 1 });
  queue.enqueue({ id: "conflict", taskId: "task-1", payload: { value: 2 }, baseVersion: 1 });

  const result = await queue.replay(async (mutation) =>
    mutation.id === "apply" ? "applied" : "conflict",
  );

  assert.deepEqual(result.applied, ["apply"]);
  assert.deepEqual(result.conflicts, ["conflict"]);
  assert.deepEqual(queue.list().map((item) => item.id), ["conflict"]);
  assert.equal(result.evidence.length, 1);
});
