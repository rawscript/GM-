# Software requirements specification

| ID | Requirement | Verification |
|---|---|---|
| SYS-001 | Screening and wearable trend outputs support human review and never state a diagnosis | Copy and API contract checks |
| SYS-002 | Wearable temperature is represented only as a baseline-relative summary | Schema and UI tests |
| SYS-003 | No raw sensor streams cross service contracts | Schema additional-property and field allow-list tests |
| SYS-004 | ADaM remains authoritative for case record and status | Adapter contract tests |
| SYS-005 | Each ingestion message is idempotent and sequence gaps are visible | Replay and sequence property tests |
| SYS-006 | Identity data is accessible only through a purpose-bound reveal grant | Authorization and audit-before-return integration tests |
| SYS-007 | E-nose research data cannot influence clinical decisions | Dependency graph and import-boundary test |
| SYS-008 | National exchange remains disabled until authority gate is recorded | Deployment configuration policy test |
