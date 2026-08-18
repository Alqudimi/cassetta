# Verification Record

## Scope

This record captures the evidence produced while hardening Cassetta as the selected Forge asset. It distinguishes actual execution from planned or unverified work.

## Verified checks

| Area | Command or evidence | Result |
|---|---|---|
| Type safety | `pnpm check` | **VERIFIED** — TypeScript completed without errors. |
| Core behavior | `pnpm vitest run --root packages/core src/index.test.ts` | **VERIFIED** — 8 tests passed, including malformed JSON, invalid direction, negative latency, normalization, redaction, JSONL round-trip, and diffs. |
| Transport behavior | `pnpm test:transport` | **VERIFIED** — 7 tests passed, including capture, timeout, malformed output, missing executable, replay success, mismatch, and malformed pairing. |
| CLI smoke | `pnpm test:cli` | **VERIFIED** — local fixture capture, check, offline replay, and equal diff completed successfully. |
| Full build | `pnpm build` | **VERIFIED** — Vite product surface, server bundle, and CLI bundle built. Vite emitted pre-existing analytics placeholder warnings. |
| Formatting | `pnpm exec prettier --check ...` | **VERIFIED** for changed implementation, docs, workflow, and package files. |
| Dependency audit | `pnpm audit --audit-level high` | **VERIFIED** — no known vulnerabilities reported by pnpm at audit time. |
| Secret pattern scan | `git grep` scan excluding lockfile | **VERIFIED** — no credential-like patterns remained after synthetic fixtures were changed to angle-bracket placeholders. |
| Diff hygiene | `git diff --check` | **VERIFIED** — no whitespace errors. |
| SARIF output | `cassetta diff ... --sarif` | **VERIFIED** — emitted SARIF 2.1.0-shaped JSON with tool metadata and invocation status. |
| Failure exit codes | malformed check, replay mismatch, empty capture, missing command | **VERIFIED** — observed exit codes `2`, `1`, `2`, and `2` respectively. |
| Offline check baseline | 20 repeated `cassetta check` runs on a captured local cassette | **VERIFIED** — elapsed 0.921 seconds, user 0.760 seconds, system 0.173 seconds in the sandbox; this is a local smoke baseline, not a cross-machine benchmark. |

## Failure evidence

The malformed cassette produced `Invalid sequence at line 2: expected 1, received 2` and exit code `2`. A replay request drift produced `Request mismatch at replay pair 1; inspect the cassette diff before retrying` and exit code `1`. A missing executable produced `The stdio server stream failed` and exit code `2`. These are intentional, actionable failures rather than silent success.

## Security scope and limitations

The implementation uses argv-based child-process spawning with `shell: false`, bounded response timeouts, redaction before cassette persistence, and data-only replay. The secret scan checks common credential patterns, but no static secret scanner can prove that arbitrary business-sensitive content is absent. Users must still review cassettes and prefer synthetic fixtures.

The current MVP does not claim full MCP protocol conformance, OAuth correctness, semantic equivalence, sandboxing, or protection against a malicious local executable explicitly supplied by the user. Those are documented boundaries, not missing evidence disguised as success.

## Partially verified or not verified

| Area | Status | Reason |
|---|---|---|
| GitHub Actions execution on the hosted runner | **PARTIALLY VERIFIED** | Workflow configuration was inspected and updated, but a hosted Actions run was not triggered in this local session. |
| Package tarball installation from a clean checkout | **VERIFIED** | `@cassetta/cli@0.4.0` was packed, installed into an isolated npm prefix, and its installed `cassetta` binary passed `--help` and `check`. |
| SARIF upload to GitHub Code Scanning | **NOT VERIFIED** | Output generation was tested, but upload requires repository permissions and a hosted workflow run. |
| Cross-platform behavior | **NOT VERIFIED** | Tests ran on Ubuntu only. |
| Streamable HTTP and OAuth transport | **NOT VERIFIED** | Intentionally outside the MVP transport boundary. |

## Reproduction

From a clean checkout, install locked dependencies with `pnpm install --frozen-lockfile`, then run `pnpm check`, `pnpm test:core`, `pnpm test:transport`, `pnpm test:cli`, `pnpm build`, and `pnpm audit --audit-level high`. The documented local fixture commands in the README should produce the same capture, check, replay, and diff path.
