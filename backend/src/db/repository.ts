/**
 * Thin repository helpers over the `ehr` schema. Routes call these; they never
 * embed SQL directly. Column names are mapped to the camelCase shape the React
 * app already expects so the frontend service layer can point straight here.
 */
import { withSchema } from './pool.js';

const OPEN = `('detected','assigned','acknowledged','in_progress','corrected','awaiting_verification')`;

export const findings = {
  async list(filter: { facilityId?: string; severity?: string; status?: string } = {}) {
    return withSchema(async (c) => {
      const where: string[] = [];
      const params: unknown[] = [];
      if (filter.facilityId) {
        params.push(filter.facilityId);
        where.push(`f.facility_id = $${params.length}`);
      }
      if (filter.severity) {
        params.push(filter.severity);
        where.push(`f.severity = $${params.length}`);
      }
      if (filter.status === 'open') where.push(`f.status IN ${OPEN}`);
      else if (filter.status) {
        params.push(filter.status);
        where.push(`f.status = $${params.length}`);
      }
      const rows = await c.query(
        `SELECT f.id, f.patient_id AS "patientId", f.facility_id AS "facilityId", f.unit_id AS "unitId",
                f.rule_id AS "ruleId", f.rule_version AS "ruleVersion", f.title, f.description, f.category,
                f.severity, f.priority_score AS "priorityScore", f.score_breakdown AS "scoreBreakdown",
                f.status, f.assigned_user_id AS "assignedUserId", f.detected_at AS "detectedAt",
                f.due_at AS "dueAt", f.is_overdue AS "isOverdue", f.is_ai_generated AS "isAiGenerated",
                f.confidence, f.evidence, f.why_flagged AS "whyFlagged",
                f.recommended_action AS "recommendedAction", f.source_refs AS "sourceRefs",
                f.verified_by_id AS "verifiedById",
                p.first_name || ' ' || p.last_name AS "patientName", p.mrn
         FROM risk_finding f JOIN patient p ON p.id = f.patient_id
         ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
         ORDER BY f.priority_score DESC`,
        params,
      );
      return rows.rows;
    });
  },

  async byId(id: string) {
    return withSchema(async (c) => {
      const f = (
        await c.query(
          `SELECT f.*, p.first_name || ' ' || p.last_name AS "patientName", p.mrn
           FROM risk_finding f JOIN patient p ON p.id = f.patient_id WHERE f.id = $1`,
          [id],
        )
      ).rows[0];
      if (!f) return null;
      const timeline = (
        await c.query(`SELECT id, at, type, description, actor_name AS "actorName" FROM finding_timeline_event WHERE finding_id = $1 ORDER BY at`, [id])
      ).rows;
      return { ...f, timeline };
    });
  },

  async transition(id: string, status: string, actor: { id?: string; name?: string }, note: string) {
    return withSchema(async (c) => {
      await c.query('BEGIN');
      await c.query(`UPDATE risk_finding SET status = $2, verified_by_id = CASE WHEN $2 = 'closed' THEN $3 ELSE verified_by_id END WHERE id = $1`, [id, status, actor.id ?? null]);
      await c.query(
        `INSERT INTO finding_timeline_event(finding_id, type, description, actor_id, actor_name)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, status === 'closed' ? 'closed' : 'reevaluated', note, actor.id ?? null, actor.name ?? 'System'],
      );
      await c.query(
        `INSERT INTO audit_event(user_id, user_name, role, action, module, entity, details)
         VALUES ($1, $2, 'Director of Nursing', $3, 'Risk', 'RiskFinding', $4)`,
        [actor.id ?? null, actor.name ?? 'System', `Finding ${status}`, note],
      );
      await c.query('COMMIT');
      return findings.byId(id);
    });
  },
};

export const patients = {
  list: () =>
    withSchema(async (c) =>
      (
        await c.query(
          `SELECT p.id, p.mrn, p.first_name AS "firstName", p.last_name AS "lastName", p.dob, p.sex,
                  p.facility_id AS "facilityId", p.unit_id AS "unitId", p.room,
                  p.admission_date AS "admissionDate", p.admission_status AS "admissionStatus",
                  p.diagnoses, p.allergies,
                  p.documentation_risk_score AS "documentationRiskScore",
                  p.documentation_compliance AS "documentationCompliance",
                  (SELECT count(*) FROM risk_finding f WHERE f.patient_id = p.id AND f.status IN ${OPEN}) AS "openFindings"
           FROM patient p ORDER BY p.documentation_risk_score DESC`,
        )
      ).rows,
    ),
  byId: (id: string) => withSchema(async (c) => (await c.query(`SELECT * FROM patient WHERE id = $1`, [id])).rows[0] ?? null),
};

export const rules = {
  list: () => withSchema(async (c) => (await c.query(`SELECT * FROM risk_rule ORDER BY updated_at DESC`)).rows),
  byId: (id: string) => withSchema(async (c) => (await c.query(`SELECT * FROM risk_rule WHERE id = $1`, [id])).rows[0] ?? null),
};

export const audit = {
  list: (limit = 100) =>
    withSchema(async (c) => (await c.query(`SELECT * FROM audit_event ORDER BY at DESC LIMIT $1`, [limit])).rows),
};

export const dashboard = {
  kpis: () =>
    withSchema(async (c) => {
      const q = await c.query(`
        SELECT
          (SELECT round(avg(documentation_compliance)) FROM patient WHERE admission_status <> 'discharged') AS compliance,
          (SELECT count(*) FROM risk_finding WHERE severity = 'critical' AND status IN ${OPEN}) AS "criticalFindings",
          (SELECT count(*) FROM risk_finding WHERE status IN ${OPEN}) AS "openFindings",
          (SELECT count(DISTINCT patient_id) FROM risk_finding WHERE status IN ${OPEN}) AS "chartsRequiringReview",
          (SELECT count(*) FROM risk_finding WHERE is_overdue AND status IN ${OPEN}) AS "overdueDocumentation",
          (SELECT count(*) FROM risk_finding WHERE status = 'closed') AS "resolvedThisWeek"
      `);
      return q.rows[0];
    }),
  facilityOverview: () => withSchema(async (c) => (await c.query(`SELECT * FROM v_facility_compliance`)).rows),
};
