-- Clinical Documentation Risk Intelligence EHR — PostgreSQL schema
-- Prototype schema. Synthetic data only. Not for clinical use.

DROP SCHEMA IF EXISTS ehr CASCADE;
CREATE SCHEMA ehr;
SET search_path TO ehr, public;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ---------------------------------------------------------------- org / facility
CREATE TABLE organization (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE facility (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name          text NOT NULL,
  code          text NOT NULL,
  city          text,
  state         text
);

CREATE TABLE unit (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id   uuid NOT NULL REFERENCES facility(id) ON DELETE CASCADE,
  name          text NOT NULL,
  type          text,
  beds          int NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------- identity / rbac
CREATE TABLE role (
  id            text PRIMARY KEY,          -- 'nurse', 'physician', 'don', ...
  name          text NOT NULL,
  description   text
);

CREATE TABLE app_user (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  credentials   text,
  role_id       text NOT NULL REFERENCES role(id),
  email         citext UNIQUE,
  facility_id   uuid REFERENCES facility(id),
  unit_id       uuid REFERENCES unit(id),
  status        text NOT NULL DEFAULT 'active',
  last_login    timestamptz,
  avatar_color  text,
  password_hash text
);

CREATE TABLE permission (
  id            text PRIMARY KEY,          -- 'view_patient', 'sign_note', ...
  label         text NOT NULL
);

CREATE TABLE role_permission (
  role_id       text REFERENCES role(id) ON DELETE CASCADE,
  permission_id text REFERENCES permission(id) ON DELETE CASCADE,
  allowed       boolean NOT NULL DEFAULT true,
  PRIMARY KEY (role_id, permission_id)
);

-- ---------------------------------------------------------------- patients / encounters
CREATE TABLE patient (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mrn                      text UNIQUE NOT NULL,
  first_name               text NOT NULL,
  last_name                text NOT NULL,
  dob                      date NOT NULL,
  sex                      text NOT NULL,
  facility_id              uuid NOT NULL REFERENCES facility(id),
  unit_id                  uuid NOT NULL REFERENCES unit(id),
  room                     text,
  attending_id             uuid REFERENCES app_user(id),
  primary_nurse_id         uuid REFERENCES app_user(id),
  admission_date           timestamptz,
  admission_status         text NOT NULL DEFAULT 'admitted',
  discharge_date           timestamptz,
  diagnoses                jsonb NOT NULL DEFAULT '[]',
  allergies                jsonb NOT NULL DEFAULT '[]',
  documentation_risk_score int NOT NULL DEFAULT 0,
  documentation_compliance int NOT NULL DEFAULT 100
);
CREATE INDEX patient_facility_idx ON patient(facility_id);
CREATE INDEX patient_unit_idx ON patient(unit_id);

CREATE TABLE encounter (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    uuid NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  facility_id   uuid NOT NULL REFERENCES facility(id),
  type          text NOT NULL,
  admitted_at   timestamptz NOT NULL,
  discharged_at timestamptz,
  reason        text
);

-- ---------------------------------------------------------------- clinical documentation
CREATE TABLE clinical_note (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        uuid NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  type              text NOT NULL,
  title             text NOT NULL,
  author_id         uuid REFERENCES app_user(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  signed_at         timestamptz,
  status            text NOT NULL DEFAULT 'draft',
  fields            jsonb NOT NULL DEFAULT '{}',
  version_history   jsonb NOT NULL DEFAULT '[]'
);

CREATE TABLE note_addendum (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id       uuid NOT NULL REFERENCES clinical_note(id) ON DELETE CASCADE,
  author_id     uuid REFERENCES app_user(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  text          text NOT NULL
);

CREATE TABLE assessment (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        uuid NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  type              text NOT NULL,
  last_completed_at timestamptz,
  due_at            timestamptz NOT NULL,
  status            text NOT NULL DEFAULT 'incomplete',
  completed_by_id   uuid REFERENCES app_user(id),
  completion_percent int NOT NULL DEFAULT 0,
  score             int,
  risk_category     text,
  fields            jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE care_plan (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id            uuid NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  name                  text NOT NULL,
  status                text NOT NULL DEFAULT 'active',
  problem               text,
  goal                  text,
  interventions         jsonb NOT NULL DEFAULT '[]',
  responsible_discipline text,
  target_date           date,
  latest_patient_response text,
  last_reviewed_at      timestamptz,
  next_review_at        timestamptz,
  signatures            jsonb NOT NULL DEFAULT '[]'
);

CREATE TABLE medication (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    uuid NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  name          text NOT NULL,
  dose          text,
  route         text,
  frequency     text,
  start_date    timestamptz,
  prescriber_id uuid REFERENCES app_user(id),
  status        text NOT NULL DEFAULT 'active',
  reconciled    boolean NOT NULL DEFAULT false,
  high_alert    boolean NOT NULL DEFAULT false
);

CREATE TABLE medication_reconciliation (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        uuid NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  encounter_id      uuid REFERENCES encounter(id),
  status            text NOT NULL DEFAULT 'not_started',
  started_at        timestamptz,
  completed_at      timestamptz,
  completed_by_id   uuid REFERENCES app_user(id),
  due_at            timestamptz NOT NULL,
  items             jsonb NOT NULL DEFAULT '[]'
);

CREATE TABLE medication_administration (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        uuid NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  medication_id     uuid REFERENCES medication(id),
  medication_name   text,
  scheduled_time    timestamptz NOT NULL,
  status            text NOT NULL DEFAULT 'due',
  administered_by_id uuid REFERENCES app_user(id),
  administered_at   timestamptz,
  note              text
);

CREATE TABLE clinical_order (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          uuid NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  name                text NOT NULL,
  type                text NOT NULL,
  ordering_provider_id uuid REFERENCES app_user(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  priority            text NOT NULL DEFAULT 'routine',
  status              text NOT NULL DEFAULT 'active',
  acknowledged_at     timestamptz,
  acknowledged_by_id  uuid REFERENCES app_user(id),
  assigned_to_id      uuid REFERENCES app_user(id)
);

CREATE TABLE lab_result (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        uuid NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  test              text NOT NULL,
  value             numeric NOT NULL,
  units             text,
  reference_low     numeric,
  reference_high    numeric,
  status            text NOT NULL DEFAULT 'normal',
  result_time       timestamptz NOT NULL,
  reviewed          boolean NOT NULL DEFAULT false,
  reviewed_by_id    uuid REFERENCES app_user(id),
  reviewed_at       timestamptz,
  trend             jsonb NOT NULL DEFAULT '[]'
);

CREATE TABLE vital (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    uuid NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  type          text NOT NULL,
  value         text NOT NULL,
  unit          text,
  recorded_at   timestamptz NOT NULL,
  recorded_by_id uuid REFERENCES app_user(id),
  series        jsonb NOT NULL DEFAULT '[]'
);

-- ---------------------------------------------------------------- risk engine
CREATE TABLE risk_rule (
  id                text PRIMARY KEY,        -- 'RX-ADM-001'
  name              text NOT NULL,
  category          text NOT NULL,
  trigger           text NOT NULL,
  requirement       text NOT NULL,
  deadline_hours    int NOT NULL,
  severity          text NOT NULL,
  escalation        jsonb NOT NULL DEFAULT '[]',
  responsible_role  text NOT NULL,
  scope             text NOT NULL DEFAULT 'All Facilities',
  evaluation_type   text NOT NULL DEFAULT 'Deterministic',
  version           int NOT NULL DEFAULT 1,
  status            text NOT NULL DEFAULT 'draft',
  updated_at        timestamptz NOT NULL DEFAULT now(),
  updated_by_id     uuid REFERENCES app_user(id)
);

CREATE TABLE risk_finding (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        uuid NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  facility_id       uuid NOT NULL REFERENCES facility(id),
  unit_id           uuid NOT NULL REFERENCES unit(id),
  rule_id           text NOT NULL REFERENCES risk_rule(id),
  rule_version      int NOT NULL,
  title             text NOT NULL,
  description       text,
  category          text NOT NULL,
  severity          text NOT NULL,
  priority_score    int NOT NULL DEFAULT 0,
  score_breakdown   jsonb NOT NULL DEFAULT '[]',
  status            text NOT NULL DEFAULT 'detected',
  assigned_user_id  uuid REFERENCES app_user(id),
  detected_at       timestamptz NOT NULL DEFAULT now(),
  due_at            timestamptz NOT NULL,
  is_overdue        boolean NOT NULL DEFAULT false,
  is_ai_generated   boolean NOT NULL DEFAULT false,
  confidence        numeric,
  evidence          jsonb NOT NULL DEFAULT '[]',
  why_flagged       text,
  recommended_action text,
  recommended_action_link text,
  source_refs       jsonb NOT NULL DEFAULT '[]',
  verified_by_id    uuid REFERENCES app_user(id)
);
CREATE INDEX finding_status_idx  ON risk_finding(status);
CREATE INDEX finding_severity_idx ON risk_finding(severity);
CREATE INDEX finding_patient_idx ON risk_finding(patient_id);
CREATE INDEX finding_facility_idx ON risk_finding(facility_id);

CREATE TABLE finding_timeline_event (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id    uuid NOT NULL REFERENCES risk_finding(id) ON DELETE CASCADE,
  at            timestamptz NOT NULL DEFAULT now(),
  actor_id      uuid REFERENCES app_user(id),
  actor_name    text,
  type          text NOT NULL,
  description   text NOT NULL
);

CREATE TABLE task (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title             text NOT NULL,
  patient_id        uuid REFERENCES patient(id) ON DELETE CASCADE,
  related_finding_id uuid REFERENCES risk_finding(id) ON DELETE SET NULL,
  priority          text NOT NULL DEFAULT 'medium',
  assigned_to_id    uuid REFERENCES app_user(id),
  due_at            timestamptz,
  status            text NOT NULL DEFAULT 'open',
  created_at        timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz
);

CREATE TABLE exception_request (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id    uuid NOT NULL REFERENCES risk_finding(id) ON DELETE CASCADE,
  patient_id    uuid NOT NULL REFERENCES patient(id),
  requested_by_id uuid REFERENCES app_user(id),
  reason        text NOT NULL,
  status        text NOT NULL DEFAULT 'pending',
  created_at    timestamptz NOT NULL DEFAULT now(),
  history       jsonb NOT NULL DEFAULT '[]'
);

CREATE TABLE false_positive_review (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id    uuid NOT NULL REFERENCES risk_finding(id) ON DELETE CASCADE,
  patient_id    uuid NOT NULL REFERENCES patient(id),
  finding_type  text,
  submitted_by_id uuid REFERENCES app_user(id),
  reason        text,
  ai_confidence numeric,
  status        text NOT NULL DEFAULT 'pending'
);

-- ---------------------------------------------------------------- governance
CREATE TABLE ai_analysis (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature             text NOT NULL,
  model               text NOT NULL,
  version             text NOT NULL,
  purpose             text,
  status              text NOT NULL DEFAULT 'active',
  last_validation     timestamptz,
  enabled_facility_ids jsonb NOT NULL DEFAULT '[]'
);

CREATE TABLE audit_event (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  at            timestamptz NOT NULL DEFAULT now(),
  user_id       uuid REFERENCES app_user(id),
  user_name     text,
  role          text,
  action        text NOT NULL,
  module        text NOT NULL,
  patient_id    uuid REFERENCES patient(id),
  entity        text,
  details       text,
  ip            inet,
  session       text
);
CREATE INDEX audit_at_idx ON audit_event(at DESC);

CREATE TABLE notification (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  at            timestamptz NOT NULL DEFAULT now(),
  title         text NOT NULL,
  body          text,
  severity      text NOT NULL DEFAULT 'low',
  read          boolean NOT NULL DEFAULT false,
  link          text,
  user_id       uuid REFERENCES app_user(id)
);

-- ---------------------------------------------------------------- helpful views
CREATE VIEW v_open_finding AS
  SELECT * FROM risk_finding
  WHERE status IN ('detected','assigned','acknowledged','in_progress','corrected','awaiting_verification');

CREATE VIEW v_facility_compliance AS
  SELECT f.id AS facility_id, f.name,
         round(avg(p.documentation_compliance)) AS compliance,
         count(*) FILTER (WHERE of.severity = 'critical') AS critical_open,
         count(of.id) AS open_findings
  FROM facility f
  JOIN patient p ON p.facility_id = f.id AND p.admission_status <> 'discharged'
  LEFT JOIN v_open_finding of ON of.facility_id = f.id
  GROUP BY f.id, f.name;
