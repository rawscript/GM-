# STRIDE threat model

| Boundary | Threat | Control evidence |
|---|---|---|
| Checkpoint and wearable | Spoofed device, replay, tampering, repudiation, denial of service, privilege escalation | Mutual TLS, revocation checks, schema validation, message IDs, sequence checks, rate limits and audit events |
| Site gateway and phone relay | Stolen gateway identity, offline queue tampering, clock manipulation | Workload identity, encrypted store-and-forward, original and receipt times, skew flags and signed device configuration |
| Platform API and console | Session theft, broken object authorization, request abuse, event stream leakage | OIDC PKCE, http-only same-site session cookie, role and site checks at middleware and repository boundaries, SSE authorization, rate limits and CSP |
| Registry | Insider reveal, key compromise, correlation | Separate database and credentials, envelope encryption, KMS interface, time-limited purpose grant, audit-before-return and network isolation |
| ADaM adapter | Duplicate case, excess disclosure, unauthorized profile change | ADaM case ownership, exact allow-list, idempotent outbox, standalone default, feature gates and signed audit trail |
| Insight analytics | Re-identification, small cohort disclosure, clinical misuse | Aggregate-only read views, small-cell suppression, no registry access, no learned risk endpoint and no e-nose decision path |
