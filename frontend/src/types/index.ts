/**
 * Core domain models for the Clinical Documentation Risk Intelligence EHR.
 * These interfaces mirror what a real API would return so the mock service
 * layer can be swapped for HTTP calls without touching feature code.
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type SeverityOrResolved = Severity | 'resolved';

export type FindingStatus =
  | 'detected'
  | 'assigned'
  | 'acknowledged'
  | 'in_progress'
  | 'corrected'
  | 'awaiting_verification'
  | 'closed'
  | 'accepted_exception'
  | 'false_positive';

export type RiskCategory =
  | 'assessments'
  | 'signatures'
  | 'care_plans'
  | 'medication_reconciliation'
  | 'orders'
  | 'labs'
  | 'notes'
  | 'consent';

export type RoleName =
  | 'Nurse'
  | 'Physician'
  | 'Director of Nursing'
  | 'Compliance'
  | 'Administrator'
  | 'Charge Nurse';

export interface Organization {
  id: string;
  name: string;
}

export interface Facility {
  id: string;
  orgId: string;
  name: string;
  code: string;
  city: string;
  state: string;
}

export interface Unit {
  id: string;
  facilityId: string;
  name: string;
  type: string;
  beds: number;
}

export interface Role {
  id: string;
  name: RoleName;
  description: string;
}

export interface User {
  id: string;
  name: string;
  credentials: string; // e.g. "MSN, RN"
  role: RoleName;
  email: string;
  facilityId: string;
  unitId?: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  avatarColor: string;
}

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dob: string;
  sex: 'M' | 'F';
  facilityId: string;
  unitId: string;
  room: string;
  attendingId: string; // physician user id
  primaryNurseId: string;
  admissionDate: string;
  admissionStatus: 'admitted' | 'observation' | 'discharged';
  dischargeDate?: string;
  allergies: { substance: string; reaction: string; severity: Severity }[];
  diagnoses: string[];
  documentationRiskScore: number; // 0-100
  documentationCompliance: number; // 0-100 %
}

export interface Encounter {
  id: string;
  patientId: string;
  facilityId: string;
  type: 'inpatient' | 'observation';
  admittedAt: string;
  dischargedAt?: string;
  reason: string;
}

export type NoteType =
  | 'Nursing Note'
  | 'Progress Note'
  | 'Physician Note'
  | 'Admission Note'
  | 'Discharge Note'
  | 'Incident Note';

export type NoteStatus = 'draft' | 'complete' | 'signed' | 'addendum';

export interface NoteAddendum {
  id: string;
  authorId: string;
  createdAt: string;
  text: string;
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  type: NoteType;
  title: string;
  authorId: string;
  createdAt: string;
  signedAt?: string;
  status: NoteStatus;
  fields: Record<string, string>;
  addenda: NoteAddendum[];
  versionHistory: { version: number; savedAt: string; authorId: string; summary: string }[];
  linkedFindingIds: string[];
}

export type AssessmentType =
  | 'Admission Assessment'
  | 'Fall Risk Assessment'
  | 'Pain Assessment'
  | 'Skin/Wound Assessment'
  | 'Functional Assessment'
  | 'Discharge Assessment';

export type AssessmentStatus = 'complete' | 'incomplete' | 'due_soon' | 'overdue';

export interface Assessment {
  id: string;
  patientId: string;
  type: AssessmentType;
  lastCompletedAt?: string;
  dueAt: string;
  status: AssessmentStatus;
  completedById?: string;
  completionPercent: number;
  score?: number;
  riskCategory?: string;
  fields: Record<string, string | number>;
  linkedFindingIds: string[];
}

export type MedicationStatus = 'active' | 'discontinued' | 'held';

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dose: string;
  route: string;
  frequency: string;
  startDate: string;
  prescriberId: string;
  status: MedicationStatus;
  reconciled: boolean;
  high_alert?: boolean;
}

export type ReconciliationStatus = 'not_started' | 'in_progress' | 'incomplete' | 'complete';

export interface MedicationReconciliation {
  id: string;
  patientId: string;
  encounterId: string;
  status: ReconciliationStatus;
  startedAt?: string;
  completedAt?: string;
  completedById?: string;
  dueAt: string;
  items: {
    medicationName: string;
    priorDose: string;
    decision?: 'continue' | 'change' | 'discontinue' | 'add';
    note?: string;
  }[];
}

export type AdminStatus = 'administered' | 'due' | 'held' | 'refused' | 'missed';

export interface MedicationAdministration {
  id: string;
  patientId: string;
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
  status: AdminStatus;
  administeredById?: string;
  administeredAt?: string;
  note?: string;
}

export type OrderStatus =
  | 'draft'
  | 'active'
  | 'acknowledged'
  | 'completed'
  | 'discontinued'
  | 'expired';

export interface Order {
  id: string;
  patientId: string;
  name: string;
  type: 'Medication' | 'Lab' | 'Imaging' | 'Nursing' | 'Diet' | 'Consult';
  orderingProviderId: string;
  createdAt: string;
  priority: 'routine' | 'urgent' | 'stat';
  status: OrderStatus;
  acknowledgedAt?: string;
  acknowledgedById?: string;
  assignedToId?: string;
  linkedFindingIds: string[];
}

export type LabStatus = 'normal' | 'high' | 'low' | 'critical_high' | 'critical_low';

export interface LabResult {
  id: string;
  patientId: string;
  test: string;
  value: number;
  units: string;
  referenceLow: number;
  referenceHigh: number;
  status: LabStatus;
  resultTime: string;
  reviewed: boolean;
  reviewedById?: string;
  reviewedAt?: string;
  trend: { time: string; value: number }[];
  linkedFindingIds: string[];
}

export type VitalType =
  | 'Blood Pressure'
  | 'Pulse'
  | 'Temperature'
  | 'Respiratory Rate'
  | 'O2 Saturation'
  | 'Weight'
  | 'Pain';

export interface Vital {
  id: string;
  patientId: string;
  type: VitalType;
  value: string;
  unit: string;
  recordedAt: string;
  recordedById: string;
  series: { time: string; value: number }[];
}

export type CarePlanStatus = 'active' | 'resolved' | 'draft';

export interface CarePlan {
  id: string;
  patientId: string;
  name: string;
  status: CarePlanStatus;
  problem: string;
  goal: string;
  interventions: string[];
  responsibleDiscipline: string;
  targetDate: string;
  latestPatientResponse: string;
  lastReviewedAt?: string;
  nextReviewAt: string;
  signatures: { role: RoleName; userId?: string; signedAt?: string; required: boolean }[];
  linkedFindingIds: string[];
}

export type TaskStatus = 'open' | 'in_progress' | 'blocked' | 'completed';

export interface Task {
  id: string;
  title: string;
  patientId?: string;
  relatedFindingId?: string;
  priority: Severity;
  assignedToId: string;
  dueAt: string;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
}

export type RuleTriggerType =
  | 'Patient Admitted'
  | 'Fall Incident'
  | 'Order Entered'
  | 'Lab Resulted'
  | 'Note Signed'
  | 'Shift Change'
  | 'Care Plan Created';

export type RuleEvaluationType = 'Deterministic' | 'AI-Assisted';

export interface RuleEscalationStep {
  afterHoursOverdue: number;
  notifyRole: RoleName;
  raiseSeverityTo?: Severity;
}

export interface RiskRule {
  id: string; // e.g. RX-ADM-001
  name: string;
  category: RiskCategory;
  trigger: RuleTriggerType;
  requirement: string;
  deadlineHours: number;
  severity: Severity;
  escalation: RuleEscalationStep[];
  responsibleRole: RoleName;
  scope: string; // "All Facilities" | facility name
  evaluationType: RuleEvaluationType;
  version: number;
  status: 'active' | 'draft' | 'inactive';
  updatedAt: string;
  updatedById: string;
}

export interface FindingEvidence {
  label: string;
  value: string;
  emphasis?: 'normal' | 'warning' | 'danger';
  sourceRef?: { kind: string; id: string; label: string };
}

export interface FindingTimelineEvent {
  id: string;
  at: string;
  actorId?: string;
  actorName?: string;
  type:
    | 'generated'
    | 'assigned'
    | 'acknowledged'
    | 'documentation_updated'
    | 'reevaluated'
    | 'awaiting_verification'
    | 'verified'
    | 'closed'
    | 'escalated'
    | 'commented'
    | 'exception_requested'
    | 'false_positive';
  description: string;
}

export interface RiskFinding {
  id: string;
  patientId: string;
  facilityId: string;
  unitId: string;
  ruleId: string;
  ruleVersion: number;
  title: string;
  description: string;
  category: RiskCategory;
  severity: Severity;
  priorityScore: number; // 0-100
  scoreBreakdown: { label: string; points: number }[];
  status: FindingStatus;
  assignedUserId?: string;
  detectedAt: string;
  dueAt: string;
  isOverdue: boolean;
  isAiGenerated: boolean;
  confidence?: number; // 0-1 for AI findings
  evidence: FindingEvidence[];
  whyFlagged: string;
  recommendedAction: string;
  recommendedActionLink?: string;
  timeline: FindingTimelineEvent[];
  verifiedById?: string;
  sourceRefs: { kind: string; id: string; label: string }[];
}

export interface AuditEvent {
  id: string;
  at: string;
  userId: string;
  userName: string;
  role: RoleName;
  action: string;
  module: string;
  patientId?: string;
  entity: string;
  details: string;
  ip: string;
  session: string;
}

export interface AIAnalysis {
  id: string;
  feature: 'Chart Summarization' | 'Contradiction Detection' | 'Documentation Quality Review' | 'Ask the Chart';
  model: string;
  version: string;
  purpose: string;
  status: 'active' | 'disabled';
  lastValidation: string;
  enabledFacilityIds: string[];
}

export interface Notification {
  id: string;
  at: string;
  title: string;
  body: string;
  severity: SeverityOrResolved;
  read: boolean;
  link?: string;
}

export interface ExceptionRequest {
  id: string;
  findingId: string;
  patientId: string;
  requestedById: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'info_requested';
  createdAt: string;
  history: { at: string; actorId: string; action: string }[];
}

export interface FalsePositiveReview {
  id: string;
  findingId: string;
  patientId: string;
  findingType: string;
  submittedById: string;
  reason: string;
  aiConfidence: number;
  status: 'pending' | 'confirmed' | 'reinstated';
}
