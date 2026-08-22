// Signal Archive design: E2E tests use a tiny local fixture so transport behavior is reproducible without network access.
import { chmod, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MAX_LINE_BYTES } from "../../core/src/index";
import { describe, expect, it } from "vitest";
import { captureStdioSession } from "./stdio";

const fixture = join(tmpdir(), `cassetta-stdio-fixture-${process.pid}.mjs`);

await writeFile(
  fixture,
  `
import readline from "node:readline";
const input = readline.createInterface({ input: process.stdin });
input.on("line", (line) => {
  const request = JSON.parse(line);
  process.stdout.write(JSON.stringify({ id: request.id, result: { echoed: request.params, token: "bearer fixture-secret" } }) + "\\n");
});
`
);
await chmod(fixture, 0o600);

describe("stdio transport", () => {
  it("captures a local JSON-RPC session into a redacted cassette", async () => {
    const result = await captureStdioSession(
      [
        {
          id: "request-1",
          method: "tools/call",
          params: { query: "cassetta", authorization: "Bearer <local>" },
        },
      ],
      {
        command: process.execPath,
        args: [fixture],
        name: "local-fixture",
        timeoutMs: 2_000,
      }
    );

    expect(result.stderr).toBe("");
    expect(result.cassette.entries).toHaveLength(2);
    expect(result.cassette.entries[0].direction).toBe("request");
    expect(result.cassette.entries[0].message.id).toBe("<volatile-id>");
    expect(result.cassette.entries[0].message.params).toEqual({
      authorization: "<redacted>",
      query: "cassetta",
    });
    expect(result.cassette.entries[1].message.result).toEqual({
      echoed: { authorization: "<redacted>", query: "cassetta" },
      token: "<redacted>",
    });
    expect(result.cassette.entries[1].latencyMs).toEqual(expect.any(Number));
  });

  it("fails closed when the server times out", async () => {
    const timeoutFixture = join(
      tmpdir(),
      `cassetta-timeout-${process.pid}.mjs`
    );
    await writeFile(timeoutFixture, "setTimeout(() => {}, 1000);");
    await chmod(timeoutFixture, 0o600);

    await expect(
      captureStdioSession([{ id: 1, method: "tools/list" }], {
        command: process.execPath,
        args: [timeoutFixture],
        timeoutMs: 20,
      })
    ).rejects.toThrow("Timed out");
  });

  it("rejects malformed JSON emitted by the server", async () => {
    const invalidFixture = join(
      tmpdir(),
      `cassetta-invalid-${process.pid}.mjs`
    );
    await writeFile(
      invalidFixture,
      'process.stdin.once("data", () => { process.stdout.write("not-json\\n"); setTimeout(() => {}, 100); });'
    );
    await chmod(invalidFixture, 0o600);

    await expect(
      captureStdioSession([{ id: 1, method: "tools/list" }], {
        command: process.execPath,
        args: [invalidFixture],
      })
    ).rejects.toThrow("invalid JSON");
  });

  it("reports a missing executable instead of hanging", async () => {
    await expect(
      captureStdioSession([{ id: 1, method: "tools/list" }], {
        command: "cassetta-command-that-does-not-exist",
        timeoutMs: 100,
      })
    ).rejects.toThrow("stream failed");
  });

  it("aborts the session when the server emits an oversized line", async () => {
    const oversizedFixture = join(
      tmpdir(),
      `cassetta-oversized-${process.pid}.mjs`
    );
    await writeFile(
      oversizedFixture,
      `process.stdin.once("data", () => {
  process.stdout.write(JSON.stringify({ result: "x".repeat(${MAX_LINE_BYTES + 1}) }) + "\\n");
  setTimeout(() => {}, 100);
});`
    );
    await chmod(oversizedFixture, 0o600);

    await expect(
      captureStdioSession([{ id: 1, method: "tools/list" }], {
        command: process.execPath,
        args: [oversizedFixture],
        timeoutMs: 2_000,
      })
    ).rejects.toThrow(`${MAX_LINE_BYTES}-byte limit`);
  });
});
