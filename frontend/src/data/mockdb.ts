/**
 * Deterministic synthetic dataset for the prototype.
 * All names, MRNs and clinical details are fictional. Not real patient data.
 *
 * The dataset is generated once at module load into a mutable `db` object.
 * The service layer reads/writes `db`; the Zustand store owns a working copy
 * so interactions (completing a reconciliation, verifying a finding, …) mutate
 * state and cascade to KPIs.
 */
import type {
  AIAnalysis,
  Assessment,
  AuditEvent,
  CarePlan,
  ClinicalNote,
  Facility,
  LabResult,
  Medication,
  MedicationAdministration,
  MedicationReconciliation,
  Notification,
  Order,
  Organization,
  Patient,
  RiskFinding,
  RiskRule,
  Role,
  Severity,
  Task,
  Unit,
  User,
  Vital,
  ExceptionRequest,
  FalsePositiveReview,
} from '@/types';
import { SEVERITY_BASE } from '@/utils/scoring';

// ----- seeded RNG so the demo is identical every run -------------------------
let seed = 20260907;
function rnd(): number {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}
function int(min: number, max: number): number {
  return Math.floor(rnd() * (max - min + 1)) + min;
}
function id(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(4, '0')}`;
}

export const NOW = '2026-09-07T12:00:00.000Z';
const NOW_MS = Date.parse(NOW);
function isoAgo(hours: number): string {
  return new Date(NOW_MS - hours * 3600_000).toISOString();
}
function isoAhead(hours: number): string {
  return new Date(NOW_MS + hours * 3600_000).toISOString();
}

// ----- organizations / facilities / units -----------------------------------
export const org: Organization = { id: 'org-1', name: 'Gulf Coast Health Partners' };

export const facilities: Facility[] = [
  { id: 'fac-1', orgId: 'org-1', name: 'Houston North', code: 'HN', city: 'Houston', state: 'TX' },
  { id: 'fac-2', orgId: 'org-1', name: 'Houston West', code: 'HW', city: 'Katy', state: 'TX' },
  { id: 'fac-3', orgId: 'org-1', name: 'Stafford', code: 'ST', city: 'Stafford', state: 'TX' },
];

export const units: Unit[] = [
  { id: 'unit-1', facilityId: 'fac-1', name: 'Unit A', type: 'Med-Surg', beds: 28 },
  { id: 'unit-2', facilityId: 'fac-1', name: 'Unit B', type: 'Telemetry', beds: 24 },
  { id: 'unit-3', facilityId: 'fac-2', name: 'Unit A', type: 'Med-Surg', beds: 26 },
  { id: 'unit-4', facilityId: 'fac-2', name: 'ICU', type: 'Critical Care', beds: 14 },
  { id: 'unit-5', facilityId: 'fac-3', name: 'Unit A', type: 'Med-Surg', beds: 30 },
  { id: 'unit-6', facilityId: 'fac-3', name: 'Unit C', type: 'Rehab', beds: 22 },
];

export const roles: Role[] = [
  { id: 'role-nurse', name: 'Nurse', description: 'Bedside RN — documents care, corrects assigned findings.' },
  { id: 'role-physician', name: 'Physician', description: 'Attending / consulting provider — signs orders and notes.' },
  { id: 'role-don', name: 'Director of Nursing', description: 'Owns the risk command center and verification.' },
  { id: 'role-charge', name: 'Charge Nurse', description: 'Unit-level triage and escalation.' },
  { id: 'role-compliance', name: 'Compliance', description: 'Audits, exceptions and AI governance.' },
  { id: 'role-admin', name: 'Administrator', description: 'User, role and system configuration.' },
];

const AVATAR_COLORS = ['#0d9488', '#4f46e5', '#db2777', '#2563eb', '#d97706', '#7c3aed', '#059669'];

// ----- users ----------------------------------------------------------------
export const users: User[] = [
  {
    id: 'user-don-1',
    name: 'Jennifer Adams',
    credentials: 'MSN, RN',
    role: 'Director of Nursing',
    email: 'jennifer.adams@gulfcoasthp.org',
    facilityId: 'fac-3',
    status: 'active',
    lastLogin: isoAgo(14),
    avatarColor: '#0d9488',
  },
  {
    id: 'user-rn-1',
    name: 'Amanda Martinez',
    credentials: 'BSN, RN',
    role: 'Nurse',
    email: 'amanda.martinez@gulfcoasthp.org',
    facilityId: 'fac-3',
    unitId: 'unit-5',
    status: 'active',
    lastLogin: isoAgo(2),
    avatarColor: '#4f46e5',
  },
  {
    id: 'user-rn-2',
    name: 'Mark Johnson',
    credentials: 'RN',
    role: 'Nurse',
    email: 'mark.johnson@gulfcoasthp.org',
    facilityId: 'fac-3',
    unitId: 'unit-6',
    status: 'active',
    lastLogin: isoAgo(20),
    avatarColor: '#db2777',
  },
  {
    id: 'user-md-1',
    name: 'Dr. Robert Lee',
    credentials: 'MD',
    role: 'Physician',
    email: 'robert.lee@gulfcoasthp.org',
    facilityId: 'fac-3',
    status: 'active',
    lastLogin: isoAgo(5),
    avatarColor: '#2563eb',
  },
  {
    id: 'user-comp-1',
    name: 'Emily Chen',
    credentials: 'RN, CHC',
    role: 'Compliance',
    email: 'emily.chen@gulfcoasthp.org',
    facilityId: 'fac-1',
    status: 'active',
    lastLogin: isoAgo(30),
    avatarColor: '#d97706',
  },
  {
    id: 'user-charge-1',
    name: 'Priya Nair',
    credentials: 'BSN, RN',
    role: 'Charge Nurse',
    email: 'priya.nair@gulfcoasthp.org',
    facilityId: 'fac-3',
    unitId: 'unit-5',
    status: 'active',
    lastLogin: isoAgo(6),
    avatarColor: '#7c3aed',
  },
  {
    id: 'user-admin-1',
    name: 'David Okafor',
    credentials: '',
    role: 'Administrator',
    email: 'david.okafor@gulfcoasthp.org',
    facilityId: 'fac-1',
    status: 'active',
    lastLogin: isoAgo(48),
    avatarColor: '#059669',
  },
];

const FIRST_NAMES_F = ['Sarah', 'Linda', 'Patricia', 'Barbara', 'Susan', 'Nancy', 'Karen', 'Betty', 'Dorothy', 'Helen', 'Sandra', 'Donna', 'Carol', 'Ruth', 'Sharon'];
const FIRST_NAMES_M = ['John', 'Michael', 'Robert', 'James', 'William', 'David', 'Richard', 'Charles', 'Joseph', 'Thomas', 'Daniel', 'Paul', 'Mark', 'George', 'Kenneth'];
const LAST_NAMES = ['Williams', 'Smith', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Clark'];
const DIAGNOSES = ['CHF', 'Type 2 Diabetes', 'Hypertension', 'COPD', 'Atrial Fibrillation', 'CKD Stage 3', 'Pneumonia', 'Sepsis', 'Post-op Hip Fracture', 'Cellulitis', 'UTI', 'Dehydration', 'Anemia', 'Hyperlipidemia', 'Hypothyroidism'];
const ALLERGENS = ['Penicillin', 'Sulfa', 'Latex', 'Codeine', 'Iodine Contrast', 'Aspirin', 'Shellfish'];

const physicianIds = ['user-md-1'];
const nurseIds = ['user-rn-1', 'user-rn-2'];

// ----- patients -------------------------------------------------------------
export const patients: Patient[] = [];

// Patient 0 is the demo hero — Sarah Williams at Stafford / Unit A
patients.push({
  id: 'pat-0001',
  mrn: '1002938',
  firstName: 'Sarah',
  lastName: 'Williams',
  dob: '1954-02-14',
  sex: 'F',
  facilityId: 'fac-3',
  unitId: 'unit-5',
  room: '512-A',
  attendingId: 'user-md-1',
  primaryNurseId: 'user-rn-1',
  admissionDate: isoAgo(27),
  admissionStatus: 'admitted',
  allergies: [{ substance: 'Penicillin', reaction: 'Anaphylaxis', severity: 'critical' }],
  diagnoses: ['CHF', 'Type 2 Diabetes', 'Hypertension'],
  documentationRiskScore: 74,
  documentationCompliance: 82,
});

// demo patient for fall-risk finding — Michael Brown
patients.push({
  id: 'pat-0002',
  mrn: '1004517',
  firstName: 'Michael',
  lastName: 'Brown',
  dob: '1948-09-03',
  sex: 'M',
  facilityId: 'fac-3',
  unitId: 'unit-6',
  room: '308-B',
  attendingId: 'user-md-1',
  primaryNurseId: 'user-rn-2',
  admissionDate: isoAgo(96),
  admissionStatus: 'admitted',
  allergies: [{ substance: 'Sulfa', reaction: 'Rash', severity: 'medium' }],
  diagnoses: ['Post-op Hip Fracture', 'Hypertension', 'Anemia'],
  documentationRiskScore: 63,
  documentationCompliance: 79,
});

// demo patient for missing physician signature — John Smith
patients.push({
  id: 'pat-0003',
  mrn: '1003044',
  firstName: 'John',
  lastName: 'Smith',
  dob: '1961-06-21',
  sex: 'M',
  facilityId: 'fac-2',
  unitId: 'unit-3',
  room: '210-A',
  attendingId: 'user-md-1',
  primaryNurseId: 'user-rn-1',
  admissionDate: isoAgo(38),
  admissionStatus: 'admitted',
  allergies: [],
  diagnoses: ['Pneumonia', 'COPD'],
  documentationRiskScore: 58,
  documentationCompliance: 88,
});

for (let i = 4; i <= 50; i++) {
  const sex = rnd() > 0.5 ? 'F' : 'M';
  const first = sex === 'F' ? pick(FIRST_NAMES_F) : pick(FIRST_NAMES_M);
  const last = pick(LAST_NAMES);
  const fac = pick(facilities);
  const unit = pick(units.filter((u) => u.facilityId === fac.id));
  const admittedH = int(4, 260);
  const discharged = rnd() > 0.82;
  const compliance = int(68, 99);
  const risk = Math.max(8, Math.min(96, 106 - compliance + int(-6, 30)));
  patients.push({
    id: id('pat', i),
    mrn: String(1000000 + int(1000, 99999)),
    firstName: first,
    lastName: last,
    dob: `${int(1938, 1972)}-${String(int(1, 12)).padStart(2, '0')}-${String(int(1, 28)).padStart(2, '0')}`,
    sex,
    facilityId: fac.id,
    unitId: unit.id,
    room: `${int(100, 599)}-${pick(['A', 'B'])}`,
    attendingId: pick(physicianIds),
    primaryNurseId: pick(nurseIds),
    admissionDate: isoAgo(admittedH),
    admissionStatus: discharged ? 'discharged' : rnd() > 0.85 ? 'observation' : 'admitted',
    dischargeDate: discharged ? isoAgo(int(1, 40)) : undefined,
    allergies:
      rnd() > 0.5
        ? [{ substance: pick(ALLERGENS), reaction: pick(['Rash', 'Hives', 'Swelling', 'GI upset']), severity: pick<Severity>(['low', 'medium', 'high']) }]
        : [],
    diagnoses: Array.from(new Set([pick(DIAGNOSES), pick(DIAGNOSES), pick(DIAGNOSES)])),
    documentationRiskScore: risk,
    documentationCompliance: compliance,
  });
}

// ----- risk rules ----------------------------------------------------------
export const riskRules: RiskRule[] = [
  {
    id: 'RX-ADM-001',
    name: 'Admission Medication Reconciliation',
    category: 'medication_reconciliation',
    trigger: 'Patient Admitted',
    requirement: 'Medication Reconciliation Completed',
    deadlineHours: 24,
    severity: 'critical',
    escalation: [
      { afterHoursOverdue: 2, notifyRole: 'Charge Nurse' },
      { afterHoursOverdue: 6, notifyRole: 'Director of Nursing', raiseSeverityTo: 'critical' },
    ],
    responsibleRole: 'Nurse',
    scope: 'All Facilities',
    evaluationType: 'Deterministic',
    version: 3,
    status: 'active',
    updatedAt: isoAgo(340),
    updatedById: 'user-admin-1',
  },
  {
    id: 'ASM-FALL-002',
    name: 'Fall Risk Reassessment (Shift)',
    category: 'assessments',
    trigger: 'Shift Change',
    requirement: 'Fall Risk Assessment Completed This Shift',
    deadlineHours: 12,
    severity: 'high',
    escalation: [{ afterHoursOverdue: 6, notifyRole: 'Charge Nurse' }],
    responsibleRole: 'Nurse',
    scope: 'All Facilities',
    evaluationType: 'Deterministic',
    version: 2,
    status: 'active',
    updatedAt: isoAgo(210),
    updatedById: 'user-admin-1',
  },
  {
    id: 'SIG-RN-003',
    name: 'RN Note Signature',
    category: 'signatures',
    trigger: 'Note Signed',
    requirement: 'Nursing note signed within 12 hours of authoring',
    deadlineHours: 12,
    severity: 'medium',
    escalation: [],
    responsibleRole: 'Nurse',
    scope: 'All Facilities',
    evaluationType: 'Deterministic',
    version: 1,
    status: 'active',
    updatedAt: isoAgo(120),
    updatedById: 'user-admin-1',
  },
  {
    id: 'SIG-MD-004',
    name: 'Physician Order / Note Signature',
    category: 'signatures',
    trigger: 'Order Entered',
    requirement: 'Ordering provider signature present within 8 hours',
    deadlineHours: 8,
    severity: 'critical',
    escalation: [{ afterHoursOverdue: 4, notifyRole: 'Director of Nursing' }],
    responsibleRole: 'Physician',
    scope: 'All Facilities',
    evaluationType: 'Deterministic',
    version: 2,
    status: 'active',
    updatedAt: isoAgo(90),
    updatedById: 'user-admin-1',
  },
  {
    id: 'CP-REV-005',
    name: 'Care Plan Review Cadence',
    category: 'care_plans',
    trigger: 'Care Plan Created',
    requirement: 'Care plan reviewed every 72 hours',
    deadlineHours: 72,
    severity: 'medium',
    escalation: [],
    responsibleRole: 'Nurse',
    scope: 'All Facilities',
    evaluationType: 'Deterministic',
    version: 1,
    status: 'active',
    updatedAt: isoAgo(60),
    updatedById: 'user-admin-1',
  },
  {
    id: 'ORD-ACK-006',
    name: 'Order Acknowledgement',
    category: 'orders',
    trigger: 'Order Entered',
    requirement: 'Nursing acknowledgement within 2 hours',
    deadlineHours: 2,
    severity: 'high',
    escalation: [{ afterHoursOverdue: 2, notifyRole: 'Charge Nurse' }],
    responsibleRole: 'Nurse',
    scope: 'All Facilities',
    evaluationType: 'Deterministic',
    version: 1,
    status: 'active',
    updatedAt: isoAgo(45),
    updatedById: 'user-admin-1',
  },
  {
    id: 'LAB-FU-007',
    name: 'Critical Lab Follow-up Documentation',
    category: 'labs',
    trigger: 'Lab Resulted',
    requirement: 'Abnormal result reviewed and follow-up documented within 4 hours',
    deadlineHours: 4,
    severity: 'high',
    escalation: [],
    responsibleRole: 'Nurse',
    scope: 'All Facilities',
    evaluationType: 'Deterministic',
    version: 2,
    status: 'active',
    updatedAt: isoAgo(30),
    updatedById: 'user-admin-1',
  },
  {
    id: 'ASM-ADM-008',
    name: 'Admission Assessment Completeness',
    category: 'assessments',
    trigger: 'Patient Admitted',
    requirement: 'All admission assessment sections complete within 8 hours',
    deadlineHours: 8,
    severity: 'high',
    escalation: [],
    responsibleRole: 'Nurse',
    scope: 'All Facilities',
    evaluationType: 'Deterministic',
    version: 1,
    status: 'active',
    updatedAt: isoAgo(25),
    updatedById: 'user-admin-1',
  },
  {
    id: 'CON-EXP-009',
    name: 'Consent Expiration',
    category: 'consent',
    trigger: 'Patient Admitted',
    requirement: 'Valid procedure consent on file',
    deadlineHours: 24,
    severity: 'medium',
    escalation: [],
    responsibleRole: 'Nurse',
    scope: 'All Facilities',
    evaluationType: 'Deterministic',
    version: 1,
    status: 'active',
    updatedAt: isoAgo(15),
    updatedById: 'user-admin-1',
  },
  {
    id: 'AI-CON-010',
    name: 'Documentation Contradiction Detection',
    category: 'notes',
    trigger: 'Note Signed',
    requirement: 'Narrative consistent with recent interdisciplinary documentation',
    deadlineHours: 24,
    severity: 'medium',
    escalation: [],
    responsibleRole: 'Nurse',
    scope: 'All Facilities',
    evaluationType: 'AI-Assisted',
    version: 1,
    status: 'active',
    updatedAt: isoAgo(10),
    updatedById: 'user-admin-1',
  },
  {
    id: 'AI-DUP-011',
    name: 'Possible Duplicated Note',
    category: 'notes',
    trigger: 'Note Signed',
    requirement: 'Note contains substantive new documentation',
    deadlineHours: 24,
    severity: 'low',
    escalation: [],
    responsibleRole: 'Nurse',
    scope: 'All Facilities',
    evaluationType: 'AI-Assisted',
    version: 1,
    status: 'active',
    updatedAt: isoAgo(8),
    updatedById: 'user-admin-1',
  },
];

// ----- findings ----------------------------------------------------------
export const findings: RiskFinding[] = [];
let findingCounter = 0;

function makeFinding(partial: Partial<RiskFinding> & Pick<RiskFinding, 'patientId' | 'ruleId' | 'title' | 'category' | 'severity'>): RiskFinding {
  const patient = patients.find((p) => p.id === partial.patientId)!;
  const rule = riskRules.find((r) => r.id === partial.ruleId)!;
  const detectedAt = partial.detectedAt ?? isoAgo(int(2, 90));
  const dueAt = partial.dueAt ?? isoAgo(int(-20, 10));
  const overdue = Date.parse(dueAt) < NOW_MS;
  const overdueHours = overdue ? (NOW_MS - Date.parse(dueAt)) / 3600_000 : 0;
  const overduePoints = Math.min(15, Math.round(overdueHours / 2));
  const safety = partial.category === 'medication_reconciliation' || partial.category === 'labs' ? 8 : partial.category === 'assessments' ? 6 : 3;
  const repeat = partial.priorityScore ? 0 : int(0, 5);
  const base = SEVERITY_BASE[partial.severity];
  const total = Math.min(100, base + overduePoints + safety + repeat);
  const n = ++findingCounter;
  return {
    id: id('find', n),
    patientId: partial.patientId,
    facilityId: patient.facilityId,
    unitId: patient.unitId,
    ruleId: partial.ruleId,
    ruleVersion: rule.version,
    title: partial.title,
    description: partial.description ?? partial.title,
    category: partial.category,
    severity: partial.severity,
    priorityScore: partial.priorityScore ?? total,
    scoreBreakdown: partial.scoreBreakdown ?? [
      { label: `Base severity (${partial.severity})`, points: base },
      { label: 'Overdue duration', points: overduePoints },
      { label: 'Patient safety relevance', points: safety },
      { label: 'Repeat deficiency', points: repeat },
    ],
    status: partial.status ?? 'detected',
    assignedUserId: partial.assignedUserId,
    detectedAt,
    dueAt,
    isOverdue: overdue,
    isAiGenerated: partial.isAiGenerated ?? rule.evaluationType === 'AI-Assisted',
    confidence: partial.confidence ?? (rule.evaluationType === 'AI-Assisted' ? 0.72 : undefined),
    evidence: partial.evidence ?? [],
    whyFlagged: partial.whyFlagged ?? rule.requirement,
    recommendedAction: partial.recommendedAction ?? 'Complete and sign the required documentation.',
    recommendedActionLink: partial.recommendedActionLink,
    timeline:
      partial.timeline ??
      [
        { id: 'tl-1', at: detectedAt, type: 'generated', description: 'Finding generated by rule evaluation.' },
      ],
    verifiedById: partial.verifiedById,
    sourceRefs: partial.sourceRefs ?? [],
  };
}

// --- HERO FINDING: Sarah Williams medication reconciliation -----------------
findings.push(
  makeFinding({
    patientId: 'pat-0001',
    ruleId: 'RX-ADM-001',
    title: 'Medication Reconciliation Incomplete',
    description:
      'Admission medication reconciliation has not been completed within the required 24-hour window.',
    category: 'medication_reconciliation',
    severity: 'critical',
    status: 'assigned',
    assignedUserId: 'user-rn-1',
    detectedAt: isoAgo(3.5),
    dueAt: isoAgo(3.2),
    priorityScore: 87,
    scoreBreakdown: [
      { label: 'Base severity (critical)', points: 70 },
      { label: 'Overdue duration', points: 5 },
      { label: 'Patient safety relevance', points: 8 },
      { label: 'Repeat deficiency', points: 4 },
    ],
    whyFlagged:
      'Medication reconciliation must be completed within 24 hours of admission. Sarah Williams was admitted 27 hours ago and medication reconciliation remains incomplete.',
    recommendedAction: 'Complete and sign medication reconciliation.',
    recommendedActionLink: '/patients/pat-0001/medications/reconciliation',
    evidence: [
      { label: 'Admission', value: 'Sep 6, 2026 — 9:00 AM', sourceRef: { kind: 'encounter', id: 'enc-0001', label: 'Admission' } },
      { label: 'Required completion', value: 'Sep 7, 2026 — 9:00 AM' },
      { label: 'Current status', value: 'Incomplete', emphasis: 'danger' },
      { label: 'Overdue', value: '3h 12m', emphasis: 'danger' },
    ],
    sourceRefs: [
      { kind: 'medication_reconciliation', id: 'recon-0001', label: 'Open Medication Reconciliation' },
      { kind: 'encounter', id: 'enc-0001', label: 'Open Admission' },
      { kind: 'patient', id: 'pat-0001', label: 'Open Patient Chart' },
    ],
    timeline: [
      { id: 'tl-1', at: isoAgo(3.5), type: 'generated', description: 'Finding generated — rule RX-ADM-001 v3.' },
      { id: 'tl-2', at: isoAgo(3.45), type: 'assigned', actorName: 'System', description: 'Assigned to Amanda Martinez, RN (primary nurse).' },
    ],
  }),
);

// other Sarah Williams findings (she has 6 open)
findings.push(
  makeFinding({
    patientId: 'pat-0001',
    ruleId: 'ASM-FALL-002',
    title: 'Fall Risk Reassessment Overdue',
    category: 'assessments',
    severity: 'high',
    status: 'assigned',
    assignedUserId: 'user-rn-1',
    detectedAt: isoAgo(18),
    dueAt: isoAgo(6),
    recommendedAction: 'Complete the shift fall-risk reassessment and update interventions.',
    recommendedActionLink: '/patients/pat-0001/assessments',
    whyFlagged: 'A fall risk reassessment is required each shift. The last completed assessment is more than 18 hours old.',
    evidence: [
      { label: 'Last completed', value: 'Sep 6, 2026 — 6:00 PM' },
      { label: 'Required this shift', value: 'Sep 7, 2026 — 6:00 AM' },
      { label: 'Status', value: 'Overdue 6h', emphasis: 'danger' },
    ],
  }),
  makeFinding({
    patientId: 'pat-0001',
    ruleId: 'CP-REV-005',
    title: 'Care Plan Signature Missing',
    category: 'care_plans',
    severity: 'medium',
    status: 'assigned',
    assignedUserId: 'user-rn-1',
    detectedAt: isoAgo(26),
    dueAt: isoAgo(2),
    recommendedAction: 'Review the CHF care plan and apply the RN signature.',
    recommendedActionLink: '/patients/pat-0001/care-plan',
    whyFlagged: 'The CHF care plan was updated but is missing the required registered-nurse signature.',
    evidence: [
      { label: 'Care plan', value: 'CHF Care Plan' },
      { label: 'Last updated', value: 'Sep 6, 2026 — 10:00 AM' },
      { label: 'RN signature', value: 'Missing', emphasis: 'danger' },
    ],
  }),
  makeFinding({
    patientId: 'pat-0001',
    ruleId: 'ORD-ACK-006',
    title: 'Order Awaiting Acknowledgement',
    category: 'orders',
    severity: 'high',
    status: 'detected',
    detectedAt: isoAgo(6),
    dueAt: isoAgo(4),
    recommendedAction: 'Acknowledge the pending physician order.',
    recommendedActionLink: '/patients/pat-0001/orders',
    whyFlagged: 'A physician order has been active for 6 hours without nursing acknowledgement.',
    evidence: [
      { label: 'Order', value: 'Furosemide 40 mg IV BID' },
      { label: 'Entered', value: 'Sep 7, 2026 — 6:00 AM' },
      { label: 'Acknowledged', value: 'No', emphasis: 'danger' },
    ],
  }),
  makeFinding({
    patientId: 'pat-0001',
    ruleId: 'LAB-FU-007',
    title: 'Missing Lab Follow-up Documentation',
    category: 'labs',
    severity: 'high',
    status: 'detected',
    detectedAt: isoAgo(3),
    dueAt: isoAgo(1),
    recommendedAction: 'Document review of the abnormal potassium result and any follow-up.',
    recommendedActionLink: '/patients/pat-0001/labs',
    whyFlagged: 'Potassium resulted at 5.7 mmol/L (High). No follow-up documentation is present after 3 hours.',
    evidence: [
      { label: 'Test', value: 'Potassium 5.7 mmol/L', emphasis: 'warning' },
      { label: 'Reference range', value: '3.5 – 5.1 mmol/L' },
      { label: 'Follow-up note', value: 'Not documented', emphasis: 'danger' },
    ],
  }),
  makeFinding({
    patientId: 'pat-0001',
    ruleId: 'AI-CON-010',
    title: 'Possible Mobility Documentation Inconsistency',
    category: 'notes',
    severity: 'medium',
    status: 'detected',
    isAiGenerated: true,
    confidence: 0.68,
    detectedAt: isoAgo(1),
    dueAt: isoAhead(20),
    recommendedAction: 'Review the nursing narrative against the recent physical therapy note.',
    whyFlagged:
      'The nursing note states the patient "ambulates independently" while a physical therapy note from the same day states the patient "requires two-person assistance." These statements may represent inconsistent documentation and should be reviewed.',
    evidence: [
      { label: 'Nursing Assessment', value: '"Patient ambulates independently."', emphasis: 'warning' },
      { label: 'Physical Therapy Note', value: '"Patient requires two-person assistance."', emphasis: 'warning' },
    ],
    sourceRefs: [
      { kind: 'note', id: 'note-sw-nursing', label: 'Nursing Assessment' },
      { kind: 'note', id: 'note-sw-pt', label: 'Physical Therapy Note' },
    ],
  }),
);

// John Smith — missing physician signature (critical, overdue 8h)
findings.push(
  makeFinding({
    patientId: 'pat-0003',
    ruleId: 'SIG-MD-004',
    title: 'Physician Signature Missing',
    category: 'signatures',
    severity: 'critical',
    status: 'assigned',
    assignedUserId: 'user-md-1',
    detectedAt: isoAgo(9),
    dueAt: isoAgo(8),
    recommendedAction: 'Ordering provider to review and sign the pending order.',
    recommendedActionLink: '/patients/pat-0003/orders',
    whyFlagged: 'A verbal order was entered 9 hours ago and the ordering provider signature is still missing (required within 8 hours).',
    evidence: [
      { label: 'Order', value: 'Ceftriaxone 1 g IV daily' },
      { label: 'Entered by', value: 'Amanda Martinez, RN (verbal order)' },
      { label: 'Provider signature', value: 'Missing — overdue 8h', emphasis: 'danger' },
    ],
  }),
);

// Michael Brown — fall risk reassessment overdue 18h (high)
findings.push(
  makeFinding({
    patientId: 'pat-0002',
    ruleId: 'ASM-FALL-002',
    title: 'Fall Risk Reassessment Overdue',
    category: 'assessments',
    severity: 'high',
    status: 'assigned',
    assignedUserId: 'user-rn-2',
    detectedAt: isoAgo(20),
    dueAt: isoAgo(18),
    recommendedAction: 'Complete the fall-risk reassessment for this post-op patient.',
    recommendedActionLink: '/patients/pat-0002/assessments',
    whyFlagged: 'Post-op hip fracture patient. Fall risk reassessment is 18 hours overdue.',
    evidence: [
      { label: 'Last completed', value: 'Sep 6, 2026 — 12:00 PM' },
      { label: 'Required', value: 'Sep 7, 2026 — 12:00 AM' },
      { label: 'Status', value: 'Overdue 18h', emphasis: 'danger' },
    ],
  }),
  makeFinding({
    patientId: 'pat-0002',
    ruleId: 'AI-DUP-011',
    title: 'Possible Duplicated Nursing Note',
    category: 'notes',
    severity: 'low',
    status: 'detected',
    isAiGenerated: true,
    confidence: 0.61,
    detectedAt: isoAgo(5),
    dueAt: isoAhead(19),
    whyFlagged:
      'Two nursing progress notes authored 40 minutes apart contain highly similar narrative text with no substantive new documentation. This may represent a duplicated note and should be reviewed.',
    evidence: [
      { label: 'Note A', value: 'Nursing Progress Note — 08:20' },
      { label: 'Note B', value: 'Nursing Progress Note — 09:00 (94% similar)', emphasis: 'warning' },
    ],
  }),
);

// bulk findings across the population to reach ~100 and drive analytics
const bulkTitles: { title: string; category: RiskFinding['category']; ruleId: string; severity: Severity }[] = [
  { title: 'Incomplete Admission Assessment', category: 'assessments', ruleId: 'ASM-ADM-008', severity: 'high' },
  { title: 'Missing RN Signature', category: 'signatures', ruleId: 'SIG-RN-003', severity: 'medium' },
  { title: 'Care Plan Review Overdue', category: 'care_plans', ruleId: 'CP-REV-005', severity: 'medium' },
  { title: 'Medication Reconciliation Incomplete', category: 'medication_reconciliation', ruleId: 'RX-ADM-001', severity: 'critical' },
  { title: 'Order Awaiting Acknowledgement', category: 'orders', ruleId: 'ORD-ACK-006', severity: 'high' },
  { title: 'Missing Lab Follow-up Documentation', category: 'labs', ruleId: 'LAB-FU-007', severity: 'high' },
  { title: 'Expired Consent on File', category: 'consent', ruleId: 'CON-EXP-009', severity: 'medium' },
  { title: 'Fall Risk Reassessment Overdue', category: 'assessments', ruleId: 'ASM-FALL-002', severity: 'high' },
  { title: 'Physician Signature Missing', category: 'signatures', ruleId: 'SIG-MD-004', severity: 'critical' },
];

const activePatients = patients.filter((p) => p.admissionStatus !== 'discharged');
let guard = 0;
while (findings.length < 104 && guard < 400) {
  guard++;
  const p = pick(activePatients);
  const t = pick(bulkTitles);
  const roll = rnd();
  let status: RiskFinding['status'] = 'detected';
  if (roll > 0.85) status = 'closed';
  else if (roll > 0.72) status = 'awaiting_verification';
  else if (roll > 0.58) status = 'in_progress';
  else if (roll > 0.4) status = 'assigned';
  const assignee = t.severity === 'critical' && t.ruleId === 'SIG-MD-004' ? 'user-md-1' : pick(nurseIds);
  findings.push(
    makeFinding({
      patientId: p.id,
      ruleId: t.ruleId,
      title: t.title,
      category: t.category,
      severity: t.severity,
      status,
      assignedUserId: status === 'detected' ? undefined : assignee,
      detectedAt: isoAgo(int(1, 160)),
      dueAt: isoAgo(int(-30, 40)),
      verifiedById: status === 'closed' ? 'user-don-1' : undefined,
    }),
  );
}

// Normalize so the demo narrative holds: exactly 18 open critical findings,
// ~86 resolved this week, and a stable "resolved since yesterday" number.
(function normalizeForDemo() {
  const openStatuses: RiskFinding['status'][] = ['detected', 'assigned', 'acknowledged', 'in_progress', 'awaiting_verification'];
  const isOpenF = (f: RiskFinding) => openStatuses.includes(f.status);
  const openCrit = () => findings.filter((f) => f.severity === 'critical' && isOpenF(f));
  const TARGET = 18;

  // First: build up the "resolved this week" backlog by closing some non-critical
  // open findings (never touch the demo hero patients).
  {
    const resolvedNow = findings.filter((f) => f.status === 'closed').length;
    let need = 24 - resolvedNow;
    for (const f of findings) {
      if (need <= 0) break;
      if (f.severity === 'critical') continue;
      if (['pat-0001', 'pat-0002', 'pat-0003'].includes(f.patientId)) continue;
      if (f.status === 'in_progress' || f.status === 'awaiting_verification') {
        f.status = 'closed';
        f.verifiedById = 'user-don-1';
        f.timeline.push({ id: `tl-c-${f.id}`, at: isoAgo(int(2, 20)), type: 'closed', actorName: 'Jennifer Adams', description: 'Correction verified and finding closed.' });
        need--;
      }
    }
  }

  // too many → downgrade the least severe-scoring extras to 'high'
  let extras = openCrit().sort((a, b) => a.priorityScore - b.priorityScore);
  while (extras.length > TARGET) {
    const f = extras.shift()!;
    if (f.patientId === 'pat-0001' || f.patientId === 'pat-0003') continue;
    f.severity = 'high';
    f.priorityScore = Math.max(50, f.priorityScore - 20);
    extras = openCrit().sort((a, b) => a.priorityScore - b.priorityScore);
  }
  // too few → promote some open high findings to critical
  let highOpen = findings.filter((f) => f.severity === 'high' && isOpenF(f)).sort((a, b) => b.priorityScore - a.priorityScore);
  while (openCrit().length < TARGET && highOpen.length) {
    const f = highOpen.shift()!;
    f.severity = 'critical';
    f.priorityScore = Math.min(100, f.priorityScore + 20);
  }

})();

// ----- clinical notes for Sarah Williams (+ a signable draft) --------------
export const notes: ClinicalNote[] = [
  {
    id: 'note-sw-nursing',
    patientId: 'pat-0001',
    type: 'Nursing Note',
    title: 'Nursing Assessment',
    authorId: 'user-rn-1',
    createdAt: isoAgo(26),
    signedAt: isoAgo(25.5),
    status: 'signed',
    fields: {
      'Clinical Observation': 'Alert and oriented x3. Lungs with bibasilar crackles. 1+ pedal edema bilaterally.',
      Mobility: 'Patient ambulates independently in room with steady gait.',
      Intervention: 'Encouraged fluid restriction. Daily weights ordered.',
      'Patient Response': 'Tolerated activity without dyspnea.',
    },
    addenda: [],
    versionHistory: [{ version: 1, savedAt: isoAgo(26), authorId: 'user-rn-1', summary: 'Initial documentation' }],
    linkedFindingIds: [],
  },
  {
    id: 'note-sw-pt',
    patientId: 'pat-0001',
    type: 'Progress Note',
    title: 'Physical Therapy Note',
    authorId: 'user-rn-2',
    createdAt: isoAgo(24),
    signedAt: isoAgo(23.8),
    status: 'signed',
    fields: {
      'Clinical Observation': 'Patient evaluated for functional mobility. Poor standing balance, requires two-person assistance for transfers.',
      Plan: 'PT BID. Recommend gait belt and two-person assist for all mobility.',
    },
    addenda: [],
    versionHistory: [{ version: 1, savedAt: isoAgo(24), authorId: 'user-rn-2', summary: 'Initial documentation' }],
    linkedFindingIds: [],
  },
  {
    // DRAFT — used by the pre-sign scrubber demo flow
    id: 'note-sw-draft',
    patientId: 'pat-0001',
    type: 'Progress Note',
    title: 'Nursing Progress Note',
    authorId: 'user-rn-1',
    createdAt: isoAgo(0.5),
    status: 'draft',
    fields: {
      'Date/Time': 'Sep 7, 2026 — 11:30 AM',
      'Patient Status': 'Resting in bed, no acute distress. Reports mild fatigue.',
      'Clinical Observation': 'Lungs with decreased bibasilar breath sounds. 1+ pedal edema. Patient ambulates independently to bathroom.',
      Intervention: 'Administered furosemide 40 mg IV as ordered. Reinforced fluid restriction and low-sodium diet.',
      'Patient Response': '',
      'Follow-up Plan': 'Continue daily weights. Monitor I&O. Reassess lung sounds next shift.',
      'Additional Notes': '',
    },
    addenda: [],
    versionHistory: [{ version: 1, savedAt: isoAgo(0.5), authorId: 'user-rn-1', summary: 'Draft started' }],
    linkedFindingIds: [],
  },
];

// notes for other patients so the Notes list looks populated (~150 total)
for (let i = 0; i < 145; i++) {
  const p = pick(activePatients);
  const created = isoAgo(int(2, 240));
  const signed = rnd() > 0.09;
  notes.push({
    id: id('note', 100 + i),
    patientId: p.id,
    type: pick<ClinicalNote['type']>(['Nursing Note', 'Progress Note', 'Physician Note', 'Admission Note']),
    title: 'Progress Note',
    authorId: pick([...nurseIds, 'user-md-1']),
    createdAt: created,
    signedAt: signed ? created : undefined,
    status: signed ? 'signed' : pick<ClinicalNote['status']>(['draft', 'complete']),
    fields: { 'Clinical Observation': 'Patient stable overnight. Vitals within normal limits.', 'Patient Response': 'No acute complaints.' },
    addenda: [],
    versionHistory: [{ version: 1, savedAt: created, authorId: 'user-rn-1', summary: 'Initial documentation' }],
    linkedFindingIds: [],
  });
}

// ----- assessments -------------------------------------------------------
export const assessments: Assessment[] = [
  {
    id: 'asm-sw-fall',
    patientId: 'pat-0001',
    type: 'Fall Risk Assessment',
    lastCompletedAt: isoAgo(19),
    dueAt: isoAgo(6),
    status: 'overdue',
    completedById: 'user-rn-1',
    completionPercent: 100,
    score: 55,
    riskCategory: 'High',
    fields: {
      'Previous falls': 'Yes — within 3 months',
      Mobility: 'Weak, requires assist',
      'Assistive device': 'Walker',
      'Mental status': 'Oriented x3',
      'Medication risk': 'On diuretic + antihypertensive',
      'Balance/gait': 'Impaired',
      'Calculated score': 55,
      'Risk category': 'High',
      'Intervention plan': 'Bed alarm, hourly rounding, non-slip footwear, PT consult',
    },
    linkedFindingIds: [],
  },
  {
    id: 'asm-sw-adm',
    patientId: 'pat-0001',
    type: 'Admission Assessment',
    lastCompletedAt: isoAgo(48),
    dueAt: isoAgo(42),
    status: 'complete',
    completedById: 'user-rn-1',
    completionPercent: 100,
    fields: { 'Chief complaint': 'Shortness of breath, weight gain', 'History': 'CHF, T2DM, HTN' },
    linkedFindingIds: [],
  },
  {
    id: 'asm-sw-pain',
    patientId: 'pat-0001',
    type: 'Pain Assessment',
    lastCompletedAt: isoAgo(5),
    dueAt: isoAhead(3),
    status: 'complete',
    completedById: 'user-rn-1',
    completionPercent: 100,
    fields: { 'Pain score': '2/10', Location: 'Lower back', Character: 'Aching' },
    linkedFindingIds: [],
  },
  {
    id: 'asm-mb-fall',
    patientId: 'pat-0002',
    type: 'Fall Risk Assessment',
    lastCompletedAt: isoAgo(24),
    dueAt: isoAgo(18),
    status: 'overdue',
    completedById: 'user-rn-2',
    completionPercent: 80,
    fields: { 'Previous falls': 'Yes', Mobility: 'Bedrest, post-op', 'Assistive device': '', 'Mental status': 'Oriented x3' },
    linkedFindingIds: [],
  },
];
for (let i = 0; i < 96; i++) {
  const p = pick(activePatients);
  const due = isoAgo(int(-40, 60));
  const overdue = Date.parse(due) < NOW_MS;
  assessments.push({
    id: id('asm', 100 + i),
    patientId: p.id,
    type: pick<Assessment['type']>(['Admission Assessment', 'Fall Risk Assessment', 'Pain Assessment', 'Skin/Wound Assessment', 'Functional Assessment']),
    lastCompletedAt: rnd() > 0.2 ? isoAgo(int(5, 80)) : undefined,
    dueAt: due,
    status: overdue ? (rnd() > 0.5 ? 'overdue' : 'incomplete') : rnd() > 0.6 ? 'due_soon' : 'complete',
    completedById: pick(nurseIds),
    completionPercent: rnd() > 0.5 ? 100 : int(40, 90),
    fields: {},
    linkedFindingIds: [],
  });
}

// ----- medications & reconciliation ------------------------------------
export const medications: Medication[] = [
  { id: 'med-sw-1', patientId: 'pat-0001', name: 'Furosemide', dose: '40 mg', route: 'IV', frequency: 'BID', startDate: isoAgo(48), prescriberId: 'user-md-1', status: 'active', reconciled: false, high_alert: true },
  { id: 'med-sw-2', patientId: 'pat-0001', name: 'Metformin', dose: '1000 mg', route: 'PO', frequency: 'BID', startDate: isoAgo(48), prescriberId: 'user-md-1', status: 'active', reconciled: false },
  { id: 'med-sw-3', patientId: 'pat-0001', name: 'Lisinopril', dose: '10 mg', route: 'PO', frequency: 'Daily', startDate: isoAgo(48), prescriberId: 'user-md-1', status: 'active', reconciled: false },
  { id: 'med-sw-4', patientId: 'pat-0001', name: 'Aspirin', dose: '81 mg', route: 'PO', frequency: 'Daily', startDate: isoAgo(48), prescriberId: 'user-md-1', status: 'active', reconciled: true },
  { id: 'med-sw-5', patientId: 'pat-0001', name: 'Atorvastatin', dose: '40 mg', route: 'PO', frequency: 'QHS', startDate: isoAgo(48), prescriberId: 'user-md-1', status: 'active', reconciled: true },
  { id: 'med-sw-6', patientId: 'pat-0001', name: 'Potassium Chloride', dose: '20 mEq', route: 'PO', frequency: 'Daily', startDate: isoAgo(20), prescriberId: 'user-md-1', status: 'active', reconciled: false, high_alert: true },
  { id: 'med-sw-7', patientId: 'pat-0001', name: 'Insulin Glargine', dose: '18 units', route: 'SubQ', frequency: 'QHS', startDate: isoAgo(48), prescriberId: 'user-md-1', status: 'active', reconciled: false, high_alert: true },
  { id: 'med-sw-8', patientId: 'pat-0001', name: 'Docusate', dose: '100 mg', route: 'PO', frequency: 'BID', startDate: isoAgo(48), prescriberId: 'user-md-1', status: 'active', reconciled: true },
  { id: 'med-sw-9', patientId: 'pat-0001', name: 'Acetaminophen', dose: '650 mg', route: 'PO', frequency: 'Q6H PRN', startDate: isoAgo(48), prescriberId: 'user-md-1', status: 'active', reconciled: true },
];
for (let i = 0; i < 190; i++) {
  const p = pick(activePatients);
  medications.push({
    id: id('med', 100 + i),
    patientId: p.id,
    name: pick(['Furosemide', 'Metformin', 'Lisinopril', 'Aspirin', 'Atorvastatin', 'Amlodipine', 'Pantoprazole', 'Warfarin', 'Levothyroxine', 'Ceftriaxone']),
    dose: pick(['5 mg', '10 mg', '20 mg', '40 mg', '81 mg', '500 mg']),
    route: pick(['PO', 'IV', 'SubQ']),
    frequency: pick(['Daily', 'BID', 'TID', 'QHS', 'Q6H PRN']),
    startDate: isoAgo(int(10, 200)),
    prescriberId: 'user-md-1',
    status: 'active',
    reconciled: rnd() > 0.4,
  });
}

export const reconciliations: MedicationReconciliation[] = [
  {
    id: 'recon-0001',
    patientId: 'pat-0001',
    encounterId: 'enc-0001',
    status: 'incomplete',
    startedAt: isoAgo(40),
    dueAt: isoAgo(3.2),
    items: [
      { medicationName: 'Furosemide 20 mg PO daily', priorDose: '20 mg PO daily' },
      { medicationName: 'Metformin 1000 mg PO BID', priorDose: '1000 mg PO BID' },
      { medicationName: 'Lisinopril 10 mg PO daily', priorDose: '10 mg PO daily' },
      { medicationName: 'Insulin Glargine 18 units QHS', priorDose: '16 units QHS' },
      { medicationName: 'Potassium Chloride 20 mEq PO daily', priorDose: '(new this admission)' },
    ],
  },
];

// ----- MAR --------------------------------------------------------------
export const administrations: MedicationAdministration[] = [];
{
  const times = [-9, -6, -3, 0, 3, 6];
  for (const m of medications.filter((x) => x.patientId === 'pat-0001')) {
    for (const t of times) {
      const past = t < 0;
      administrations.push({
        id: id('mar', administrations.length + 1),
        patientId: 'pat-0001',
        medicationId: m.id,
        medicationName: `${m.name} ${m.dose}`,
        scheduledTime: isoAhead(t),
        status: past ? (rnd() > 0.15 ? 'administered' : pick<MedicationAdministration['status']>(['held', 'refused', 'missed'])) : 'due',
        administeredById: past ? 'user-rn-1' : undefined,
        administeredAt: past ? isoAhead(t + 0.1) : undefined,
      });
    }
  }
}

// ----- orders ---------------------------------------------------------
export const orders: Order[] = [
  {
    id: 'ord-sw-1',
    patientId: 'pat-0001',
    name: 'Furosemide 40 mg IV BID',
    type: 'Medication',
    orderingProviderId: 'user-md-1',
    createdAt: isoAgo(6),
    priority: 'urgent',
    status: 'active',
    assignedToId: 'user-rn-1',
    linkedFindingIds: [],
  },
  {
    id: 'ord-sw-2',
    patientId: 'pat-0001',
    name: 'Basic Metabolic Panel in AM',
    type: 'Lab',
    orderingProviderId: 'user-md-1',
    createdAt: isoAgo(10),
    priority: 'routine',
    status: 'acknowledged',
    acknowledgedAt: isoAgo(9),
    acknowledgedById: 'user-rn-1',
    linkedFindingIds: [],
  },
  {
    id: 'ord-js-1',
    patientId: 'pat-0003',
    name: 'Ceftriaxone 1 g IV daily',
    type: 'Medication',
    orderingProviderId: 'user-md-1',
    createdAt: isoAgo(9),
    priority: 'urgent',
    status: 'active',
    assignedToId: 'user-rn-1',
    linkedFindingIds: [],
  },
];
for (let i = 0; i < 47; i++) {
  const p = pick(activePatients);
  orders.push({
    id: id('ord', 100 + i),
    patientId: p.id,
    name: pick(['CBC with differential', 'Chest X-ray', 'Physical Therapy Consult', 'Cardiac diet', 'Vancomycin 1 g IV Q12H', 'Telemetry monitoring']),
    type: pick<Order['type']>(['Lab', 'Imaging', 'Consult', 'Diet', 'Medication', 'Nursing']),
    orderingProviderId: 'user-md-1',
    createdAt: isoAgo(int(2, 120)),
    priority: pick<Order['priority']>(['routine', 'urgent', 'stat']),
    status: pick<Order['status']>(['active', 'acknowledged', 'completed', 'active']),
    assignedToId: pick(nurseIds),
    linkedFindingIds: [],
  });
}

// ----- labs ---------------------------------------------------------
export const labs: LabResult[] = [
  {
    id: 'lab-sw-k',
    patientId: 'pat-0001',
    test: 'Potassium',
    value: 5.7,
    units: 'mmol/L',
    referenceLow: 3.5,
    referenceHigh: 5.1,
    status: 'high',
    resultTime: isoAgo(3),
    reviewed: false,
    trend: [
      { time: isoAgo(72), value: 4.2 },
      { time: isoAgo(48), value: 4.6 },
      { time: isoAgo(24), value: 5.1 },
      { time: isoAgo(3), value: 5.7 },
    ],
    linkedFindingIds: [],
  },
  {
    id: 'lab-sw-cr',
    patientId: 'pat-0001',
    test: 'Creatinine',
    value: 1.6,
    units: 'mg/dL',
    referenceLow: 0.6,
    referenceHigh: 1.3,
    status: 'high',
    resultTime: isoAgo(3),
    reviewed: true,
    reviewedById: 'user-md-1',
    reviewedAt: isoAgo(2),
    trend: [
      { time: isoAgo(72), value: 1.3 },
      { time: isoAgo(24), value: 1.5 },
      { time: isoAgo(3), value: 1.6 },
    ],
    linkedFindingIds: [],
  },
  {
    id: 'lab-sw-bnp',
    patientId: 'pat-0001',
    test: 'BNP',
    value: 920,
    units: 'pg/mL',
    referenceLow: 0,
    referenceHigh: 100,
    status: 'critical_high',
    resultTime: isoAgo(20),
    reviewed: true,
    reviewedById: 'user-md-1',
    reviewedAt: isoAgo(19),
    trend: [
      { time: isoAgo(48), value: 1100 },
      { time: isoAgo(20), value: 920 },
    ],
    linkedFindingIds: [],
  },
];
for (let i = 0; i < 97; i++) {
  const p = pick(activePatients);
  const tests = [
    { t: 'Sodium', lo: 135, hi: 145, u: 'mmol/L' },
    { t: 'Hemoglobin', lo: 12, hi: 16, u: 'g/dL' },
    { t: 'WBC', lo: 4, hi: 11, u: 'K/uL' },
    { t: 'Glucose', lo: 70, hi: 140, u: 'mg/dL' },
    { t: 'Platelets', lo: 150, hi: 400, u: 'K/uL' },
  ];
  const spec = pick(tests);
  const val = Math.round((spec.lo + rnd() * (spec.hi - spec.lo) * 1.3) * 10) / 10;
  const status: LabResult['status'] = val > spec.hi ? 'high' : val < spec.lo ? 'low' : 'normal';
  labs.push({
    id: id('lab', 100 + i),
    patientId: p.id,
    test: spec.t,
    value: val,
    units: spec.u,
    referenceLow: spec.lo,
    referenceHigh: spec.hi,
    status,
    resultTime: isoAgo(int(2, 120)),
    reviewed: rnd() > 0.35,
    reviewedById: 'user-md-1',
    trend: [
      { time: isoAgo(48), value: Math.round((spec.lo + rnd() * (spec.hi - spec.lo)) * 10) / 10 },
      { time: isoAgo(2), value: val },
    ],
    linkedFindingIds: [],
  });
}

// ----- vitals -------------------------------------------------------
function mkVital(idx: number, type: Vital['type'], value: string, unit: string, series: number[], patientId: string): Vital {
  return {
    id: id('vit', idx),
    patientId,
    type,
    value,
    unit,
    recordedAt: isoAgo(1),
    recordedById: 'user-rn-1',
    series: series.map((v, i) => ({ time: isoAgo((series.length - i) * 8), value: v })),
  };
}
export const vitals: Vital[] = [
  mkVital(1, 'Blood Pressure', '138/84', 'mmHg', [128, 132, 145, 138], 'pat-0001'),
  mkVital(2, 'Pulse', '88', 'bpm', [82, 90, 96, 88], 'pat-0001'),
  mkVital(3, 'Temperature', '98.9', '°F', [98.4, 98.6, 99.1, 98.9], 'pat-0001'),
  mkVital(4, 'Respiratory Rate', '20', '/min', [18, 20, 22, 20], 'pat-0001'),
  mkVital(5, 'O2 Saturation', '94', '%', [96, 95, 93, 94], 'pat-0001'),
  mkVital(6, 'Weight', '181.4', 'lb', [178, 179.5, 182, 181.4], 'pat-0001'),
  mkVital(7, 'Pain', '2', '/10', [4, 3, 2, 2], 'pat-0001'),
];

// ----- care plans ------------------------------------------------
export const carePlans: CarePlan[] = [
  {
    id: 'cp-sw-chf',
    patientId: 'pat-0001',
    name: 'CHF Care Plan',
    status: 'active',
    problem: 'Reduced cardiac function related to heart failure exacerbation.',
    goal: 'Maintain stable cardiovascular status; patient verbalizes understanding of daily weight and sodium restriction before discharge.',
    interventions: [
      'Monitor daily weight at the same time each morning',
      'Assess for peripheral and pulmonary edema each shift',
      'Reinforce medication adherence and low-sodium diet',
      'Notify provider of weight gain > 2 lb in 24h or worsening dyspnea',
    ],
    responsibleDiscipline: 'Nursing',
    targetDate: isoAhead(13 * 24),
    latestPatientResponse: 'Patient able to state two low-sodium food choices. Denies dyspnea at rest.',
    lastReviewedAt: isoAgo(72),
    nextReviewAt: isoAgo(2),
    signatures: [
      { role: 'Nurse', required: true },
      { role: 'Physician', userId: 'user-md-1', signedAt: isoAgo(70), required: true },
    ],
    linkedFindingIds: [],
  },
];

// ----- tasks ---------------------------------------------------
export const tasks: Task[] = [
  {
    id: 'task-1',
    title: 'Complete medication reconciliation for Sarah Williams',
    patientId: 'pat-0001',
    relatedFindingId: 'find-0001',
    priority: 'critical',
    assignedToId: 'user-rn-1',
    dueAt: isoAgo(3.2),
    status: 'open',
    createdAt: isoAgo(3.4),
  },
  {
    id: 'task-2',
    title: 'Fall risk reassessment — Michael Brown',
    patientId: 'pat-0002',
    relatedFindingId: 'find-0008',
    priority: 'high',
    assignedToId: 'user-rn-2',
    dueAt: isoAgo(18),
    status: 'in_progress',
    createdAt: isoAgo(20),
  },
];
for (let i = 0; i < 18; i++) {
  const f = pick(findings);
  tasks.push({
    id: id('task', 100 + i),
    title: `Correct: ${f.title}`,
    patientId: f.patientId,
    relatedFindingId: f.id,
    priority: f.severity,
    assignedToId: f.assignedUserId ?? pick(nurseIds),
    dueAt: f.dueAt,
    status: pick<Task['status']>(['open', 'in_progress', 'completed', 'open']),
    createdAt: f.detectedAt,
  });
}

// ----- audit log ----------------------------------------------
export const auditEvents: AuditEvent[] = [];
const auditActions = [
  { action: 'Viewed patient chart', module: 'Patients', entity: 'Patient' },
  { action: 'Created note', module: 'Notes', entity: 'ClinicalNote' },
  { action: 'Signed assessment', module: 'Assessments', entity: 'Assessment' },
  { action: 'Updated medication', module: 'Medications', entity: 'Medication' },
  { action: 'Finding assigned', module: 'Risk', entity: 'RiskFinding' },
  { action: 'Finding resolved', module: 'Risk', entity: 'RiskFinding' },
  { action: 'Rule updated', module: 'Administration', entity: 'RiskRule' },
  { action: 'Report exported', module: 'Reports', entity: 'Report' },
];
for (let i = 0; i < 60; i++) {
  const u = pick(users);
  const a = pick(auditActions);
  const p = pick(patients);
  auditEvents.push({
    id: id('aud', i + 1),
    at: isoAgo(int(1, 300) / 3),
    userId: u.id,
    userName: u.name,
    role: u.role,
    action: a.action,
    module: a.module,
    patientId: a.module === 'Patients' || a.module === 'Notes' ? p.id : undefined,
    entity: a.entity,
    details: `${a.action} — ${a.entity}`,
    ip: `10.4.${int(1, 40)}.${int(2, 250)}`,
    session: `sess_${Math.floor(rnd() * 1e9).toString(36)}`,
  });
}

// ----- AI governance ----------------------------------------
export const aiAnalyses: AIAnalysis[] = [
  { id: 'ai-1', feature: 'Chart Summarization', model: 'Demo Clinical LLM', version: '2026.08', purpose: 'Summarize existing records for clinician review.', status: 'active', lastValidation: isoAgo(240), enabledFacilityIds: ['fac-1', 'fac-2', 'fac-3'] },
  { id: 'ai-2', feature: 'Contradiction Detection', model: 'Demo Clinical LLM', version: '2026.08', purpose: 'Identify possible inconsistencies across interdisciplinary documentation.', status: 'active', lastValidation: isoAgo(240), enabledFacilityIds: ['fac-1', 'fac-2', 'fac-3'] },
  { id: 'ai-3', feature: 'Documentation Quality Review', model: 'Demo Clinical LLM', version: '2026.08', purpose: 'Flag missing required fields and low-substance documentation.', status: 'active', lastValidation: isoAgo(240), enabledFacilityIds: ['fac-1', 'fac-2', 'fac-3'] },
  { id: 'ai-4', feature: 'Ask the Chart', model: 'Demo Clinical LLM', version: '2026.08', purpose: 'Answer grounded questions about a single patient record with citations.', status: 'active', lastValidation: isoAgo(240), enabledFacilityIds: ['fac-1', 'fac-2', 'fac-3'] },
];

// ----- notifications --------------------------------------
export const notifications: Notification[] = [
  { id: 'ntf-1', at: isoAgo(0.3), title: 'Critical finding overdue', body: 'Sarah Williams — Medication Reconciliation Incomplete is 3h overdue.', severity: 'critical', read: false, link: '/risk/inbox' },
  { id: 'ntf-2', at: isoAgo(1), title: 'Physician signature missing', body: 'John Smith — order pending provider signature for 8h.', severity: 'critical', read: false, link: '/risk/inbox' },
  { id: 'ntf-3', at: isoAgo(2), title: 'AI finding needs review', body: 'Possible mobility documentation inconsistency for Sarah Williams.', severity: 'medium', read: false, link: '/risk/inbox' },
  { id: 'ntf-4', at: isoAgo(5), title: '12 findings resolved', body: 'Overnight remediation closed 12 findings on Unit A.', severity: 'resolved', read: true },
];

// ----- exceptions & false positives ------------------------
export const exceptions: ExceptionRequest[] = [
  {
    id: 'exc-1',
    findingId: 'find-0008',
    patientId: 'pat-0002',
    requestedById: 'user-rn-2',
    reason: 'Patient transferred to interventional radiology before the required reassessment window closed. Reassessment completed on return and documented.',
    status: 'pending',
    createdAt: isoAgo(4),
    history: [{ at: isoAgo(4), actorId: 'user-rn-2', action: 'Exception requested' }],
  },
];

export const falsePositives: FalsePositiveReview[] = [
  {
    id: 'fp-1',
    findingId: 'find-0009',
    patientId: 'pat-0002',
    findingType: 'Possible Duplicated Nursing Note',
    submittedById: 'user-rn-2',
    reason: 'Second note is a distinct hand-off addendum with new IV site assessment. Not a duplicate.',
    aiConfidence: 0.61,
    status: 'pending',
  },
];

// bundle
export interface MockDB {
  org: Organization;
  facilities: Facility[];
  units: Unit[];
  roles: Role[];
  users: User[];
  patients: Patient[];
  riskRules: RiskRule[];
  findings: RiskFinding[];
  notes: ClinicalNote[];
  assessments: Assessment[];
  medications: Medication[];
  reconciliations: MedicationReconciliation[];
  administrations: MedicationAdministration[];
  orders: Order[];
  labs: LabResult[];
  vitals: Vital[];
  carePlans: CarePlan[];
  tasks: Task[];
  auditEvents: AuditEvent[];
  aiAnalyses: AIAnalysis[];
  notifications: Notification[];
  exceptions: ExceptionRequest[];
  falsePositives: FalsePositiveReview[];
}

export function buildMockDb(): MockDB {
  return {
    org,
    facilities,
    units,
    roles,
    users,
    patients,
    riskRules,
    findings,
    notes,
    assessments,
    medications,
    reconciliations,
    administrations,
    orders,
    labs,
    vitals,
    carePlans,
    tasks,
    auditEvents,
    aiAnalyses,
    notifications,
    exceptions,
    falsePositives,
  };
}
