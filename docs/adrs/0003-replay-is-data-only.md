# ADR-0003: Replay Is Data-Only

## Context

A regression gate must be safe to run in CI and offline. Replaying a cassette must not accidentally launch a server, invoke a tool, or make a network request. The cassette may contain arbitrary provider output and must be treated as untrusted data.

## Decision

`replay` compares caller-supplied normalized requests with cassette request entries and returns recorded response data. It never spawns a process, imports provider code, follows URLs, or interprets payload text as instructions. Capture is the only path allowed to launch a user-supplied local executable, and it uses argv-based spawning, bounded timeouts, and cleanup.

## Alternatives considered

A live replay proxy could produce richer integration coverage but would expand the trust boundary and violate the local deterministic MVP. A semantic LLM judge could detect broader behavioral differences but would add non-determinism, credentials, cost, and an external dependency.

## Trade-offs

Strict replay can reject semantically compatible but structurally different behavior. This is intentional for a baseline gate; future schema-aware assertions may add flexibility without weakening the default strict contract.

## Consequences

The README must clearly distinguish capture from offline replay. Tests must demonstrate that replay does not create network requests or child processes, and mismatch failures must be non-zero and actionable.
