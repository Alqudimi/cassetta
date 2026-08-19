# ADR-0001: Framework-Free TypeScript Core

## Context

Cassetta must be reusable from the CLI, transport adapters, tests, and future integrations without requiring a web runtime, database, provider SDK, or network access. The existing repository already uses TypeScript ESM and separates `packages/core`, `packages/transport`, and `packages/cli`.

## Decision

Keep the TypeScript ESM monorepo and maintain a framework-free `@cassetta/core`. The core owns types, normalization, redaction, JSONL serialization, cassette validation, and deterministic diff models. Process and filesystem effects remain outside the core.

## Alternatives considered

A Python rewrite would be viable for CLI distribution but would discard existing working code and reduce alignment with the MCP TypeScript ecosystem. A browser-first application would improve interactive presentation but would make the critical path dependent on a runtime that is not needed for local CI. A single undifferentiated package would be simpler initially but would make boundaries and tests less clear.

## Trade-offs

The monorepo has a small amount of package wiring and explicit relative imports. In exchange, domain invariants are easy to test in isolation and future transports can reuse the same contract.

## Consequences

New domain behavior must be added to `packages/core` first. CLI and transport code may depend on core, but core may not import them or perform I/O.
