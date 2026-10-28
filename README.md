# GM System monorepo

The GM System is designed as a screening, monitoring and triage aid. It does not diagnose. Laboratory confirmation remains with national laboratories. Wrist temperature is skin temperature and is shown as a trend against an individual baseline. Electronic-nose data stays in shadow-mode research and cannot alter decisions. ADaM owns official outbreak cases and status.

## Repository map

- `apps/web` is the frontend package boundary. Its current source remains in `src` during the migration; the browser console uses `/api/v1`, OIDC redirect endpoints, same-site cookies and server-sent events.
- `services/gateway-go` is the device ingestion boundary.
- `services/platform-go` is the patient, alert, laboratory, audit and console API boundary.
- `services/registry-go` is the isolated identity registry boundary and fails closed without key management configuration.
- `services/adam-adapter-go` is the ADaM export and notification boundary. Monitoring links and profile control remain gated on interface confirmation.
- `services/insight-py` contains de-identified aggregate logic and small-cell suppression. Learned risk scoring is not implemented.
- `contracts` is the source for REST, event and gRPC interfaces.
- `infra` contains local Compose, migrations and Kubernetes starting manifests.
- `compliance` contains control evidence, approval gates, processing records, threat and risk artefacts.
- `tools` contains contract checks and repository tools.

Each service has its own module and README. Services must communicate through versioned contracts, not imports. Generated code is reproducible and must not be hand edited.

## Local setup

Install Node.js 22, Go 1.23+, Python 3.12+, Docker Compose and Buf. Install JavaScript dependencies with `npm install`. Create an untracked `.env` containing `GM_PLATFORM_DB_PASSWORD`, `GM_REGISTRY_DB_PASSWORD`, `KEYCLOAK_ADMIN` and `KEYCLOAK_PASSWORD`. Start infrastructure using `docker compose -f infra/compose.yaml up --build`. Configure local development issuer, device certificates, broker credentials and encryption adapter before exercising protected service routes. The registry and ADaM adapter intentionally do not start as operational services without encryption and integration configuration.

## Contract workflow

Edit the OpenAPI, JSON Schema or protobuf source under `contracts`; run `buf lint contracts` and `python tools/check_contracts.py`; regenerate clients with `buf generate contracts` and the service-specific OpenAPI generators once pinned generator configuration is added. Review compatibility with `buf breaking` before merging. Do not edit generated files.

## Add an endpoint

Add the API definition to `contracts/openapi`, regenerate clients, implement a use case under the service application layer, define ports for persistence or external systems, implement adapters, then add role, site, schema and audit tests. Keep HTTP transport and RFC 9457 error mapping in the API adapter.

## Add an event

Define the JSON Schema under `contracts/events` with `additionalProperties: false`, a unique message identifier, original event time and receipt time as appropriate. Wearable events carry summaries, sequence numbers, signal quality and baseline deviation. Raw sensor streams and identity details do not enter shared events.

## Add a rule

Implement a pure domain rule with an explicit configuration version, typed input and output, then add exhaustive transition and property tests. Clinical thresholds require a signed, versioned configuration from the agreed clinical protocol. Never add a learned-risk endpoint without clinical oversight and labelled outcomes.

## Add a migration

Create a forward migration under `infra/migrations`, test it on a seeded disposable database and rehearse rollback in staging. Audit tables are append-only to application roles. Platform and registry remain separate databases with separate credentials.

## Add a compliance control

Add the requirement and evidence path to `compliance/control-traceability.csv`, link it to an automated test or deployment gate, and update the relevant risk, processing or DPIA artefact. Do not mark authority approval complete without documented evidence.

## Build and verification

`make lint`, `make test`, `make test-contract`, `make test-e2e`, `make scan` and `make up` expose repository tasks. Quality workflows run Go, Python, web and contract checks. This repository currently contains service skeletons and contract targets; real persistence, OIDC verification, mTLS ingestion, key management, FHIR profile alignment, live ADaM exchange, complete generated clients and deployment security review still require implementation and verification. No deployment, validation or regulatory approval is claimed.
