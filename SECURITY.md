# Security

## Reporting

Please report suspected vulnerabilities privately through GitHub Security
Advisories. Do not open a public issue containing credentials, customer data, or
exploit details.

## Scope

This repository is a reference implementation using synthetic data. It is not a
hosted service and does not include a live Palantir connection.

Never commit:

- Palantir client secrets, tokens, enrollment secrets, or tenant URLs
- Generated clients containing non-public ontology details
- Customer or operational data
- Local model inputs or outputs containing regulated information

Before production use, perform a threat model, replace in-memory storage with an
encrypted durable implementation, authenticate evidence, pin dependencies, and
complete the readiness checklist in `docs/palantir-readiness.md`.
