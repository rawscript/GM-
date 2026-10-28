CREATE TABLE IF NOT EXISTS patients (
    patient_id text PRIMARY KEY,
    site_id text NOT NULL,
    enrolment_state text NOT NULL,
    status text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alert_events (
    alert_id text PRIMARY KEY,
    patient_id text NOT NULL REFERENCES patients(patient_id),
    tier text NOT NULL,
    state text NOT NULL,
    trigger_summary jsonb NOT NULL,
    configuration_version text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
    audit_id bigserial PRIMARY KEY,
    actor_id text NOT NULL,
    action text NOT NULL,
    record_id text NOT NULL,
    occurred_at timestamptz NOT NULL,
    previous_hash text NOT NULL,
    entry_hash text NOT NULL UNIQUE,
    details jsonb NOT NULL
);

CREATE OR REPLACE FUNCTION reject_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'audit entries are append only';
END;
$$;

DROP TRIGGER IF EXISTS audit_log_no_update ON audit_log;
CREATE TRIGGER audit_log_no_update BEFORE UPDATE OR DELETE ON audit_log FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();
