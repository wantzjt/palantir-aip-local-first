import assert from "node:assert/strict";
import test from "node:test";
import { routeTask, type TaskRequest } from "../src/index.js";

const base: TaskRequest = {
  id: "task-1",
  sensitivity: "internal",
  connectivity: "online",
  requiresFoundry: false,
  offlineCapable: true,
};

test("defaults online governed work to Foundry", () => {
  const decision = routeTask(base);
  assert.equal(decision.target, "foundry");
  assert.equal(decision.reason, "governed-default");
});

test("keeps confidential work local", () => {
  const decision = routeTask({ ...base, sensitivity: "confidential" });
  assert.equal(decision.target, "local");
  assert.equal(decision.reason, "local-sensitive");
});

test("denies a conflict between local-only data and a Foundry requirement", () => {
  const decision = routeTask({
    ...base,
    sensitivity: "restricted",
    requiresFoundry: true,
  });
  assert.equal(decision.target, "deny");
  assert.equal(decision.reason, "policy-conflict");
});

test("uses local execution for an offline-capable task", () => {
  const decision = routeTask({ ...base, connectivity: "offline" });
  assert.equal(decision.target, "local");
  assert.equal(decision.reason, "local-offline");
});

test("denies offline work that cannot execute offline", () => {
  const decision = routeTask({
    ...base,
    connectivity: "offline",
    offlineCapable: false,
  });
  assert.equal(decision.target, "deny");
});
