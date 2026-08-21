# Changelog

All notable changes to Cassetta are documented here.

## [0.7.0] — 2026-08-21

This release adds a deliberately small schema-aware contract assertion engine. Contracts can pin cassette entry direction, method, required properties, enums, array bounds, and nested object shapes; the CLI exposes `assert` with JSON and SARIF output and exits non-zero on drift. Core tests cover matching contracts, actionable failures, unsupported versions, and the CLI smoke path runs a passing contract in CI.

## [0.6.0] — 2026-08-20

This release adds deterministic Ed25519 cassette manifests. The core signs a canonical behavior payload that excludes volatile timestamps, stores only digest, algorithm, key ID, and signature, and verifies tampering or wrong keys without introducing a runtime dependency. The CLI exposes `sign` and `verify-signature`, and the repository smoke path exercises key generation, signing, and verification in CI.

## [0.5.1] — 2026-08-19

This patch release carries the bounded HTTP JSON-RPC capture adapter and the merged Forge hardening baseline under a tag newer than the existing v0.5.0 release. It keeps endpoint validation, timeout and payload limits, typed transport errors, SARIF output, cassette validation, and the full CLI smoke gate in the published state.

## [0.5.0] — 2026-08-19

This release adds a bounded HTTP JSON-RPC capture adapter with endpoint validation, caller-injected fetch support, a 10-second default timeout, a 1 MiB response limit, redaction-before-persistence, and typed failures for invalid endpoints, timeouts, non-2xx responses, invalid JSON, and oversized payloads. Transport coverage now includes stdio, HTTP, and offline replay paths.

The same release line also includes typed cassette-format errors with line and sequence context, request-aware offline replay, stable CLI exit codes, SARIF-shaped diff output, stronger stdio failure handling, a repository-level CLI smoke path, architecture contracts, ADRs, a threat model, a verification record, and a tag-triggered release workflow.

## [0.4.0] — 2026-08-18

This release packages the CLI as an installable `@cassetta/cli` artifact with a `cassetta` bin entry, a Node.js 20 engine requirement, a reproducible esbuild bundle, and a tarball verification path. The root build now produces the CLI executable alongside the web build, so the release can be exercised as a user-facing command rather than only through TypeScript sources.

## [0.3.0] — 2026-08-17

This release adds a strict offline replay runner that returns recorded responses without starting a provider, reports request drift with cassette sequence context, expands transport coverage to four tests, and adds a formatting guard to local scripts and CI. The existing stdio capture path remains unchanged and continues to redact before persistence.

## [0.2.0] — 2026-08-16

This release adds a local line-delimited JSON-RPC stdio transport boundary. It captures ordered request/response pairs into the existing cassette core, applies normalization and secret redaction before persistence, exposes the `capture-stdio` CLI command, and verifies the path with a local fixture E2E test. Streamable HTTP, MCP SDK-native transport integration, and offline replay execution remain planned.

## [0.1.0] — 2026-08-16

Initial Cassetta release with the framework-free core, JSONL cassette format, deterministic normalization, redaction, diffs, initial CLI commands, product surface, and Open Source governance files.
