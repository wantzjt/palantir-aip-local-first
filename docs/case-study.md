# Case Study: Governed AI That Still Works at the Edge

## Design question

How should an AI system behave when enterprise governance, sensitive data, and
intermittent connectivity all constrain where work can run?

John Wantz Jr. designed and implemented this public reference architecture to
make the answer inspectable. The goal was not to simulate a Palantir tenant. It
was to prove the system seams that a production Foundry integration must get
right.

## Decisions

### Make denial a valid result

Many routers choose between two execution targets. This one includes `deny`.
When restricted data is marked as requiring a governed remote workflow, the
contradiction is surfaced instead of silently choosing convenience over policy.

### Define “local” in code

A model endpoint is local only when the client verifies a loopback address.
That narrow definition is intentionally enforceable. A production private-edge
deployment can substitute a signed network policy without changing callers.

### Preserve intent while offline

Queued writes carry an idempotency key and base version. Successful replays
leave the queue; conflicts remain visible. This avoids both duplicate actions
and fake claims of seamless synchronization.

### Recover the view

Real-time subscriptions become stale and fail. The adapter reloads authoritative
state and records recovery evidence, matching the lifecycle responsibilities
documented for TypeScript OSDK subscriptions.

## Result

The repository now provides:

- a small TypeScript implementation that can be understood in one sitting;
- behavior tests for the happy path and policy failures;
- an explicit seam for a generated OSDK;
- a production-readiness checklist grounded in current public documentation;
- clean provenance and synthetic data.

## What this signals

The work demonstrates architecture across AI placement, enterprise integration,
offline systems, security boundaries, and operational evidence. It also
demonstrates restraint: the public artifact says precisely what is implemented
and labels what requires a real Foundry environment.
