import { create } from 'zustand';
import { buildMockDb, NOW, type MockDB } from '@/data/mockdb';
import type {
  AuditEvent,
  FindingStatus,
  FindingTimelineEvent,
  RiskFinding,
  RiskRule,
  User,
} from '@/types';

let uid = 0;
const nextId = (p: string) => `${p}-${Date.now().toString(36)}-${uid++}`;

export interface Toast {
  id: string;
  title: string;
  tone: 'success' | 'info' | 'warning' | 'error';
  body?: string;
}

interface StoreState {
  db: MockDB;
  currentUser: User | null;
  facilityFilter: string; // 'all' | facilityId
  toasts: Toast[];
  now: string;

  // auth
  login: (email: string) => boolean;
  logout: () => void;
  setFacilityFilter: (f: string) => void;

  // toasts
  pushToast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;

  // finding lifecycle
  assignFinding: (findingId: string, userId: string) => void;
  acknowledgeFinding: (findingId: string) => void;
  escalateFinding: (findingId: string) => void;
  verifyFinding: (findingId: string) => void;
  markFalsePositive: (findingId: string, reason: string) => void;

  // clinical interactions that cascade to findings
  completeReconciliation: (patientId: string) => void;
  reviewLab: (labId: string) => void;
  acknowledgeOrder: (orderId: string) => void;
  completeAssessment: (assessmentId: string) => void;
  signCarePlan: (carePlanId: string) => void;

  // notes
  updateNoteField: (noteId: string, field: string, value: string) => void;
  signNote: (noteId: string, override?: { reason: string }) => void;
  addAddendum: (noteId: string, text: string) => void;

  // rules
  saveRule: (rule: RiskRule) => void;
  activateRule: (ruleId: string) => void;

  // exceptions
  resolveException: (exceptionId: string, decision: 'approved' | 'rejected' | 'info_requested') => void;
  resolveFalsePositive: (fpId: string, decision: 'confirmed' | 'reinstated') => void;

  // tasks
  setTaskStatus: (taskId: string, status: 'open' | 'in_progress' | 'blocked' | 'completed') => void;
}

function audit(db: MockDB, user: User | null, action: string, module: string, entity: string, details: string, patientId?: string) {
  const e: AuditEvent = {
    id: nextId('aud'),
    at: new Date().toISOString(),
    userId: user?.id ?? 'system',
    userName: user?.name ?? 'System',
    role: user?.role ?? 'Administrator',
    action,
    module,
    entity,
    patientId,
    details,
    ip: '10.4.12.88',
    session: 'sess_demo',
  };
  db.auditEvents = [e, ...db.auditEvents];
}

function addTimeline(f: RiskFinding, ev: Omit<FindingTimelineEvent, 'id'>) {
  f.timeline = [...f.timeline, { ...ev, id: nextId('tl') }];
}

function recompute(db: MockDB) {
  // Keep patient-level compliance coherent as findings resolve: start from a
  // stable per-patient baseline and dock a few points per open finding,
  // weighted by severity. Resolving findings visibly raises the number.
  for (const p of db.patients) {
    const open = db.findings.filter(
      (f) => f.patientId === p.id && ['detected', 'assigned', 'acknowledged', 'in_progress', 'corrected', 'awaiting_verification'].includes(f.status),
    );
    const penalty = open.reduce((s, f) => s + (f.severity === 'critical' ? 7 : f.severity === 'high' ? 4 : f.severity === 'medium' ? 2 : 1), 0);
    p.documentationCompliance = Math.max(55, Math.min(100, 98 - penalty));
  }
}

