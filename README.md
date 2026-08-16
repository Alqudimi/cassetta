# Cassetta

> Record once. Reproduce without the network.

Cassetta is a **local-first contract-testing and deterministic replay toolkit for MCP and AI tool workflows**. It captures a JSON-RPC session, normalizes volatile fields, redacts secrets before persistence, and turns the result into a reviewable cassette that can be replayed and checked in CI.

## Why Cassetta exists

AI tool workflows are difficult to debug because a failure often depends on a live provider, mutable tool state, timing, and a large amount of context. Screenshots and copied logs preserve a moment, but they do not make the behavior reproducible. Cassetta treats the interaction itself as an artifact: a plain JSONL file that a maintainer can inspect, commit, diff, and replay offline.

Cassetta is intentionally complementary to broad observability platforms and interactive MCP inspectors. Its narrow job is to make **protocol behavior reviewable and regression-testable**.

## Current status

The repository contains the framework-free core, JSONL cassette format, redaction and normalization logic, a CLI surface, a local stdio transport adapter, real unit and E2E tests, and the product landing page. The current transport boundary speaks line-delimited JSON-RPC to a child process and turns request/response pairs into safe cassette entries without making network calls.

## Core workflow

```text
live JSON-RPC session → capture → normalize → redact → cassette.jsonl
                                                    ├─ replay offline
                                                    ├─ diff behavior
                                                    └─ check in CI
```

## Quick start

```bash
pnpm install
pnpm check
pnpm vitest run --root packages/core src/index.test.ts --coverage
pnpm vitest run --root packages/transport src/stdio.test.ts
pnpm build
```

Capture a local line-delimited JSON-RPC process:

```bash
node --import tsx packages/cli/src/index.ts capture-stdio examples/requests.json fixtures/local.json node ./path/to/server.mjs
node --import tsx packages/cli/src/index.ts check fixtures/local.json
```

The stdio adapter is deliberately conservative: one request is written per line, one JSON response is read per request, process lifetime is bounded by the session, and payloads pass through normalization and redaction before persistence.

To use the domain core directly:

```ts
import { prepareEntry, cassetteToJsonl } from "./packages/core/src/index.js";

const safeEntry = prepareEntry({
  sequence: 1,
  direction: "request",
  timestamp: new Date().toISOString(),
  message: { method: "tools/list", token: "never-committed" },
});

console.log(cassetteToJsonl({
  version: 1,
  name: "baseline",
  createdAt: new Date().toISOString(),
  entries: [safeEntry],
}));
```

## Architecture

The domain core is independent from transports and presentation. It exposes typed messages, deterministic transforms, JSONL persistence, and diffs. The stdio adapter feeds the same `CassetteEntry` contract without changing the core; Streamable HTTP remains a planned adapter.

| Layer | Responsibility |
|---|---|
| Domain core | Messages, normalization, redaction, cassette serialization, diffs |
| Transport adapters | MCP-like stdio capture boundary; HTTP remains planned |
| CLI | Stable commands, human output, JSON output, exit codes |
| CI integration | Run checks and fail on meaningful behavioral drift |
| Product surface | Explain the workflow and help contributors understand the boundary |

## Security model

Cassetta uses secure defaults: common secret-bearing keys and bearer-like values are redacted before cassette persistence. The core does not make outbound network calls. Cassettes should still be reviewed before committing because custom payloads can contain sensitive business data; use project-specific policies and keep fixtures synthetic whenever possible.

Report vulnerabilities privately according to [SECURITY.md](SECURITY.md). Do not open a public issue for an undisclosed secret or exploitable weakness.

## Documentation

The design and implementation plan lives in [`tasks/plan.md`](tasks/plan.md). Contributor workflow is in [`CONTRIBUTING.md`](CONTRIBUTING.md). The format is intentionally documented beside the core package in [`packages/core/README.md`](packages/core/README.md).

## Roadmap

The next milestones are an MCP SDK-native stdio proxy, Streamable HTTP support, signed cassette manifests, schema-aware contract assertions, a replay report, and a GitHub Action that uploads a compact diff artifact on failure. These extensions are designed around the existing ports rather than a rewrite.

## License

Cassetta is released under the MIT License. See [`LICENSE`](LICENSE).
