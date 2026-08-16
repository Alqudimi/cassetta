# Contributing to Cassetta

Thank you for helping make AI tool workflows more reproducible. Cassetta values small, reviewable changes with explicit behavioral evidence.

## Development flow

Create a focused branch, explain the problem before the implementation, and keep domain changes independent from presentation changes when possible. Use Conventional Commit prefixes such as `feat:`, `fix:`, `test:`, `docs:`, and `chore:`.

Before opening a pull request, run `pnpm check`, the focused Vitest suite, `pnpm build`, and any scenario-specific checks. New behavior should include a test for the happy path and at least one invalid or failure case. Changes to cassette format must update the format documentation and include a compatibility note.

## Pull requests

A pull request should describe the user problem, the chosen boundary, the verification commands and their results, and any follow-up work that is intentionally out of scope. Avoid screenshots as the only evidence for protocol behavior; attach a minimal fixture or test instead.

## Design principles

Keep the core framework-free, avoid network calls in unit tests, redact before persistence, prefer deterministic fixtures, and do not introduce a dependency when a small domain-specific implementation is easier to audit. For larger architectural changes, start a discussion before implementation.
