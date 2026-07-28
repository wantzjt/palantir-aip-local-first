import assert from "node:assert/strict";
import test from "node:test";
import {
  startResilientSubscription,
  type SubscriptionCallbacks,
} from "../src/index.js";

test("reloads state when a subscription becomes stale", async () => {
  let callbacks: SubscriptionCallbacks<number> | undefined;
  let value = 1;
  let closed = false;
  const observed: number[] = [];

  const subscription = await startResilientSubscription(
    "task-1",
    {
      load: async () => value,
      subscribe: (nextCallbacks) => {
        callbacks = nextCallbacks;
        return { unsubscribe: () => { closed = true; } };
      },
    },
    (next) => observed.push(next),
  );

  value = 2;
  callbacks?.onOutOfDate();
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(observed, [1, 2]);
  assert.equal(subscription.evidence[0]?.details.cause, "out-of-date");
  subscription.close();
  assert.equal(closed, true);
});
