# Gateway service

Independent Go module for device and site ingestion. The current executable provides health and readiness endpoints and fails closed on missing mutual TLS configuration outside development. MQTT, HTTPS mTLS, schema validation, deduplication persistence and transactional outbox adapters are contract-driven work that require provisioned certificates, broker and PostgreSQL configuration.

Run `go test ./...` and `go run ./cmd/gateway`. The service imports no other service module.
