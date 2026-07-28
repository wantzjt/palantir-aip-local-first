import assert from "node:assert/strict";
import test from "node:test";
import { LocalInferenceClient, assertLocalEndpoint } from "../src/index.js";

test("accepts loopback model endpoints", () => {
  assert.equal(assertLocalEndpoint("http://127.0.0.1:11434/api/generate").hostname, "127.0.0.1");
  assert.equal(assertLocalEndpoint("http://localhost:8080/infer").hostname, "localhost");
});

test("rejects non-loopback endpoints", () => {
  assert.throws(
    () => assertLocalEndpoint("https://models.example.com/infer"),
    /must use loopback/,
  );
});

test("passes inference through the guarded endpoint", async () => {
  const client = new LocalInferenceClient(
    "http://localhost:8080/infer",
    async (url, body) => ({ host: url.hostname, body }),
  );
  assert.deepEqual(await client.infer({ prompt: "synthetic" }), {
    host: "localhost",
    body: { prompt: "synthetic" },
  });
});
