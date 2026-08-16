# Changelog

All notable changes to Cassetta are documented here.

## [0.2.0] — 2026-08-16

This release adds a local line-delimited JSON-RPC stdio transport boundary. It captures ordered request/response pairs into the existing cassette core, applies normalization and secret redaction before persistence, exposes the `capture-stdio` CLI command, and verifies the path with a local fixture E2E test. Streamable HTTP, MCP SDK-native transport integration, and offline replay execution remain planned.

## [Unreleased]

### Added

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
