# ADR-0002: Versioned JSONL Cassette

## Context

The selected user problem is reproducible review of JSON-RPC behavior. The artifact must be readable in Git diffs, streamable, easy to generate incrementally, and usable without a database or hosted broker.

## Decision

Keep a versioned JSONL cassette format with one header line and one entry per line. Version `1` remains supported. Entries use explicit sequence, direction, timestamp, message, optional latency, and optional string metadata. Unknown versions are rejected rather than guessed.

## Alternatives considered

A single large JSON document is simpler to parse but produces poor diffs and requires holding the whole artifact in memory. SQLite would support queries but adds a database dependency and weakens portability. Pact files and a broker solve a broader consumer/provider problem but are not a direct fit for local MCP session replay.

## Trade-offs

JSONL requires explicit line-level validation and does not provide arbitrary indexed queries. Those costs are acceptable for a bounded evidence artifact and can be addressed later with derived reports rather than changing the source format.

## Consequences

Serialization, parsing, sequence validation, and redaction are public contracts. Any format extension must be additive or accompanied by a version change and migration note.
