/**
 * Seeds the prototype database with synthetic demonstration data.
 * Fictional names / MRNs only. Not real patient information.
 *
 * Run: npm run db:seed   (after npm run db:migrate)
 */
import 'dotenv/config';
import { pool } from './pool.js';

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();

async function main() {
  const c = await pool.connect();
  try {
    await c.query('SET search_path TO ehr, public');
    await c.query('BEGIN');

    const org = (await c.query(`INSERT INTO organization(name) VALUES ($1) RETURNING id`, ['Gulf Coast Health Partners'])).rows[0].id;

    const facilities: Record<string, string> = {};
    for (const [name, code, city] of [
      ['Houston North', 'HN', 'Houston'],
      ['Houston West', 'HW', 'Katy'],
      ['Stafford', 'ST', 'Stafford'],
    ]) {
      facilities[code] = (
        await c.query(`INSERT INTO facility(org_id,name,code,city,state) VALUES ($1,$2,$3,$4,'TX') RETURNING id`, [org, name, code, city])
      ).rows[0].id;
    }

    const units: Record<string, string> = {};
    for (const [key, fac, name, type, beds] of [
      ['HN-A', 'HN', 'Unit A', 'Med-Surg', 28],
      ['HN-B', 'HN', 'Unit B', 'Telemetry', 24],
      ['HW-A', 'HW', 'Unit A', 'Med-Surg', 26],
      ['HW-ICU', 'HW', 'ICU', 'Critical Care', 14],
      ['ST-A', 'ST', 'Unit A', 'Med-Surg', 30],
      ['ST-C', 'ST', 'Unit C', 'Rehab', 22],
    ] as const) {
      units[key] = (
        await c.query(`INSERT INTO unit(facility_id,name,type,beds) VALUES ($1,$2,$3,$4) RETURNING id`, [facilities[fac], name, type, beds])
      ).rows[0].id;
    }

    for (const [id, name, desc] of [
      ['nurse', 'Nurse', 'Bedside RN'],
      ['physician', 'Physician', 'Attending / consulting provider'],
      ['don', 'Director of Nursing', 'Owns the risk command center'],
      ['charge', 'Charge Nurse', 'Unit-level triage'],
      ['compliance', 'Compliance', 'Audit and AI governance'],
      ['admin', 'Administrator', 'System configuration'],
    ]) {
      await c.query(`INSERT INTO role(id,name,description) VALUES ($1,$2,$3)`, [id, name, desc]);
    }

    for (const [id, label] of [
      ['view_patient', 'View Patient'],
      ['edit_patient', 'Edit Patient'],
      ['create_notes', 'Create Notes'],
      ['sign_notes', 'Sign Notes'],
      ['add_addendum', 'Add Addendum'],
      ['view_risk', 'View Risk'],
      ['assign_risk', 'Assign Risk'],
      ['verify_risk', 'Verify Risk'],
      ['manage_rules', 'Manage Rules'],
      ['view_staff_analytics', 'View Staff Analytics'],
      ['export_reports', 'Export Reports'],
      ['view_audit_logs', 'View Audit Logs'],
      ['manage_users', 'Manage Users'],
    ]) {
      await c.query(`INSERT INTO permission(id,label) VALUES ($1,$2)`, [id, label]);
    }

    const users: Record<string, string> = {};
    for (const [key, name, creds, role, email, fac, unit] of [
      ['don', 'Jennifer Adams', 'MSN, RN', 'don', 'jennifer.adams@gulfcoasthp.org', 'ST', null],
      ['rn1', 'Amanda Martinez', 'BSN, RN', 'nurse', 'amanda.martinez@gulfcoasthp.org', 'ST', 'ST-A'],
      ['rn2', 'Mark Johnson', 'RN', 'nurse', 'mark.johnson@gulfcoasthp.org', 'ST', 'ST-C'],
      ['md1', 'Dr. Robert Lee', 'MD', 'physician', 'robert.lee@gulfcoasthp.org', 'ST', null],
      ['comp', 'Emily Chen', 'RN, CHC', 'compliance', 'emily.chen@gulfcoasthp.org', 'HN', null],
      ['charge', 'Priya Nair', 'BSN, RN', 'charge', 'priya.nair@gulfcoasthp.org', 'ST', 'ST-A'],
      ['admin', 'David Okafor', '', 'admin', 'david.okafor@gulfcoasthp.org', 'HN', null],
    ] as const) {
      users[key] = (
        await c.query(
          `INSERT INTO app_user(name,credentials,role_id,email,facility_id,unit_id,status,last_login,avatar_color,password_hash)
           VALUES ($1,$2,$3,$4,$5,$6,'active',$7,'#0d9488', crypt('demo1234', gen_salt('bf'))) RETURNING id`,
          [name, creds, role, email, facilities[fac], unit ? units[unit] : null, hoursAgo(6)],
        )
      ).rows[0].id;
    }

    // ---- risk rules
    const rules: [string, string, string, string, string, number, string, string][] = [
      ['RX-ADM-001', 'Admission Medication Reconciliation', 'medication_reconciliation', 'Patient Admitted', 'Medication Reconciliation Completed', 24, 'critical', 'Deterministic'],
      ['ASM-FALL-002', 'Fall Risk Reassessment (Shift)', 'assessments', 'Shift Change', 'Fall Risk Assessment Completed This Shift', 12, 'high', 'Deterministic'],
      ['SIG-RN-003', 'RN Note Signature', 'signatures', 'Note Signed', 'Nursing note signed within 12 hours', 12, 'medium', 'Deterministic'],
      ['SIG-MD-004', 'Physician Order / Note Signature', 'signatures', 'Order Entered', 'Ordering provider signature within 8 hours', 8, 'critical', 'Deterministic'],
      ['CP-REV-005', 'Care Plan Review Cadence', 'care_plans', 'Care Plan Created', 'Care plan reviewed every 72 hours', 72, 'medium', 'Deterministic'],
      ['ORD-ACK-006', 'Order Acknowledgement', 'orders', 'Order Entered', 'Nursing acknowledgement within 2 hours', 2, 'high', 'Deterministic'],
      ['LAB-FU-007', 'Critical Lab Follow-up Documentation', 'labs', 'Lab Resulted', 'Abnormal result reviewed within 4 hours', 4, 'high', 'Deterministic'],
      ['AI-CON-010', 'Documentation Contradiction Detection', 'notes', 'Note Signed', 'Narrative consistent with interdisciplinary documentation', 24, 'medium', 'AI-Assisted'],
    ];
    for (const [id, name, cat, trig, req, dl, sev, evalType] of rules) {
      await c.query(
        `INSERT INTO risk_rule(id,name,category,trigger,requirement,deadline_hours,severity,evaluation_type,version,status,updated_by_id,escalation)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,3,'active',$9,$10)`,
        [id, name, cat, trig, req, dl, sev, evalType, users.admin, JSON.stringify([{ afterHoursOverdue: 2, notifyRole: 'Charge Nurse' }])],
      );
    }

    // ---- patients (hero + a spread)
    const firstF = ['Sarah', 'Linda', 'Patricia', 'Susan', 'Nancy', 'Karen', 'Dorothy'];
    const firstM = ['John', 'Michael', 'Robert', 'James', 'William', 'David', 'Charles'];
    const last = ['Williams', 'Smith', 'Brown', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Wilson', 'Anderson', 'Thomas'];
    const dx = ['CHF', 'Type 2 Diabetes', 'Hypertension', 'COPD', 'Atrial Fibrillation', 'Pneumonia', 'CKD Stage 3'];

    const patientIds: string[] = [];
    const hero = (
      await c.query(
        `INSERT INTO patient(mrn,first_name,last_name,dob,sex,facility_id,unit_id,room,attending_id,primary_nurse_id,admission_date,admission_status,diagnoses,allergies,documentation_risk_score,documentation_compliance)
         VALUES ('1002938','Sarah','Williams','1954-02-14','F',$1,$2,'512-A',$3,$4,$5,'admitted',$6,$7,74,82) RETURNING id`,
        [
          facilities.ST, units['ST-A'], users.md1, users.rn1, hoursAgo(27),
          JSON.stringify(['CHF', 'Type 2 Diabetes', 'Hypertension']),
          JSON.stringify([{ substance: 'Penicillin', reaction: 'Anaphylaxis', severity: 'critical' }]),
        ],
      )
    ).rows[0].id;
    patientIds.push(hero);

    for (let i = 0; i < 16; i++) {
      const sex = i % 2 ? 'F' : 'M';
      const fn = sex === 'F' ? firstF[i % firstF.length] : firstM[i % firstM.length];
      const ln = last[i % last.length];
      const facCode = ['HN', 'HW', 'ST'][i % 3];
      const unitKey = { HN: 'HN-A', HW: 'HW-A', ST: 'ST-A' }[facCode]!;
      const compliance = 70 + ((i * 7) % 28);
      const pid = (
        await c.query(
          `INSERT INTO patient(mrn,first_name,last_name,dob,sex,facility_id,unit_id,room,attending_id,primary_nurse_id,admission_date,admission_status,diagnoses,documentation_risk_score,documentation_compliance)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'admitted',$12,$13,$14) RETURNING id`,
          [
            String(1000000 + i * 137 + 41),
            fn, ln, `19${50 + (i % 20)}-0${(i % 9) + 1}-1${i % 9}`, sex,
            facilities[facCode], units[unitKey], `${200 + i}-A`, users.md1, i % 2 ? users.rn1 : users.rn2,
            hoursAgo(20 + i * 6), JSON.stringify([dx[i % dx.length], dx[(i + 2) % dx.length]]),
            Math.max(10, 100 - compliance + 12), compliance,
          ],
        )
      ).rows[0].id;
      patientIds.push(pid);
    }

    const enc = (
      await c.query(`INSERT INTO encounter(patient_id,facility_id,type,admitted_at,reason) VALUES ($1,$2,'inpatient',$3,'CHF exacerbation') RETURNING id`, [
        hero, facilities.ST, hoursAgo(27),
      ])
    ).rows[0].id;

    await c.query(
      `INSERT INTO medication_reconciliation(patient_id,encounter_id,status,started_at,due_at,items)
       VALUES ($1,$2,'incomplete',$3,$4,$5)`,
      [
        hero, enc, hoursAgo(20), hoursAgo(3),
        JSON.stringify([
          { medicationName: 'Furosemide 20 mg PO daily', priorDose: '20 mg PO daily' },
          { medicationName: 'Metformin 1000 mg PO BID', priorDose: '1000 mg PO BID' },
          { medicationName: 'Insulin Glargine 18 units QHS', priorDose: '16 units QHS' },
        ]),
      ],
    );

    // ---- findings: hero critical + a spread
    async function addFinding(
      patient: string, ruleId: string, title: string, category: string, severity: string, score: number, status: string,
      assigned: string | null, detectedH: number, dueH: number, why: string, evidence: unknown[], sourceRefs: unknown[] = [],
    ) {
      const p = (await c.query(`SELECT facility_id, unit_id FROM patient WHERE id=$1`, [patient])).rows[0];
      const fid = (
        await c.query(
          `INSERT INTO risk_finding(patient_id,facility_id,unit_id,rule_id,rule_version,title,description,category,severity,priority_score,score_breakdown,status,assigned_user_id,detected_at,due_at,is_overdue,is_ai_generated,why_flagged,recommended_action,evidence,source_refs)
           VALUES ($1,$2,$3,$4,3,$5,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'Complete and sign the required documentation.',$17,$18) RETURNING id`,
          [
            patient, p.facility_id, p.unit_id, ruleId, title, category, severity, score,
            JSON.stringify([
              { label: `Base severity (${severity})`, points: severity === 'critical' ? 70 : severity === 'high' ? 50 : 30 },
              { label: 'Overdue duration', points: 5 },
              { label: 'Patient safety relevance', points: 8 },
              { label: 'Repeat deficiency', points: 4 },
            ]),
            status, assigned, hoursAgo(detectedH), hoursAgo(dueH), dueH > 0, ruleId.startsWith('AI'),
            why, JSON.stringify(evidence), JSON.stringify(sourceRefs),
          ],
        )
      ).rows[0].id;
      return fid;
    }

    const heroFinding = await addFinding(
      hero, 'RX-ADM-001', 'Medication Reconciliation Incomplete', 'medication_reconciliation', 'critical', 87, 'assigned', users.rn1, 3.5, 3.2,
      'Medication reconciliation must be completed within 24 hours of admission. Sarah Williams was admitted 27 hours ago and medication reconciliation remains incomplete.',
      [
        { label: 'Admission', value: 'Sep 6, 2026 — 9:00 AM' },
        { label: 'Required completion', value: 'Sep 7, 2026 — 9:00 AM' },
        { label: 'Current status', value: 'Incomplete', emphasis: 'danger' },
        { label: 'Overdue', value: '3h 12m', emphasis: 'danger' },
      ],
      [{ kind: 'medication_reconciliation', id: enc, label: 'Open Medication Reconciliation' }],
    );
    for (const [t, at, desc] of [
      ['generated', hoursAgo(3.5), 'Finding generated — rule RX-ADM-001 v3.'],
      ['assigned', hoursAgo(3.45), 'Assigned to Amanda Martinez, RN (primary nurse).'],
    ] as const) {
      await c.query(`INSERT INTO finding_timeline_event(finding_id,at,type,description,actor_name) VALUES ($1,$2,$3,$4,'System')`, [heroFinding, at, t, desc]);
    }

    await addFinding(hero, 'ASM-FALL-002', 'Fall Risk Reassessment Overdue', 'assessments', 'high', 63, 'assigned', users.rn1, 18, 6, 'Fall risk reassessment required each shift; last completed over 18 hours ago.', [{ label: 'Status', value: 'Overdue 6h', emphasis: 'danger' }]);
    await addFinding(hero, 'CP-REV-005', 'Care Plan Signature Missing', 'care_plans', 'medium', 44, 'assigned', users.rn1, 26, 2, 'The CHF care plan was updated but is missing the required RN signature.', [{ label: 'RN signature', value: 'Missing', emphasis: 'danger' }]);
    await addFinding(patientIds[2], 'SIG-MD-004', 'Physician Signature Missing', 'signatures', 'critical', 82, 'assigned', users.md1, 9, 8, 'Verbal order entered 9 hours ago; ordering provider signature still missing.', [{ label: 'Provider signature', value: 'Missing — overdue 8h', emphasis: 'danger' }]);

    const titles = [
      ['ASM-FALL-002', 'Fall Risk Reassessment Overdue', 'assessments', 'high'],
      ['SIG-RN-003', 'Missing RN Signature', 'signatures', 'medium'],
      ['ORD-ACK-006', 'Order Awaiting Acknowledgement', 'orders', 'high'],
      ['LAB-FU-007', 'Missing Lab Follow-up Documentation', 'labs', 'high'],
      ['RX-ADM-001', 'Medication Reconciliation Incomplete', 'medication_reconciliation', 'critical'],
      ['CP-REV-005', 'Care Plan Review Overdue', 'care_plans', 'medium'],
    ] as const;
    const statuses = ['detected', 'assigned', 'in_progress', 'awaiting_verification', 'closed'];
    for (let i = 0; i < 40; i++) {
      const p = patientIds[1 + (i % (patientIds.length - 1))];
      const [rid, title, cat, sev] = titles[i % titles.length];
      const status = statuses[i % statuses.length];
      await addFinding(p, rid, title, cat, sev, 40 + (i % 50), status, i % 3 ? users.rn1 : users.rn2, 2 + (i % 90), (i % 5) - 2, `${title} — rule ${rid} evaluation.`, [{ label: 'Detected by', value: `Rule ${rid}` }]);
    }

    await c.query(
      `INSERT INTO ai_analysis(feature,model,version,purpose,last_validation,enabled_facility_ids) VALUES
       ('Chart Summarization','Demo Clinical LLM','2026.08','Summarize existing records for review',$1,$2),
       ('Contradiction Detection','Demo Clinical LLM','2026.08','Identify possible documentation inconsistencies',$1,$2),
       ('Documentation Quality Review','Demo Clinical LLM','2026.08','Flag missing required fields',$1,$2),
       ('Ask the Chart','Demo Clinical LLM','2026.08','Answer grounded questions with citations',$1,$2)`,
      [hoursAgo(240), JSON.stringify([facilities.HN, facilities.HW, facilities.ST])],
    );

    await c.query('COMMIT');
    console.log(`Seed complete ✔  (${patientIds.length} patients, ${rules.length} rules)`);
  } catch (err) {
    await c.query('ROLLBACK');
    throw err;
  } finally {
    c.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
