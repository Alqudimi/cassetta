# Changelog

All notable changes to Cassetta are documented here.

## [0.4.0] — 2026-08-18

This release packages the CLI as an installable `@cassetta/cli` artifact with a `cassetta` bin entry, a Node.js 20 engine requirement, a reproducible esbuild bundle, and a tarball verification path. The root build now produces the CLI executable alongside the web build, so the release can be exercised as a user-facing command rather than only through TypeScript sources.

## [0.3.0] — 2026-08-17

This release adds a strict offline replay runner that returns recorded responses without starting a provider, reports request drift with cassette sequence context, expands transport coverage to four tests, and adds a formatting guard to local scripts and CI. The existing stdio capture path remains unchanged and continues to redact before persistence.

## [0.2.0] — 2026-08-16

This release adds a local line-delimited JSON-RPC stdio transport boundary. It captures ordered request/response pairs into the existing cassette core, applies normalization and secret redaction before persistence, exposes the `capture-stdio` CLI command, and verifies the path with a local fixture E2E test. Streamable HTTP, MCP SDK-native transport integration, and offline replay execution remain planned.

## [Unreleased]

### Added

- Typed cassette-format errors with line and sequence context, strict direction and latency validation, and deterministic JSONL checks.
- Request-aware offline replay in the CLI with stable exit codes and SARIF-shaped diff output.
- Stdio failure handling for timeouts, invalid JSON, missing executables, stream errors, and guaranteed cleanup.
- A repository-level CLI smoke command and CI quality-gate step covering capture, check, replay, and equal diff.
- Architecture contract, ADRs, threat model, failure matrix, verification record, and a product-focused README.

- Framework-free TypeScript core for typed protocol entries.
- Deterministic normalization for volatile IDs, timestamps, and object ordering.
- Default secret redaction for common credential keys and bearer-like values.
- JSONL cassette serialization and validation.
- Deterministic entry diffing with same, added, removed, and changed states.
- Initial CLI commands for record, replay, diff, and check.
- Product landing page and open-source governance documentation.

### Planned

- Transparent MCP stdio capture and replay adapter.
- Streamable HTTP transport support.
- Schema-aware contract assertions and GitHub Action packaging.
