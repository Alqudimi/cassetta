# Cassetta Forge Execution Checklist

## Phase 1 — Contract hardening

- [ ] Preserve cassette v1 compatibility while adding strict validation errors.
- [ ] Add bounded JSONL parsing and deterministic serialization tests.
- [ ] Separate redaction and normalization behavior into focused, documented contracts.

## Phase 2 — Capture and replay

- [ ] Harden stdio process lifecycle, timeout cleanup, and invalid-output handling.
- [ ] Add replay request input support while preserving inspection-only replay behavior where useful.
- [ ] Add machine-readable result output and stable exit codes.

## Phase 3 — Diff and CI surface

- [ ] Add human-readable diff output with sequence/path context.
- [ ] Add SARIF output for differences and validation failures where GitHub can consume it.
- [ ] Add a minimal GitHub Action example and fixture workflow.

## Phase 4 — Failure and security verification

- [ ] Test empty, malformed, large, concurrent, timeout, invalid credentials, and unexpected-data cases.
- [ ] Verify no shell interpolation and no provider/network execution during replay.
- [ ] Run dependency and secret hygiene checks.

## Phase 5 — Open Source product surface

- [ ] Refresh README around the validated problem and first successful command.
- [ ] Add architecture, protocol, security, and contributor documentation.
- [ ] Add issue forms, pull-request template, changelog, and release workflow.

## Phase 6 — Release candidate and publication

- [ ] Install from a clean checkout and local package tarball.
- [ ] Run full quality gate and documentation command tests.
- [ ] Commit logically, push to GitHub, create release, and verify online surfaces.
