# Platform service

Independent Go module for patient records, alerts, labs, FHIR API, audit and the console backend-for-frontend. The current executable provides health endpoints and an authentication-required response for protected routes. Persistent repositories, OIDC verification, authorization middleware, SSE and audit-chain adapters are not represented as connected until configured and tested.

Run `go test ./...` and `go run ./cmd/platform`. Configure the OIDC issuer before non-development startup. The service imports no other service module.
