# Cassetta

> **Record once. Reproduce without the network.**

[![CI](https://github.com/Alqudimi/cassetta/actions/workflows/ci.yml/badge.svg)](https://github.com/Alqudimi/cassetta/actions/workflows/ci.yml) [![Latest release](https://img.shields.io/github/v/release/Alqudimi/cassetta?include_prereleases)](https://github.com/Alqudimi/cassetta/releases) [![License](https://img.shields.io/github/license/Alqudimi/cassetta)](LICENSE)

Cassetta is a **local-first behavior cassette and regression gate for MCP and JSON-RPC tool workflows**. Capture a known-good local session, normalize volatile fields, redact secret-like values, commit the reviewable JSONL artifact, and replay or compare it offline in CI.

## Why Cassetta exists

Interactive inspectors are excellent for exploring a server. Protocol conformance suites answer whether a server speaks the protocol. Hosted evaluation platforms provide traces and model comparisons. Maintainers still need a smaller artifact that records the behavior they care about and fails deterministically when a change drifts.

Cassetta treats the interaction itself as evidence. A cassette is plain JSONL that a reviewer can inspect, diff, replay without a provider, and use as a release gate. The core makes no outbound network calls and does not require a model, database, broker, or hosted account.

## Quick start

The repository includes a tiny local fixture server so the complete workflow can be verified without credentials:

```bash
pnpm install
pnpm test:cli
```

The smoke command builds the CLI, captures `examples/requests.json` through `examples/fixture-server.mjs`, validates the cassette, replays the request offline, and confirms an equal diff.

To run the steps individually:

```bash
pnpm build:cli
mkdir -p fixtures
node packages/cli/dist/cassetta.mjs capture-stdio \
  examples/requests.json fixtures/local.jsonl \
  node examples/fixture-server.mjs
node packages/cli/dist/cassetta.mjs check fixtures/local.jsonl --json
node packages/cli/dist/cassetta.mjs replay fixtures/local.jsonl examples/requests.json --json
node packages/cli/dist/cassetta.mjs diff fixtures/local.jsonl fixtures/local.jsonl --json
```

A behavioral drift is a gate failure rather than a warning:

```bash
node packages/cli/dist/cassetta.mjs diff baseline.jsonl current.jsonl --sarif
# exit code 0: no differences
# exit code 1: behavioral differences found
# exit code 2: invalid input, usage, transport, or cassette format
```

HTTP capture is available through the same transport package. It accepts an injected or native `fetch`, validates `http`/`https` endpoints, defaults to a 10-second timeout and 1 MiB response limit, and records only normalized and redacted JSON-RPC messages. It does not print bodies or credentials and surfaces transport failures as typed `HttpTransportError` values.

Replay a previously captured cassette without starting a provider:

```ts
import { readFile } from "node:fs/promises";
import { cassetteFromJsonl } from "./packages/core/src/index.js";
import { replayCassette } from "./packages/transport/src/replay.js";

const cassette = cassetteFromJsonl(
  await readFile("fixtures/local.jsonl", "utf8")
);
const result = replayCassette(cassette, [
  { method: "tools/list", params: { query: "cassetta" } },
]);
console.log(result.responses);
```

## What is captured

A cassette contains one header line and one entry per JSON-RPC message. Entries preserve request/response order, normalized messages, optional latency, and safe metadata. Object keys are canonicalized for comparison, while array ordering remains observable because it may be meaningful behavior.

```json
{"cassette":"local-session","version":1,"createdAt":"<volatile-time>"}
{"sequence":1,"direction":"request","timestamp":"<volatile-time>","message":{"id":"<volatile-id>","method":"tools/list"}}
{"sequence":2,"direction":"response","timestamp":"<volatile-time>","latencyMs":12,"message":{"id":"<volatile-id>","result":{}}}
```

Default redaction covers common secret-bearing keys and bearer-like values before persistence. Redaction is not a guarantee that business-sensitive content has been discovered; review cassettes before committing them and prefer synthetic fixtures.

## Commands

| Command                                                          | Purpose                                                                                  |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `cassetta record <input> <output>`                               | Normalize and redact an existing cassette.                                               |
| `cassetta capture-stdio <requests> <output> <command> [...args]` | Run a bounded local JSONL process and capture its responses.                             |
| `cassetta replay <cassette> [requests.json]`                     | Inspect a cassette or validate supplied requests against it without starting a provider. |
| `cassetta diff <expected> <actual> [--json\|--sarif]`            | Compare two cassettes and emit CI-friendly evidence.                                     |
| `cassetta check <cassette> [--json\|--sarif]`                    | Validate version, sequence, entries, and pair shape.                                     |

## Architecture

The domain core is independent from transports and presentation. The stdio adapter owns process lifetime and JSONL framing; the HTTP adapter owns bounded request/response exchange; the core owns evidence semantics; and the CLI owns filesystem boundaries, reports, and exit codes.

```text
local JSON-RPC process or HTTP endpoint
                  → capture → normalize → redact → cassette.jsonl
                                                        ├─ offline replay
                                                        ├─ deterministic diff
                                                        └─ CI/SARIF gate
```

| Layer              | Responsibility                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------- |
| Domain core        | Typed messages, normalization, redaction, cassette serialization, validation, and diffs. |
| Transport adapters | MCP-like stdio and bounded HTTP JSON-RPC capture boundaries.                             |
| CLI                | Stable commands, human output, JSON/SARIF output, exit codes, and filesystem validation. |
| CI integration     | Run checks and fail on meaningful behavioral drift.                                      |
| Product surface    | Explain the workflow and help contributors understand the boundary.                      |

Read the full contract, failure matrix, and threat model in [`docs/architecture.md`](docs/architecture.md). Architecture decisions are recorded in [`docs/adrs/`](docs/adrs/), and observed verification evidence is maintained in [`docs/verification.md`](docs/verification.md).

## Development

```bash
pnpm check
pnpm format:check
pnpm test:core
pnpm test:transport
pnpm test:cli
pnpm build
pnpm audit --audit-level high
```

The critical path is intentionally small. The core package has no network or provider dependency. Capture launches only the executable and arguments explicitly supplied by the user, with `shell: false`, bounded response timeouts, and cleanup on failure. Offline replay treats cassette content as data and never executes it.

## Security boundary

Cassetta is not a sandbox, secret manager, or guarantee against a malicious local executable. Do not capture production credentials or private customer payloads unless your organization has approved the handling path. Report vulnerabilities privately through [`SECURITY.md`](SECURITY.md).

## Non-goals

Cassetta does not replace the [official MCP Inspector](https://modelcontextprotocol.io/docs/2026-07-28/tools/inspector), [MCPJam](https://github.com/MCPJam/inspector), Pact, hosted observability, LLM-as-judge evaluation, or a complete MCP conformance suite. Full Streamable HTTP session semantics, OAuth workflows, signed manifests, schema-aware assertions, and semantic evaluation remain intentionally outside the current local-first scope.

## Contributing

Start with [`CONTRIBUTING.md`](CONTRIBUTING.md), run the quality gate, and include a reproducible fixture for behavior changes. Changes to the cassette format, redaction rules, replay semantics, or exit codes require explicit tests and documentation. Never include real secrets or customer data in issues, pull requests, or fixtures.

## Roadmap

The next milestones are an MCP SDK-native stdio proxy, full Streamable HTTP session semantics, signed cassette manifests, schema-aware contract assertions, a human-readable replay report, and a GitHub Action that uploads a compact diff artifact on failure. These extensions are designed around the existing ports rather than a rewrite.

## License

Cassetta is released under the MIT License. See [`LICENSE`](LICENSE).
