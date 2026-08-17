// Signal Archive design: replay tests assert deterministic behavior and explicit failure diagnostics, not just happy-path output.
import { describe, expect, it } from "vitest";
import { replayCassette, ReplayMismatchError } from "./replay";
import type { Cassette } from "../../core/src/index";

const cassette: Cassette = {
  version: 1,
  name: "fixture",
  createdAt: "<volatile-time>",
  entries: [
    {
      sequence: 1,
      direction: "request",
      timestamp: "<volatile-time>",
      message: {
        id: "<volatile-id>",
        method: "tools/list",
        params: { query: "cassetta" },
      },
    },
    {
      sequence: 2,
      direction: "response",
      timestamp: "<volatile-time>",
      message: { id: "<volatile-id>", result: { tools: ["search"] } },
    },
  ],
};

describe("offline replay", () => {
  it("returns the recorded response without starting a process", () => {
    const result = replayCassette(cassette, [
      { id: "new-id", method: "tools/list", params: { query: "cassetta" } },
    ]);
    expect(result.matchedPairs).toBe(1);
    expect(result.responses).toEqual([
      { id: "<volatile-id>", result: { tools: ["search"] } },
    ]);
  });

  it("reports a useful mismatch when request behavior drifts", () => {
    expect(() =>
      replayCassette(cassette, [
        { id: "new-id", method: "tools/call", params: { query: "cassetta" } },
      ])
    ).toThrowError(ReplayMismatchError);
    try {
      replayCassette(cassette, [{ id: "new-id", method: "tools/call" }]);
    } catch (error) {
      expect(error).toMatchObject({
        sequence: 1,
        message: expect.stringContaining("inspect the cassette diff"),
      });
    }
  });

  it("rejects a cassette that is not arranged as request/response pairs", () => {
    expect(() =>
      replayCassette({ ...cassette, entries: [cassette.entries[1]] }, [])
    ).toThrow("not a request/response pair");
  });
});
