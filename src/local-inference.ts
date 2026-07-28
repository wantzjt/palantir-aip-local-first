export interface InferenceTransport {
  (url: URL, body: Readonly<Record<string, unknown>>): Promise<unknown>;
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function assertLocalEndpoint(endpoint: string): URL {
  const url = new URL(endpoint);
  if (!LOOPBACK_HOSTS.has(url.hostname)) {
    throw new Error(`Local inference endpoint must use loopback; received ${url.hostname}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Unsupported local inference protocol: ${url.protocol}`);
  }
  return url;
}

export class LocalInferenceClient {
  readonly endpoint: URL;

  constructor(endpoint: string, private readonly transport: InferenceTransport) {
    this.endpoint = assertLocalEndpoint(endpoint);
  }

  infer(input: Readonly<Record<string, unknown>>): Promise<unknown> {
    return this.transport(this.endpoint, input);
  }
}
