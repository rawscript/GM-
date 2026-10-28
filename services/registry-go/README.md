# Registry service

Independent Go module boundary for identity details and patient-ID mappings. Startup intentionally fails without a key management endpoint. Implementations must use a separate database and network identity, field-level envelope encryption, purpose-bound reveal grants, audit-before-return, subject request workflows and key rotation. No identity data or reveal API is currently served.
