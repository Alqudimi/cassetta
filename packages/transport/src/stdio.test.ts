// Signal Archive design: E2E tests use a tiny local fixture so transport behavior is reproducible without network access.
import { chmod, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { captureStdioSession } from "./stdio";

const fixture = join(tmpdir(), `cassetta-stdio-fixture-${process.pid}.mjs`);

await writeFile(fixture, `
import readline from "node:readline";
const input = readline.createInterface({ input: process.stdin });
input.on("line", (line) => {
  const request = JSON.parse(line);
  process.stdout.write(JSON.stringify({ id: request.id, result: { echoed: request.params, token: "bearer fixture-secret" } }) + "\\n");
});
`);
await chmod(fixture, 0o600);

describe("stdio transport", () => {
  it("captures a local JSON-RPC session into a redacted cassette", async () => {
    const result = await captureStdioSession(
      [{ id: "request-1", method: "tools/call", params: { query: "cassetta", authorization: "Bearer local-secret" } }],
      { command: process.execPath, args: [fixture], name: "local-fixture", timeoutMs: 2_000 },
    );

    expect(result.stderr).toBe("");
    expect(result.cassette.entries).toHaveLength(2);
    expect(result.cassette.entries[0].direction).toBe("request");
    expect(result.cassette.entries[0].message.id).toBe("<volatile-id>");
    expect(result.cassette.entries[0].message.params).toEqual({ authorization: "<redacted>", query: "cassetta" });
    expect(result.cassette.entries[1].message.result).toEqual({ echoed: { authorization: "<redacted>", query: "cassetta" }, token: "<redacted>" });
    expect(result.cassette.entries[1].latencyMs).toEqual(expect.any(Number));
  });
});
