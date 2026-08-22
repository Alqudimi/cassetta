// Signal Archive design: benchmark output is compact evidence for maintainers, not a marketing claim.
import {
  diffEntries,
  prepareEntry,
  type Cassette,
  type ProtocolMessage,
} from "../packages/core/src/index.js";

type BenchmarkResult = {
  entries: number;
  normalizationMs: number;
  diffMs: number;
  entriesPerSecond: number;
};

const buildCassette = (pairs: number): Cassette => ({
  version: 1,
  name: `benchmark-${pairs}`,
  createdAt: "2026-08-22T00:00:00.000Z",
  entries: Array.from({ length: pairs * 2 }, (_, index) => {
    const request = index % 2 === 0;
    const message: ProtocolMessage = request
      ? {
          id: Math.floor(index / 2),
          method: "tools/call",
          params: {
            query: `fixture-${index}`,
            authorization: "Bearer synthetic",
          },
        }
      : { id: Math.floor(index / 2), result: { ok: true, index } };
    return {
      sequence: index + 1,
      direction: request ? "request" : "response",
      timestamp: "2026-08-22T00:00:00.000Z",
      message,
    };
  }),
});

const run = (pairs: number): BenchmarkResult => {
  const source = buildCassette(pairs);
  const started = performance.now();
  const prepared = source.entries.map(prepareEntry);
  const normalizationMs = performance.now() - started;
  const diffStarted = performance.now();
  const differences = diffEntries(prepared, prepared);
  const diffMs = performance.now() - diffStarted;
  if (differences.some(difference => difference.kind !== "same"))
    throw new Error("benchmark baseline unexpectedly drifted");
  return {
    entries: prepared.length,
    normalizationMs: Number(normalizationMs.toFixed(3)),
    diffMs: Number(diffMs.toFixed(3)),
    entriesPerSecond: Math.round(
      (prepared.length / Math.max(normalizationMs, 0.001)) * 1000
    ),
  };
};

console.log(
  JSON.stringify(
    { generatedAt: "synthetic-fixture", results: [100, 1000, 5000].map(run) },
    null,
    2
  )
);
