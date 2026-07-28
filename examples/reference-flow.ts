import {
  LocalInferenceClient,
  OfflineMutationQueue,
  routeTask,
} from "../src/index.js";

const task = {
  id: "field-inspection-42",
  sensitivity: "confidential" as const,
  connectivity: "offline" as const,
  requiresFoundry: false,
  offlineCapable: true,
};

const decision = routeTask(task);
const model = new LocalInferenceClient(
  "http://127.0.0.1:11434/api/generate",
  async (_url, body) => ({
    classification: "maintenance-review",
    source: "simulated-local-model",
    input: body,
  }),
);

const result = await model.infer({ observation: "Synthetic compressor reading" });
const queue = new OfflineMutationQueue<typeof result>();
queue.enqueue({
  id: "inspection-42-v1",
  taskId: task.id,
  payload: result,
  baseVersion: 7,
});

const replay = await queue.replay(async () => "applied");

console.log(JSON.stringify({ decision, replay }, null, 2));