const SESSION_KEY = 'sentinel.session.userId';
function readSessionUserId(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}
function writeSessionUserId(id: string | null) {
  try {
    if (id) localStorage.setItem(SESSION_KEY, id);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

// The working dataset is persisted to sessionStorage so a mid-demo page refresh
// keeps interaction state (completed reconciliations, verified findings, …).
// It is scoped to the tab and clears when the tab closes. Bump DB_VERSION to
// invalidate stale shapes after a data-model change.
const DB_VERSION = 7;
const DB_KEY = 'sentinel.db.v' + DB_VERSION;

function loadDb(): MockDB {
  try {
    const raw = sessionStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as MockDB;
  } catch {
    /* ignore */
  }
  return buildMockDb();
}
function persistDb(db: MockDB) {
  try {
    sessionStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* ignore */
  }
}
export function resetDemoData() {
  try {
    sessionStorage.removeItem(DB_KEY);
  } catch {
    /* ignore */
  }
  useStore.setState({ db: buildMockDb() });
}

const initialDb = loadDb();
recompute(initialDb); // align seeded compliance with the live scoring model
const restoredUser = initialDb.users.find((u) => u.id === readSessionUserId()) ?? null;

export const useStore = create<StoreState>((set, get) => ({
  db: initialDb,
  currentUser: restoredUser,
  facilityFilter: 'all',
  toasts: [],
  now: NOW,

  login: (email) => {
    const user = get().db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return false;
    writeSessionUserId(user.id);
    set((s) => {
      audit(s.db, user, 'Signed in', 'Authentication', 'Session', `${user.name} signed in`);
      return { currentUser: user, facilityFilter: 'all' };
    });
    return true;
  },
  logout: () => {
    writeSessionUserId(null);
    set({ currentUser: null });
  },
  setFacilityFilter: (f) => set({ facilityFilter: f }),

  pushToast: (t) =>
    set((s) => ({ toasts: [...s.toasts, { ...t, id: nextId('toast') }] })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  assignFinding: (findingId, userId) =>
    set((s) => {
      const db = structuredClone(s.db);
      const f = db.findings.find((x) => x.id === findingId);
      if (!f) return {};
      const assignee = db.users.find((u) => u.id === userId);
      f.assignedUserId = userId;
      if (f.status === 'detected') f.status = 'assigned';
      addTimeline(f, { at: new Date().toISOString(), type: 'assigned', actorName: s.currentUser?.name, description: `Assigned to ${assignee?.name ?? 'user'}.` });
      audit(db, s.currentUser, 'Finding assigned', 'Risk', 'RiskFinding', `${f.title} → ${assignee?.name}`, f.patientId);
      get().pushToast({ title: 'Finding assigned successfully.', tone: 'success', body: `${f.title} assigned to ${assignee?.name}.` });
      return { db };
    }),

  acknowledgeFinding: (findingId) =>
    set((s) => {
      const db = structuredClone(s.db);
      const f = db.findings.find((x) => x.id === findingId);
      if (!f) return {};
      f.status = 'acknowledged';
      addTimeline(f, { at: new Date().toISOString(), type: 'acknowledged', actorName: s.currentUser?.name, description: `${s.currentUser?.name} acknowledged the finding.` });
      audit(db, s.currentUser, 'Finding acknowledged', 'Risk', 'RiskFinding', f.title, f.patientId);
      get().pushToast({ title: 'Finding acknowledged.', tone: 'info' });
      return { db };
    }),

  escalateFinding: (findingId) =>
    set((s) => {
      const db = structuredClone(s.db);
      const f = db.findings.find((x) => x.id === findingId);
      if (!f) return {};
      if (f.severity === 'high') f.severity = 'critical';
      else if (f.severity === 'medium') f.severity = 'high';
      f.priorityScore = Math.min(100, f.priorityScore + 8);
      addTimeline(f, { at: new Date().toISOString(), type: 'escalated', actorName: s.currentUser?.name, description: `Escalated to ${f.severity}. Director of Nursing notified.` });
      audit(db, s.currentUser, 'Finding escalated', 'Risk', 'RiskFinding', `${f.title} → ${f.severity}`, f.patientId);
      get().pushToast({ title: 'Finding escalated.', tone: 'warning', body: `Now ${f.severity}. Leadership notified.` });
      return { db };
    }),

  verifyFinding: (findingId) =>
    set((s) => {
      const db = structuredClone(s.db);
      const f = db.findings.find((x) => x.id === findingId);
      if (!f) return {};
      f.status = 'closed';
      f.verifiedById = s.currentUser?.id;
      addTimeline(f, { at: new Date().toISOString(), type: 'verified', actorName: s.currentUser?.name, description: `Correction verified by ${s.currentUser?.name}.` });
      addTimeline(f, { at: new Date().toISOString(), type: 'closed', actorName: s.currentUser?.name, description: 'Finding closed.' });
      audit(db, s.currentUser, 'Finding resolved', 'Risk', 'RiskFinding', `${f.title} verified & closed`, f.patientId);
      recompute(db);
      get().pushToast({ title: 'Finding verified and closed.', tone: 'success', body: f.title });
      return { db };
    }),

  markFalsePositive: (findingId, reason) =>
    set((s) => {
      const db = structuredClone(s.db);
      const f = db.findings.find((x) => x.id === findingId);
      if (!f) return {};
      f.status = 'false_positive';
      addTimeline(f, { at: new Date().toISOString(), type: 'false_positive', actorName: s.currentUser?.name, description: `Marked false positive: ${reason}` });
      db.falsePositives = [
        {
          id: nextId('fp'),
          findingId: f.id,
          patientId: f.patientId,
          findingType: f.title,
          submittedById: s.currentUser?.id ?? 'user-don-1',
          reason,
          aiConfidence: f.confidence ?? 0.5,
          status: 'pending',
        },
        ...db.falsePositives,
      ];
      audit(db, s.currentUser, 'Finding marked false positive', 'Risk', 'RiskFinding', f.title, f.patientId);
      recompute(db);
      get().pushToast({ title: 'Finding sent to False Positive Review.', tone: 'info' });
      return { db };
    }),

  completeReconciliation: (patientId) =>
    set((s) => {
      const db = structuredClone(s.db);
      const recon = db.reconciliations.find((r) => r.patientId === patientId);
      if (recon) {
        recon.status = 'complete';
        recon.completedAt = new Date().toISOString();
        recon.completedById = s.currentUser?.id;
        recon.items = recon.items.map((it) => ({ ...it, decision: it.decision ?? 'continue' }));
      }
      db.medications.filter((m) => m.patientId === patientId).forEach((m) => (m.reconciled = true));
      const f = db.findings.find(
        (x) => x.patientId === patientId && x.category === 'medication_reconciliation' && ['detected', 'assigned', 'acknowledged', 'in_progress'].includes(x.status),
      );
      if (f) {
        f.status = 'awaiting_verification';
        addTimeline(f, { at: new Date().toISOString(), type: 'documentation_updated', actorName: s.currentUser?.name, description: 'Medication reconciliation completed and signed.' });
        addTimeline(f, { at: new Date().toISOString(), type: 'reevaluated', actorName: 'System', description: 'Rule RX-ADM-001 re-evaluated — requirement now satisfied.' });
        addTimeline(f, { at: new Date().toISOString(), type: 'awaiting_verification', actorName: 'System', description: 'Documentation corrected. Finding moved to Awaiting Verification.' });
        f.status = 'awaiting_verification';
      }
      audit(db, s.currentUser, 'Updated medication', 'Medications', 'MedicationReconciliation', 'Medication reconciliation completed', patientId);
      recompute(db);
      get().pushToast({ title: 'Medication reconciliation completed.', tone: 'success', body: 'Documentation re-evaluated. Finding moved to Awaiting Verification.' });
      return { db };
    }),

  reviewLab: (labId) =>
    set((s) => {
      const db = structuredClone(s.db);
      const lab = db.labs.find((l) => l.id === labId);
      if (!lab) return {};
      lab.reviewed = true;
      lab.reviewedById = s.currentUser?.id;
      lab.reviewedAt = new Date().toISOString();
      const f = db.findings.find((x) => x.patientId === lab.patientId && x.category === 'labs' && ['detected', 'assigned', 'acknowledged', 'in_progress'].includes(x.status));
      if (f) {
        addTimeline(f, { at: new Date().toISOString(), type: 'documentation_updated', actorName: s.currentUser?.name, description: `Lab review documented for ${lab.test}.` });
        addTimeline(f, { at: new Date().toISOString(), type: 'awaiting_verification', actorName: 'System', description: 'Finding moved to Awaiting Verification.' });
        f.status = 'awaiting_verification';
      }
      audit(db, s.currentUser, 'Reviewed lab result', 'Labs', 'LabResult', `${lab.test} ${lab.value} ${lab.units}`, lab.patientId);
      recompute(db);
      get().pushToast({ title: 'Lab review documented.', tone: 'success' });
      return { db };
    }),

  acknowledgeOrder: (orderId) =>
    set((s) => {
      const db = structuredClone(s.db);
      const o = db.orders.find((x) => x.id === orderId);
      if (!o) return {};
      o.status = 'acknowledged';
      o.acknowledgedAt = new Date().toISOString();
      o.acknowledgedById = s.currentUser?.id;
      const f = db.findings.find((x) => x.patientId === o.patientId && x.category === 'orders' && ['detected', 'assigned', 'acknowledged', 'in_progress'].includes(x.status));
      if (f) {
        addTimeline(f, { at: new Date().toISOString(), type: 'documentation_updated', actorName: s.currentUser?.name, description: `Order acknowledged: ${o.name}.` });
        addTimeline(f, { at: new Date().toISOString(), type: 'awaiting_verification', actorName: 'System', description: 'Finding moved to Awaiting Verification.' });
        f.status = 'awaiting_verification';
      }
      audit(db, s.currentUser, 'Acknowledged order', 'Orders', 'Order', o.name, o.patientId);
      recompute(db);
      get().pushToast({ title: 'Order acknowledged.', tone: 'success' });
      return { db };
    }),

  completeAssessment: (assessmentId) =>
    set((s) => {
      const db = structuredClone(s.db);
      const a = db.assessments.find((x) => x.id === assessmentId);
      if (!a) return {};
      a.status = 'complete';
      a.completionPercent = 100;
      a.lastCompletedAt = new Date().toISOString();
      a.completedById = s.currentUser?.id;
      const f = db.findings.find((x) => x.patientId === a.patientId && x.category === 'assessments' && ['detected', 'assigned', 'acknowledged', 'in_progress'].includes(x.status));
      if (f) {
        addTimeline(f, { at: new Date().toISOString(), type: 'documentation_updated', actorName: s.currentUser?.name, description: `${a.type} completed.` });
        addTimeline(f, { at: new Date().toISOString(), type: 'awaiting_verification', actorName: 'System', description: 'Finding moved to Awaiting Verification.' });
        f.status = 'awaiting_verification';
      }
      audit(db, s.currentUser, 'Signed assessment', 'Assessments', 'Assessment', a.type, a.patientId);
      recompute(db);
      get().pushToast({ title: `${a.type} completed.`, tone: 'success', body: 'Documentation re-evaluated.' });
      return { db };
    }),

  signCarePlan: (carePlanId) =>
    set((s) => {
      const db = structuredClone(s.db);
      const cp = db.carePlans.find((x) => x.id === carePlanId);
      if (!cp) return {};
      cp.signatures = cp.signatures.map((sig) => (sig.role === 'Nurse' && !sig.signedAt ? { ...sig, userId: s.currentUser?.id, signedAt: new Date().toISOString() } : sig));
      cp.lastReviewedAt = new Date().toISOString();
      const f = db.findings.find((x) => x.patientId === cp.patientId && x.category === 'care_plans' && ['detected', 'assigned', 'acknowledged', 'in_progress'].includes(x.status));
      if (f) {
        addTimeline(f, { at: new Date().toISOString(), type: 'documentation_updated', actorName: s.currentUser?.name, description: 'Care plan reviewed and signed.' });
        addTimeline(f, { at: new Date().toISOString(), type: 'awaiting_verification', actorName: 'System', description: 'Finding moved to Awaiting Verification.' });
        f.status = 'awaiting_verification';
      }
      audit(db, s.currentUser, 'Signed care plan', 'Care Plans', 'CarePlan', cp.name, cp.patientId);
      recompute(db);
      get().pushToast({ title: 'Care plan signed.', tone: 'success' });
      return { db };
    }),

  updateNoteField: (noteId, field, value) =>
    set((s) => {
      const db = structuredClone(s.db);
      const n = db.notes.find((x) => x.id === noteId);
      if (!n || n.status === 'signed') return {};
      n.fields[field] = value;
      return { db };
    }),

  signNote: (noteId, override) =>
    set((s) => {
      const db = structuredClone(s.db);
      const n = db.notes.find((x) => x.id === noteId);
      if (!n) return {};
      n.status = 'signed';
      n.signedAt = new Date().toISOString();
      n.versionHistory = [
        ...n.versionHistory,
        { version: n.versionHistory.length + 1, savedAt: n.signedAt, authorId: s.currentUser?.id ?? n.authorId, summary: override ? `Signed with override: ${override.reason}` : 'Signed after documentation review' },
      ];
      audit(db, s.currentUser, override ? 'Signed note (override)' : 'Signed note', 'Notes', 'ClinicalNote', n.title + (override ? ` — override: ${override.reason}` : ''), n.patientId);
      recompute(db);
      get().pushToast({ title: 'Note signed.', tone: 'success', body: override ? 'Override reason recorded in the audit log.' : 'Documentation review passed.' });
      return { db };
    }),

  addAddendum: (noteId, text) =>
    set((s) => {
      const db = structuredClone(s.db);
      const n = db.notes.find((x) => x.id === noteId);
      if (!n) return {};
      n.addenda = [...n.addenda, { id: nextId('add'), authorId: s.currentUser?.id ?? n.authorId, createdAt: new Date().toISOString(), text }];
      n.status = 'addendum';
      audit(db, s.currentUser, 'Added addendum', 'Notes', 'ClinicalNote', n.title, n.patientId);
      get().pushToast({ title: 'Addendum added.', tone: 'success' });
      return { db };
    }),

  saveRule: (rule) =>
    set((s) => {
      const db = structuredClone(s.db);
      const existing = db.riskRules.findIndex((r) => r.id === rule.id);
      const updated = { ...rule, updatedAt: new Date().toISOString(), updatedById: s.currentUser?.id ?? 'user-admin-1' };
      if (existing >= 0) {
        updated.version = db.riskRules[existing].version + (rule.status === 'active' ? 0 : 0);
        db.riskRules[existing] = updated;
      } else {
        db.riskRules = [updated, ...db.riskRules];
      }
      audit(db, s.currentUser, 'Rule updated', 'Administration', 'RiskRule', `${rule.id} — ${rule.name}`);
      get().pushToast({ title: 'Rule saved as draft.', tone: 'success' });
      return { db };
    }),

  activateRule: (ruleId) =>
    set((s) => {
      const db = structuredClone(s.db);
      const r = db.riskRules.find((x) => x.id === ruleId);
      if (!r) return {};
      r.status = 'active';
      r.version += 1;
      r.updatedAt = new Date().toISOString();
      audit(db, s.currentUser, 'Rule activated', 'Administration', 'RiskRule', `${r.id} v${r.version}`);
      get().pushToast({ title: 'Rule activated successfully.', tone: 'success', body: `${r.name} is now live (v${r.version}).` });
      return { db };
    }),

  resolveException: (exceptionId, decision) =>
    set((s) => {
      const db = structuredClone(s.db);
      const ex = db.exceptions.find((x) => x.id === exceptionId);
      if (!ex) return {};
      ex.status = decision;
      ex.history = [...ex.history, { at: new Date().toISOString(), actorId: s.currentUser?.id ?? 'user-don-1', action: `Exception ${decision}` }];
      if (decision === 'approved') {
        const f = db.findings.find((x) => x.id === ex.findingId);
        if (f) {
          f.status = 'accepted_exception';
          addTimeline(f, { at: new Date().toISOString(), type: 'exception_requested', actorName: s.currentUser?.name, description: 'Exception approved by Director of Nursing.' });
        }
      }
      audit(db, s.currentUser, `Exception ${decision}`, 'Risk', 'ExceptionRequest', ex.reason.slice(0, 60), ex.patientId);
      recompute(db);
      get().pushToast({ title: `Exception ${decision}.`, tone: decision === 'approved' ? 'success' : 'info' });
      return { db };
    }),

  resolveFalsePositive: (fpId, decision) =>
    set((s) => {
      const db = structuredClone(s.db);
      const fp = db.falsePositives.find((x) => x.id === fpId);
      if (!fp) return {};
      fp.status = decision;
      const f = db.findings.find((x) => x.id === fp.findingId);
      if (f) {
        if (decision === 'confirmed') f.status = 'false_positive';
        else {
          f.status = 'detected';
          addTimeline(f, { at: new Date().toISOString(), type: 'commented', actorName: s.currentUser?.name, description: 'Finding reinstated after false-positive review.' });
        }
      }
      audit(db, s.currentUser, `False positive ${decision}`, 'AI Governance', 'FalsePositiveReview', fp.findingType, fp.patientId);
      recompute(db);
      get().pushToast({ title: decision === 'confirmed' ? 'False positive confirmed.' : 'Finding reinstated.', tone: 'info' });
      return { db };
    }),

  setTaskStatus: (taskId, status) =>
    set((s) => {
      const db = structuredClone(s.db);
      const t = db.tasks.find((x) => x.id === taskId);
      if (!t) return {};
      t.status = status;
      if (status === 'completed') t.completedAt = new Date().toISOString();
      audit(db, s.currentUser, 'Task updated', 'Tasks', 'Task', `${t.title} → ${status}`, t.patientId);
      get().pushToast({
        title: status === 'completed' ? 'Task completed.' : 'Task updated.',
        tone: 'info',
        body: status === 'completed' ? 'The underlying documentation will be re-evaluated before the risk finding is resolved.' : undefined,
      });
      return { db };
    }),
}));

// Persist the working dataset on every change (debounced via microtask batching).
useStore.subscribe((state, prev) => {
  if (state.db !== prev.db) persistDb(state.db);
});
