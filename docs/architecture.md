# Architecture

## Problem

A governed enterprise workflow may need to operate when a device is disconnected,
when data cannot leave a local boundary, or when a platform subscription becomes
stale. Treating those states as incidental networking concerns produces fragile
systems. This reference makes them domain decisions.

## Boundaries

### Policy router

`routeTask` selects `foundry`, `local`, or `deny` from declared sensitivity,
connectivity, and capability requirements. A policy conflict is denied instead
of falling through to an unapproved runtime.

The included policy is illustrative. Production classification rules should be
owned by security and data-governance teams, versioned, and tested against the
organization's controls.

### Foundry adapter

This repository does not pretend that a generic object is a live Foundry
connection. A production implementation should introduce a narrow adapter built
from the organization's generated TypeScript OSDK, approved REST endpoints, or
another supported integration surface.

The adapter owns:

- OAuth client configuration and requested scopes
- Ontology object and action mappings
- Application resource restrictions
- Subscription lifecycle translation
- Tenant-specific network and egress configuration

No credentials, tenant URLs, ontology identifiers, or customer records belong
in this public repository.

### Local inference

`LocalInferenceClient` accepts loopback endpoints only. That provides a
testable minimum definition of “local” and prevents configuration from quietly
pointing at a remote inference service. Production deployments may replace this
with an approved private-network policy.

### Offline queue

`OfflineMutationQueue` deduplicates mutations by idempotency key. Successfully
applied mutations are removed; conflicts remain available for explicit
resolution. An implementation for durable use should encrypt the queue at rest,
persist it transactionally, cap its size, and define retention.

### Resilient subscription

`startResilientSubscription` reloads the authoritative view when a subscription
reports that it is out of date or fails. This mirrors the recovery obligation in
the TypeScript OSDK subscription model without importing tenant-specific code.

## Evidence

Critical decisions produce structured evidence records with the task, event,
time, reason, and outcome. In production, send these records to an append-only
audit sink with authenticated actor, policy version, correlation id, and
retention metadata.

## TARX route truth mapping

This repository maps placement decisions onto TARX runtimes without claiming a
production TARX or Palantir connector:

| Policy target | TARX runtime | Notes |
| --- | --- | --- |
| `local` | `computer` | Device-local default |
| `foundry` | `private` | Enterprise-governed plane |
| `deny` | `deny` | No silent remote fallback |
| *(explicit only)* | `supercomputer` | Requires `approveSupercomputerEscalation` |

See `src/tarx-route-map.ts` and `src/governed-action-bridge.ts` for executable
proposal / decision / result shapes aligned with
[governed-agent-contracts](https://github.com/tarx-ai/governed-agent-contracts).

## Deliberate omissions

- Live Palantir credentials or tenant configuration
- A generated OSDK, because it would encode a specific ontology
- Claims of exactly-once delivery
- Automatic conflict resolution without a domain policy
- A remote fallback disguised as local execution
- Implicit Supercomputer / cloud escalation
