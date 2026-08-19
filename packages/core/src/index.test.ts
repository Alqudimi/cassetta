// Signal Archive design: tests read like evidence checks; each assertion names the behavior a contributor must preserve.
import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import {
  MAX_CASSETTE_BYTES,
  MAX_LINE_BYTES,
  cassetteFromJsonl,
  cassetteFromJsonlStream,
  cassetteToJsonl,
  diffEntries,
  normalizeMessage,
  prepareEntry,
  redactMessage,
  type CassetteEntry,
} from "./index";

const entry = (
  message: CassetteEntry["message"],
  sequence = 1
): CassetteEntry => ({
  sequence,
  direction: "response",
  timestamp: "2026-08-16T00:00:00.000Z",
  message,
});

describe("Cassetta core", () => {
  it("normalizes volatile fields and object key order", () => {
    expect(
      normalizeMessage({ z: 1, a: { updatedAt: "today", id: "abc" } })
    ).toEqual({
      a: { id: "<volatile-id>", updatedAt: "<volatile-time>" },
      z: 1,
    });
  });

  it("redacts secret keys and common bearer values", () => {
    expect(redactMessage({ apiKey: "secret", nested: "Bearer abc" })).toEqual({
      apiKey: "<redacted>",
      nested: "<redacted>",
    });
  });

  it("prepares entries by normalizing before redaction", () => {
    expect(
      prepareEntry(entry({ id: "abc", token: "sk-live" })).message
    ).toEqual({
      id: "<volatile-id>",
      token: "<redacted>",
    });
  });

  it("round-trips a JSONL cassette", () => {
    const cassette = {
      version: 1 as const,
      name: "demo",
      createdAt: "now",
      entries: [entry({ method: "tools/list" })],
    };
    expect(cassetteFromJsonl(cassetteToJsonl(cassette))).toEqual(cassette);
  });

  it("rejects malformed sequence numbers", () => {
    expect(() =>
      cassetteFromJsonl(
        '{"cassette":"x","version":1}\n{"sequence":2,"direction":"request","message":{}}\n'
      )
    ).toThrow("Invalid sequence");
  });

  it("reports additions, removals, and changes", () => {
    const result = diffEntries(
      [entry({ method: "tools/list" })],
      [entry({ method: "tools/call" })]
    );
    expect(result.map(line => line.kind)).toEqual(["changed"]);
    expect(diffEntries([], [entry({ method: "tools/list" })])[0].kind).toBe(
      "added"
    );
    expect(diffEntries([entry({ method: "tools/list" })], [])[0].kind).toBe(
      "removed"
    );
  });

  it("rejects malformed JSON with a line-aware format error", () => {
    expect(() => cassetteFromJsonl('{"cassette":"x","version":1}\n{')).toThrow(
      "Invalid JSON in cassette entry"
    );
  });

  it("rejects invalid directions and negative latency", () => {
    const invalidDirection = {
      version: 1 as const,
      name: "bad",
      createdAt: "now",
      entries: [{ ...entry({ method: "tools/list" }), direction: "event" }],
    };
    expect(() => cassetteToJsonl(invalidDirection)).toThrow(
      "Invalid direction"
    );

    const invalidLatency = {
      version: 1 as const,
      name: "bad",
      createdAt: "now",
      entries: [{ ...entry({ method: "tools/list" }), latencyMs: -1 }],
    };
    expect(() => cassetteToJsonl(invalidLatency)).toThrow("Invalid latency");
  });

  it("rejects an oversized cassette before allocating the entry map", () => {
    const header = JSON.stringify({
      cassette: "bloated",
      version: 1,
      createdAt: "now",
    });
    const oversized =
      `${header}\n` + "x".repeat(MAX_CASSETTE_BYTES - header.length + 1);
    expect(() => cassetteFromJsonl(oversized)).toThrow(
      `exceeds the ${MAX_CASSETTE_BYTES}-byte bound`
    );
  });

  it("rejects an oversized entry line with a size error", () => {
    const header = JSON.stringify({
      cassette: "tall",
      version: 1,
      createdAt: "now",
    });
    const payload = {
      sequence: 2,
      direction: "request",
      timestamp: "2026-08-16T00:00:00.000Z",
      message: { method: "tools/list", payload: "x".repeat(MAX_LINE_BYTES) },
    };
    const oversized = `${header}\n${JSON.stringify(payload)}\n`;
    expect(() => cassetteFromJsonl(oversized)).toThrow(
      `exceeds the ${MAX_LINE_BYTES}-byte limit`
    );
  });

  it("rejects an oversized stream as soon as the byte bound is crossed", () => {
    const header = JSON.stringify({
      cassette: "stream",
      version: 1,
      createdAt: "now",
    });
    const body = "x".repeat(MAX_CASSETTE_BYTES - header.length + 1);
    const stream = Readable.from([`${header}\n`, body]);
    expect(cassetteFromJsonlStream(stream)).rejects.toThrow(
      `exceeds the ${MAX_CASSETTE_BYTES}-byte bound`
    );
  });

  it("parses a valid stream within the bounds", async () => {
    const cassette = {
      version: 1 as const,
      name: "bounded",
      createdAt: "2026-08-16T00:00:00.000Z",
      entries: [
        {
          sequence: 1,
          direction: "request",
          timestamp: "2026-08-16T00:00:00.000Z",
          message: { method: "tools/list" },
        },
      ],
    };
    const parsed = await cassetteFromJsonlStream(
      Readable.from(cassetteToJsonl(cassette))
    );
    expect(parsed).toEqual(cassette);
  });
});
