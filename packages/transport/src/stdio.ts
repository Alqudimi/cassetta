// Signal Archive design: transport code is a narrow boundary. It owns process lifetime and framing, while the core owns evidence semantics.
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";
import { cassetteToJsonl, prepareEntry, type Cassette, type CassetteEntry, type ProtocolMessage } from "../../core/src/index.js";

export interface StdioSessionOptions {
  command: string;
  args?: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  name?: string;
  timeoutMs?: number;
}

export interface StdioSessionResult {
  cassette: Cassette;
  stderr: string;
}

export class StdioTransportError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "StdioTransportError";
  }
}

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, description: string): Promise<T> => {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new StdioTransportError(`Timed out while waiting for ${description}`)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const readResponse = (process: ChildProcessWithoutNullStreams, timeoutMs: number): Promise<ProtocolMessage> => {
  const reader = createInterface({ input: process.stdout });
  return withTimeout(new Promise<ProtocolMessage>((resolve, reject) => {
    const onLine = (line: string) => {
      reader.close();
      try {
        resolve(JSON.parse(line) as ProtocolMessage);
      } catch (error) {
        reject(new StdioTransportError("The stdio server emitted invalid JSON", { cause: error }));
      }
    };
    const onExit = (code: number | null) => reject(new StdioTransportError(`The stdio server exited before responding (code ${code ?? "unknown"})`));
    reader.once("line", onLine);
    process.once("exit", onExit);
  }), timeoutMs, "a JSON-RPC response");
};

export const captureStdioSession = async (
  requests: ProtocolMessage[],
  options: StdioSessionOptions,
): Promise<StdioSessionResult> => {
  if (requests.length === 0) throw new StdioTransportError("A stdio session requires at least one request");
  const timeoutMs = options.timeoutMs ?? 2_000;
  const child = spawn(options.command, options.args ?? [], {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    stdio: "pipe",
  });
  const stderrChunks: Buffer[] = [];
  child.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));
  const entries: CassetteEntry[] = [];
  let sequence = 1;

  try {
    for (const request of requests) {
      const started = Date.now();
      const requestEntry: CassetteEntry = prepareEntry({ sequence, direction: "request", timestamp: new Date(started).toISOString(), message: request });
      entries.push(requestEntry);
      sequence += 1;
      child.stdin.write(`${JSON.stringify(request)}\n`);
      const response = await readResponse(child, timeoutMs);
      const finished = Date.now();
      entries.push(prepareEntry({ sequence, direction: "response", timestamp: new Date(finished).toISOString(), latencyMs: finished - started, message: response }));
      sequence += 1;
    }
  } catch (error) {
    throw error instanceof StdioTransportError ? error : new StdioTransportError("The stdio session failed", { cause: error });
  } finally {
    child.stdin.end();
    child.kill();
  }

  const cassette: Cassette = {
    version: 1,
    name: options.name ?? "stdio-session",
    createdAt: new Date().toISOString(),
    entries,
  };
  return { cassette, stderr: Buffer.concat(stderrChunks).toString("utf8") };
};

export const captureStdioSessionJsonl = async (requests: ProtocolMessage[], options: StdioSessionOptions): Promise<string> =>
  cassetteToJsonl((await captureStdioSession(requests, options)).cassette);
