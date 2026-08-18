## Problem

Describe the user or maintainer problem this change addresses.

## Design boundary

Explain which package owns the behavior and why the change does not belong in another layer.

## Verification

List the exact commands run and their results. Include unit, integration, packaging, security, or performance evidence when relevant.

## Risk and rollout

Describe compatibility concerns, cassette format impact, failure behavior, and any follow-up work that remains intentionally out of scope.

## Checklist

- [ ] Tests cover the happy path and at least one failure path.
- [ ] Documentation and changelog are updated when behavior changes.
- [ ] No secrets or real customer payloads are included.
- [ ] `pnpm check`, `pnpm format:check`, and relevant tests pass.
