# Palantir Integration Readiness

Use this checklist before replacing the reference adapter boundary with a live
Foundry integration.

## Application and identity

- Create the application in Developer Console.
- Select OAuth scopes using least privilege.
- Restrict the application to only required Foundry resources.
- Keep client secrets in an approved secret manager.
- Separate development, test, and production registrations.

## Ontology contract

- Generate and version the TypeScript OSDK from the intended ontology.
- Map object, action, and query types at one adapter boundary.
- Define optimistic-concurrency and conflict behavior for every offline action.
- Treat breaking ontology changes as versioned API changes.
- Use synthetic fixtures in public tests.

## Subscriptions

- Handle `onOutOfDate` by reloading the authoritative view.
- Treat `onError` as a closed subscription and establish a new one deliberately.
- Add backoff, jitter, health metrics, and an operator-visible degraded state.
- Test disconnects, permission changes, and schema transitions.

## Connectivity and egress

- Configure network egress through the applicable Foundry policy and approval
  process.
- Use an agent proxy when the target service is not reachable from the public
  internet and the deployment architecture calls for it.
- Allow-list exact destinations and protocols.
- Verify that “local” inference cannot resolve to an unapproved remote host.

## Security and operations

- Encrypt durable offline state.
- Sign or authenticate mutation envelopes.
- Record policy version, actor, and correlation id in evidence.
- Redact sensitive data from logs and model traces.
- Define queue retention, replay limits, and manual conflict escalation.
- Threat-model prompt injection and untrusted model output before actions run.

## Release evidence

- CI typechecks and tests the adapter and failure modes.
- Dependency and secret scanning are enabled.
- A named owner approves ontology and permission changes.
- Rollback and credential-rotation procedures are rehearsed.
- Production claims link to measured evidence, not architectural intent.
