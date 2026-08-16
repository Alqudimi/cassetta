# Security Policy

## Supported versions

Only the latest `main` branch and the latest tagged release receive security fixes.

## Reporting a vulnerability

Please do not open a public issue for a security vulnerability. Use a private GitHub security advisory or contact the maintainer through the repository profile with a concise description, reproduction steps, impact, and a safe way to verify the fix.

Never include real API keys, access tokens, customer data, or private cassette payloads in a report. Cassetta is designed to redact common secrets, but redaction is not a substitute for reviewing a fixture before committing it.

## Security design notes

The core performs no network access, defaults to redacting common credential-shaped fields, and treats cassette files as untrusted input. Future transport adapters must preserve these boundaries and add explicit limits for payload size, path handling, and subprocess execution.
