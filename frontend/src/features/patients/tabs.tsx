import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  FileText,
  FlaskConical,
  Pill,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  TriangleAlert,
} from 'lucide-react';
import { usePatient } from './usePatient';
import { useStore } from '@/store/useStore';
import { useLookups } from '@/hooks/useLookups';
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad';
import {
  AiBadge,
  DataTable,
  EmptyState,
  SectionCard,
  SeverityBadge,
  ScoreMeter,
  StatusBadge,
  Tabs,
  TableSkeleton,
  type Column,
} from '@/components/ui';
import { TrendLine } from '@/components/charts/Charts';
import { CATEGORY_LABEL, isOpen } from '@/utils/severity';
import { fmtDate, fmtDateTime, fmtTime, fromNow, overdueLabel } from '@/utils/format';
import type { Assessment, LabResult, Order, RiskFinding } from '@/types';
import { cn } from '@/utils/cn';
import { askTheChart, aiClinicalSummary } from '@/features/ai/aiEngine';

/* ---------------------------------- Overview --------------------------------- */
export function OverviewTab() {
  const { patient, db, openFindings, criticalCount } = usePatient();
  const lk = useLookups();
  const navigate = useNavigate();
  const loading = useSimulatedLoad(350, [patient?.id]);
  if (!patient) return null;

  const meds = db.medications.filter((m) => m.patientId === patient.id && m.status === 'active');
  const orders = db.orders.filter((o) => o.patientId === patient.id && o.status !== 'completed');
  const labs = db.labs.filter((l) => l.patientId === patient.id);
  const abnormalLabs = labs.filter((l) => l.status !== 'normal');
  const carePlan = db.carePlans.find((c) => c.patientId === patient.id);
  const summary = aiClinicalSummary(patient.id, db);

  if (loading)
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card h-40 animate-pulse" />
        ))}
      </div>
    );

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <SectionCard title="Active Diagnoses">
        <ul className="space-y-1.5 text-sm text-ink-700">
          {patient.diagnoses.map((d) => (
            <li key={d} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> {d}
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Allergies">
        {patient.allergies.length === 0 ? (
          <p className="text-sm text-ink-500">No known allergies documented.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {patient.allergies.map((a) => (
              <li key={a.substance} className="flex items-center justify-between">
                <span className="font-medium text-ink-800">{a.substance}</span>
                <SeverityBadge severity={a.severity} size="sm" withDot={false} />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Medications" action={<Link to="../medications" className="text-xs font-medium text-brand-700">View Medications →</Link>}>
        <p className="text-2xl font-semibold text-ink-900">{meds.length}</p>
        <p className="text-sm text-ink-500">Active medications</p>
        <p className="mt-1 text-xs text-amber-700">
          {meds.filter((m) => !m.reconciled).length} not yet reconciled
        </p>
      </SectionCard>

      <SectionCard title="Active Orders" action={<Link to="../orders" className="text-xs font-medium text-brand-700">View Orders →</Link>}>
        <p className="text-2xl font-semibold text-ink-900">{orders.length}</p>
        <p className="text-sm text-ink-500">
          {orders.filter((o) => o.status === 'active').length} awaiting acknowledgement
        </p>
      </SectionCard>

      <SectionCard title="Recent Labs" action={<Link to="../labs" className="text-xs font-medium text-brand-700">View Labs →</Link>}>
        <p className="text-2xl font-semibold text-ink-900">{abnormalLabs.length} Abnormal</p>
        <p className="text-sm text-ink-500">{labs.length} results on file</p>
      </SectionCard>

      <SectionCard title="Care Plan" action={<Link to="../care-plan" className="text-xs font-medium text-brand-700">Open →</Link>}>
        <p className="text-lg font-semibold text-ink-900">{carePlan ? 'Active' : 'None'}</p>
        <p className="text-sm text-ink-500">Last reviewed {carePlan?.lastReviewedAt ? fmtDate(carePlan.lastReviewedAt) : '—'}</p>
      </SectionCard>

      <SectionCard title="Documentation Findings" className="lg:col-span-2" action={<Link to="../risk" className="text-xs font-medium text-brand-700">Risk & Compliance →</Link>}>
        <div className="flex items-center gap-6">
          <div>
            <p className="text-2xl font-semibold text-ink-900">{openFindings.length} Open</p>
            <p className="text-sm text-red-600">{criticalCount} Critical</p>
          </div>
          <ul className="flex-1 space-y-1 text-sm">
            {openFindings.slice(0, 4).map((f) => (
              <li key={f.id}>
                <button onClick={() => navigate(`/risk/findings/${f.id}`)} className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left hover:bg-ink-50">
                  <span className="text-ink-700">{f.title}</span>
                  <SeverityBadge severity={f.severity} size="sm" withDot={false} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </SectionCard>

      <SectionCard
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" /> AI Clinical Record Summary
          </span>
        }
      >
        <div className="mb-2">
          <AiBadge label="AI-assisted summary — review required" />
        </div>
        <p className="text-sm leading-relaxed text-ink-700">{summary.text}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {summary.sources.map((s) => (
            <span key={s} className="rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700 ring-1 ring-inset ring-violet-200">
              {s}
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Link to="../ask" className="btn-secondary text-xs">View Sources</Link>
          <button className="btn-ghost text-xs">Regenerate Summary</button>
        </div>
      </SectionCard>
    </div>
  );
}

/* ---------------------------------- Timeline --------------------------------- */
export function TimelineTab() {
  const { patient, db } = usePatient();
  const lk = useLookups();
  const [filter, setFilter] = useState('all');
  const loading = useSimulatedLoad(350, [patient?.id]);
  if (!patient) return null;

  type Ev = { at: string; kind: string; title: string; detail: string; warn?: boolean };
  const events: Ev[] = [];
  db.notes.filter((n) => n.patientId === patient.id).forEach((n) => events.push({ at: n.createdAt, kind: 'notes', title: n.title, detail: `${n.type} · ${lk.user(n.authorId)?.name ?? ''}` }));
  db.assessments.filter((a) => a.patientId === patient.id).forEach((a) => events.push({ at: a.lastCompletedAt ?? a.dueAt, kind: 'assessments', title: a.type, detail: a.status === 'complete' ? `Completed by ${lk.user(a.completedById)?.name ?? ''}` : 'Incomplete', warn: a.status !== 'complete' }));
  db.administrations.filter((m) => m.patientId === patient.id && m.status === 'administered').forEach((m) => events.push({ at: m.administeredAt ?? m.scheduledTime, kind: 'medications', title: 'Medication Administered', detail: m.medicationName }));
  db.orders.filter((o) => o.patientId === patient.id).forEach((o) => events.push({ at: o.createdAt, kind: 'orders', title: 'Physician Order', detail: o.name }));
  db.labs.filter((l) => l.patientId === patient.id).forEach((l) => events.push({ at: l.resultTime, kind: 'labs', title: 'Lab Result', detail: `${l.test} ${l.value} ${l.units}${l.status !== 'normal' ? ' — abnormal' : ''}`, warn: l.status !== 'normal' }));
  db.findings.filter((f) => f.patientId === patient.id).forEach((f) => events.push({ at: f.detectedAt, kind: 'risks', title: 'Documentation Finding', detail: f.title, warn: true }));

  const filtered = (filter === 'all' ? events : events.filter((e) => e.kind === filter)).sort((a, b) => b.at.localeCompare(a.at));

  const groups = filtered.reduce<Record<string, Ev[]>>((acc, e) => {
    const day = fmtDate(e.at);
    (acc[day] ||= []).push(e);
    return acc;
  }, {});

  if (loading) return <TableSkeleton rows={8} />;

  return (
    <div className="space-y-4">
      <Tabs
        tabs={[
          { id: 'all', label: 'All' },
          { id: 'notes', label: 'Notes' },
          { id: 'assessments', label: 'Assessments' },
          { id: 'medications', label: 'Medications' },
          { id: 'orders', label: 'Orders' },
          { id: 'labs', label: 'Labs' },
          { id: 'risks', label: 'Risks' },
        ]}
        active={filter}
        onChange={setFilter}
      />
      {Object.entries(groups).map(([day, evs]) => (
        <div key={day}>
          <p className="mb-2 text-sm font-semibold text-ink-700">{day}</p>
          <ol className="relative ml-2 space-y-3 border-l border-ink-200 pl-5">
            {evs.map((e, i) => (
              <li key={i} className="relative">
                <span className={cn('absolute -left-[26px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white', e.warn ? 'bg-amber-500' : 'bg-brand-500')} />
                <p className="text-xs text-ink-400">{fmtTime(e.at)}</p>
                <p className="text-sm font-medium text-ink-800">{e.title}</p>
                <p className={cn('text-sm', e.warn ? 'text-amber-700' : 'text-ink-500')}>{e.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      ))}
      {filtered.length === 0 && <EmptyState title="No timeline events" description="Nothing recorded for this filter." />}
    </div>
  );
}

/* ----------------------------------- Notes ---------------------------------- */
export function NotesTab() {
  const { patient, db } = usePatient();
  const lk = useLookups();
  const navigate = useNavigate();
  const loading = useSimulatedLoad(350, [patient?.id]);
  if (!patient) return null;
  const notes = db.notes.filter((n) => n.patientId === patient.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary text-sm" onClick={() => navigate(`/patients/${patient.id}/notes/note-sw-draft`)}>
          <FileText className="h-4 w-4" /> New Note
        </button>
      </div>
      <DataTable
        loading={loading}
        columns={[
          { key: 'type', header: 'Note Type', cell: (n) => <span className="font-medium text-ink-800">{n.title}</span> },
          { key: 'author', header: 'Author', cell: (n) => lk.user(n.authorId)?.name },
          { key: 'created', header: 'Created', cell: (n) => fmtDateTime(n.createdAt) },
          { key: 'signed', header: 'Signed', cell: (n) => (n.signedAt ? fmtDateTime(n.signedAt) : '—') },
          {
            key: 'status',
            header: 'Status',
            cell: (n) => (
              <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium', n.status === 'signed' ? 'bg-green-50 text-green-700' : n.status === 'draft' ? 'bg-amber-50 text-amber-700' : 'bg-ink-100 text-ink-600')}>
                {n.status[0].toUpperCase() + n.status.slice(1)}
              </span>
            ),
          },
          { key: 'findings', header: 'Risk Findings', cell: (n) => (n.linkedFindingIds.length ? n.linkedFindingIds.length : '—') },
        ]}
        rows={notes}
        rowKey={(n) => n.id}
        onRowClick={(n) => navigate(`/patients/${patient.id}/notes/${n.id}`)}
        empty={{ title: 'No notes yet', description: 'Create the first clinical note for this patient.' }}
      />
    </div>
  );
}

/* -------------------------------- Assessments ------------------------------- */
export function AssessmentsTab() {
  const { patient, db } = usePatient();
  const lk = useLookups();
  const now = useStore((s) => s.now);
  const complete = useStore((s) => s.completeAssessment);
  const loading = useSimulatedLoad(350, [patient?.id]);
  const [openForm, setOpenForm] = useState<string | null>(null);
  if (!patient) return null;
  const rows = db.assessments.filter((a) => a.patientId === patient.id);

  const columns: Column<Assessment>[] = [
    { key: 'type', header: 'Assessment', cell: (a) => <span className="font-medium text-ink-800">{a.type}</span> },
    { key: 'last', header: 'Last Completed', cell: (a) => (a.lastCompletedAt ? fmtDateTime(a.lastCompletedAt) : '—') },
    { key: 'due', header: 'Due', cell: (a) => fmtDateTime(a.dueAt) },
    {
      key: 'status',
      header: 'Status',
      cell: (a) => (
        <span
          className={cn(
            'rounded-md px-2 py-0.5 text-xs font-medium',
            a.status === 'complete' ? 'bg-green-50 text-green-700' : a.status === 'overdue' ? 'bg-red-50 text-red-700' : a.status === 'due_soon' ? 'bg-amber-50 text-amber-700' : 'bg-ink-100 text-ink-600',
          )}
        >
          {a.status.replace('_', ' ')}
        </span>
      ),
    },
    { key: 'by', header: 'Completed By', cell: (a) => lk.user(a.completedById)?.name ?? '—' },
    { key: 'pct', header: 'Completion', cell: (a) => `${a.completionPercent}%` },
    {
      key: 'action',
      header: '',
      align: 'right',
      cell: (a) =>
        a.status !== 'complete' ? (
          <button className="btn-secondary px-2 py-1 text-xs" onClick={() => setOpenForm(openForm === a.id ? null : a.id)}>
            Open Form
          </button>
        ) : null,
    },
  ];

  const active = rows.find((a) => a.id === openForm);

  return (
    <div className="space-y-4">
      <DataTable columns={columns} rows={rows} rowKey={(a) => a.id} loading={loading} empty={{ title: 'No assessments', description: 'No assessments are configured for this patient.' }} />
      {active && (
        <SectionCard title={`${active.type} — ${active.completionPercent}% complete`}>
          <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-ink-100">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${active.completionPercent}%` }} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {['Previous falls', 'Mobility', 'Assistive device', 'Mental status', 'Medication risk', 'Balance/gait'].map((field) => (
              <label key={field} className="block">
                <span className="label">{field}</span>
                <input className="input" defaultValue={String(active.fields[field] ?? '')} placeholder="Enter finding…" />
              </label>
            ))}
            <label className="block">
              <span className="label">Calculated score</span>
              <input className="input bg-ink-50" readOnly value={active.score ?? 55} />
            </label>
            <label className="block">
              <span className="label">Risk category</span>
              <input className="input bg-ink-50" readOnly value={active.riskCategory ?? 'High'} />
            </label>
            <label className="block sm:col-span-2">
              <span className="label">Intervention plan</span>
              <textarea className="input min-h-[70px]" defaultValue={String(active.fields['Intervention plan'] ?? '')} />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="btn-secondary text-sm" onClick={() => setOpenForm(null)}>
              Cancel
            </button>
            <button
              className="btn-primary text-sm"
              onClick={() => {
                complete(active.id);
                setOpenForm(null);
              }}
            >
              <CheckCircle2 className="h-4 w-4" /> Complete & Sign Assessment
            </button>
          </div>
          <p className="mt-2 text-xs text-ink-400">
            Signing re-evaluates rule {active.type.includes('Fall') ? 'ASM-FALL-002' : 'ASM-ADM-008'} and moves any related finding to Awaiting Verification.
          </p>
        </SectionCard>
      )}
      {!active && <p className="text-xs text-ink-400">Now: {fmtDateTime(now)}</p>}
    </div>
  );
}

/* --------------------------------- Care Plan -------------------------------- */
export function CarePlanTab() {
  const { patient, db } = usePatient();
  const lk = useLookups();
  const now = useStore((s) => s.now);
  const signCarePlan = useStore((s) => s.signCarePlan);
  const loading = useSimulatedLoad(300, [patient?.id]);
  if (!patient) return null;
  const cp = db.carePlans.find((c) => c.patientId === patient.id);
  if (loading) return <TableSkeleton rows={4} />;
  if (!cp) return <EmptyState title="No active care plan" description="No care plan has been created for this patient." />;

  const missing = cp.signatures.filter((s) => s.required && !s.signedAt);

  return (
    <div className="space-y-4">
      <SectionCard
        title={
          <span className="flex items-center gap-2">
            {cp.name}
            <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">{cp.status}</span>
          </span>
        }
        action={<span className="text-xs text-ink-400">Next review {fmtDate(cp.nextReviewAt)}</span>}
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Problem</dt>
            <dd className="mt-1 text-sm text-ink-700">{cp.problem}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Goal</dt>
            <dd className="mt-1 text-sm text-ink-700">{cp.goal}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Interventions</dt>
            <dd className="mt-1">
              <ul className="space-y-1 text-sm text-ink-700">
                {cp.interventions.map((i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> {i}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Responsible Discipline</dt>
            <dd className="mt-1 text-sm text-ink-700">{cp.responsibleDiscipline}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Target Date</dt>
            <dd className="mt-1 text-sm text-ink-700">{fmtDate(cp.targetDate)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Latest Patient Response</dt>
            <dd className="mt-1 text-sm text-ink-700">{cp.latestPatientResponse}</dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard title="Signatures">
        {missing.length > 0 && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <TriangleAlert className="h-4 w-4" />
            Missing required signature: {missing.map((m) => m.role).join(', ')}
          </div>
        )}
        <ul className="space-y-2 text-sm">
          {cp.signatures.map((s) => (
            <li key={s.role} className="flex items-center justify-between">
              <span className="text-ink-700">
                {s.role} {s.required && <span className="text-red-500">*</span>}
              </span>
              {s.signedAt ? (
                <span className="text-green-700">Signed {fmtDateTime(s.signedAt)} · {lk.user(s.userId)?.name}</span>
              ) : (
                <button className="btn-primary px-2.5 py-1 text-xs" onClick={() => signCarePlan(cp.id)}>
                  Sign as {s.role}
                </button>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-ink-400">Now: {fmtDateTime(now)}</p>
      </SectionCard>
    </div>
  );
}

/* -------------------------------- Medications ------------------------------- */
export function MedicationsTab() {
  const { patient, db } = usePatient();
  const lk = useLookups();
  const navigate = useNavigate();
  const now = useStore((s) => s.now);
  const loading = useSimulatedLoad(300, [patient?.id]);
  if (!patient) return null;
  const meds = db.medications.filter((m) => m.patientId === patient.id);
  const recon = db.reconciliations.find((r) => r.patientId === patient.id);

  return (
    <div className="space-y-4">
      {recon && recon.status !== 'complete' && (
        <div className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-red-800">Medication Reconciliation — {recon.status.replace('_', ' ').toUpperCase()}</p>
            <p className="text-sm text-red-700">{overdueLabel(recon.dueAt, now).label}</p>
          </div>
          <button className="btn-danger text-sm" onClick={() => navigate(`/patients/${patient.id}/medications/reconciliation`)}>
            Complete Reconciliation
          </button>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button className="btn-secondary text-sm">Add Medication</button>
        <button className="btn-secondary text-sm" onClick={() => navigate(`/patients/${patient.id}/medications/reconciliation`)}>
          Reconcile
        </button>
      </div>
      <DataTable
        loading={loading}
        columns={[
          { key: 'name', header: 'Medication', cell: (m) => (
            <span className="font-medium text-ink-800">
              {m.name} {m.high_alert && <span className="ml-1 rounded bg-red-100 px-1 text-[10px] font-bold text-red-700">HIGH ALERT</span>}
            </span>
          ) },
          { key: 'dose', header: 'Dose', cell: (m) => m.dose },
          { key: 'route', header: 'Route', cell: (m) => m.route },
          { key: 'freq', header: 'Frequency', cell: (m) => m.frequency },
          { key: 'start', header: 'Start', cell: (m) => fmtDate(m.startDate) },
          { key: 'prescriber', header: 'Prescriber', cell: (m) => lk.user(m.prescriberId)?.name },
          { key: 'status', header: 'Status', cell: (m) => m.status },
          {
            key: 'reconciled',
            header: 'Reconciled',
            cell: (m) =>
              m.reconciled ? <span className="text-green-700">Yes</span> : <span className="font-medium text-amber-700">No</span>,
          },
        ]}
        rows={meds}
        rowKey={(m) => m.id}
        empty={{ title: 'No medications', description: 'No medications on file for this patient.' }}
      />
    </div>
  );
}

/* ------------------------------------ MAR ---------------------------------- */
export function MarTab() {
  const { patient, db } = usePatient();
  const loading = useSimulatedLoad(300, [patient?.id]);
  if (!patient) return null;
  const admins = db.administrations.filter((a) => a.patientId === patient.id);
  const times = [...new Set(admins.map((a) => fmtTime(a.scheduledTime)))];
  const byMed = admins.reduce<Record<string, typeof admins>>((acc, a) => {
    (acc[a.medicationName] ||= []).push(a);
    return acc;
  }, {});
  if (loading) return <TableSkeleton rows={6} cols={7} />;

  const STATUS_STYLE: Record<string, string> = {
    administered: 'bg-green-100 text-green-700',
    due: 'bg-amber-100 text-amber-700',
    held: 'bg-blue-100 text-blue-700',
    refused: 'bg-orange-100 text-orange-700',
    missed: 'bg-red-100 text-red-700',
  };

  return (
    <SectionCard title="Medication Administration Record" bodyClassName="overflow-x-auto p-0">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-ink-50/60">
          <tr>
            <th className="th">Medication</th>
            {times.map((t) => (
              <th key={t} className="th text-center">
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {Object.entries(byMed).map(([med, list]) => (
            <tr key={med}>
              <td className="td font-medium text-ink-800">{med}</td>
              {times.map((t) => {
                const cell = list.find((a) => fmtTime(a.scheduledTime) === t);
                return (
                  <td key={t} className="td text-center">
                    {cell ? (
                      <span className={cn('inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold', STATUS_STYLE[cell.status])}>
                        {cell.status}
                      </span>
                    ) : (
                      <span className="text-ink-300">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </SectionCard>
  );
}

/* ----------------------------------- Orders -------------------------------- */
export function OrdersTab() {
  const { patient, db } = usePatient();
  const lk = useLookups();
  const now = useStore((s) => s.now);
  const acknowledgeOrder = useStore((s) => s.acknowledgeOrder);
  const loading = useSimulatedLoad(300, [patient?.id]);
  if (!patient) return null;
  const rows = db.orders.filter((o) => o.patientId === patient.id);

  const columns: Column<Order>[] = [
    { key: 'name', header: 'Order', cell: (o) => <span className="font-medium text-ink-800">{o.name}</span> },
    { key: 'type', header: 'Type', cell: (o) => o.type },
    { key: 'provider', header: 'Ordering Provider', cell: (o) => lk.user(o.orderingProviderId)?.name },
    { key: 'created', header: 'Created', cell: (o) => fmtDateTime(o.createdAt) },
    { key: 'priority', header: 'Priority', cell: (o) => <span className={cn('text-xs font-medium', o.priority === 'stat' ? 'text-red-600' : o.priority === 'urgent' ? 'text-orange-600' : 'text-ink-500')}>{o.priority.toUpperCase()}</span> },
    { key: 'status', header: 'Status', cell: (o) => o.status },
    {
      key: 'ack',
      header: 'Acknowledgement',
      cell: (o) =>
        o.acknowledgedAt ? (
          <span className="text-green-700">{fmtTime(o.acknowledgedAt)} · {lk.user(o.acknowledgedById)?.name}</span>
        ) : o.status === 'active' ? (
          <span className="font-medium text-red-600">
            Awaiting — {overdueLabel(o.createdAt, now).label.replace('Overdue', 'for').replace('Due in', 'in')}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      cell: (o) =>
        o.status === 'active' && !o.acknowledgedAt ? (
          <button className="btn-secondary px-2 py-1 text-xs" onClick={() => acknowledgeOrder(o.id)}>
            Acknowledge
          </button>
        ) : null,
    },
  ];

  return <DataTable columns={columns} rows={rows} rowKey={(o) => o.id} loading={loading} empty={{ title: 'No orders', description: 'No orders on file for this patient.' }} />;
}

/* ------------------------------------ Labs --------------------------------- */
export function LabsTab() {
  const { patient, db } = usePatient();
  const lk = useLookups();
  const reviewLab = useStore((s) => s.reviewLab);
  const [drawer, setDrawer] = useState<string | null>(null);
  const loading = useSimulatedLoad(300, [patient?.id]);
  if (!patient) return null;
  const rows = db.labs.filter((l) => l.patientId === patient.id).sort((a, b) => b.resultTime.localeCompare(a.resultTime));
  const active = rows.find((l) => l.id === drawer);

  const badge = (l: LabResult) =>
    l.status === 'normal' ? (
      <span className="rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Normal</span>
    ) : (
      <span className={cn('rounded-md px-2 py-0.5 text-xs font-semibold', l.status.includes('critical') ? 'bg-red-50 text-red-700' : l.status === 'high' ? 'bg-orange-50 text-orange-700' : 'bg-amber-50 text-amber-700')}>
        {l.status.replace('critical_', 'Critical ').replace('high', 'High').replace('low', 'Low')}
      </span>
    );

  return (
    <div className="space-y-4">
      <DataTable
        loading={loading}
        columns={[
          { key: 'test', header: 'Test', cell: (l) => <span className="font-medium text-ink-800">{l.test}</span> },
          { key: 'result', header: 'Result', cell: (l) => `${l.value} ${l.units}` },
          { key: 'range', header: 'Reference Range', cell: (l) => `${l.referenceLow} – ${l.referenceHigh}` },
          { key: 'status', header: 'Status', cell: badge },
          { key: 'time', header: 'Result Time', cell: (l) => fmtDateTime(l.resultTime) },
          { key: 'reviewed', header: 'Reviewed', cell: (l) => (l.reviewed ? <span className="text-green-700">Yes</span> : <span className="font-medium text-amber-700">No</span>) },
          { key: 'by', header: 'Reviewed By', cell: (l) => lk.user(l.reviewedById)?.name ?? '—' },
        ]}
        rows={rows}
        rowKey={(l) => l.id}
        onRowClick={(l) => setDrawer(l.id)}
        empty={{ title: 'No lab results', description: 'No results on file for this patient.' }}
      />

      {active && (
        <SectionCard title={`${active.test} — trend`} action={<button className="btn-ghost text-xs" onClick={() => setDrawer(null)}>Close</button>}>
          <TrendLine data={active.trend.map((t) => ({ label: fmtDate(t.time), value: t.value }))} color="#f97316" />
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-ink-500">
              Review status: {active.reviewed ? `Reviewed by ${lk.user(active.reviewedById)?.name}` : 'Not reviewed'}
            </span>
            {!active.reviewed && (
              <button className="btn-primary text-sm" onClick={() => reviewLab(active.id)}>
                Document Lab Review
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-ink-400">
            Associated risks: {db.findings.filter((f) => f.patientId === patient.id && f.category === 'labs' && isOpen(f.status)).map((f) => f.title).join(', ') || 'None'}
          </p>
        </SectionCard>
      )}
    </div>
  );
}

/* ----------------------------------- Vitals -------------------------------- */
export function VitalsTab() {
  const { patient, db } = usePatient();
  const [selected, setSelected] = useState('Blood Pressure');
  const loading = useSimulatedLoad(300, [patient?.id]);
  if (!patient) return null;
  const vitals = db.vitals.filter((v) => v.patientId === patient.id);
  const active = vitals.find((v) => v.type === selected) ?? vitals[0];
  if (loading) return <TableSkeleton rows={4} />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {vitals.map((v) => (
          <button
            key={v.id}
            onClick={() => setSelected(v.type)}
            className={cn('card p-3 text-left', selected === v.type && 'ring-2 ring-brand-500')}
          >
            <p className="text-[11px] uppercase tracking-wide text-ink-400">{v.type}</p>
            <p className="mt-1 text-lg font-semibold text-ink-900">
              {v.value}
              <span className="ml-1 text-xs font-normal text-ink-400">{v.unit}</span>
            </p>
          </button>
        ))}
      </div>
      {active && (
        <SectionCard title={`${active.type} — trend`}>
          <TrendLine data={active.series.map((s) => ({ label: fmtTime(s.time), value: s.value }))} />
        </SectionCard>
      )}
    </div>
  );
}

/* --------------------------------- Documents ------------------------------- */
export function DocumentsTab() {
  const { patient, db } = usePatient();
  const lk = useLookups();
  if (!patient) return null;
  const docs = [
    ...db.notes.filter((n) => n.patientId === patient.id).map((n) => ({ id: n.id, name: n.title, type: 'Note', at: n.createdAt, by: lk.user(n.authorId)?.name })),
    ...db.assessments.filter((a) => a.patientId === patient.id).map((a) => ({ id: a.id, name: a.type, type: 'Assessment', at: a.lastCompletedAt ?? a.dueAt, by: lk.user(a.completedById)?.name })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <DataTable
      columns={[
        { key: 'name', header: 'Document', cell: (d) => <span className="font-medium text-ink-800">{d.name}</span> },
        { key: 'type', header: 'Type', cell: (d) => d.type },
        { key: 'at', header: 'Date', cell: (d) => fmtDateTime(d.at) },
        { key: 'by', header: 'Author', cell: (d) => d.by ?? '—' },
      ]}
      rows={docs}
      rowKey={(d) => d.id}
      empty={{ title: 'No documents', description: 'No documents attached to this record.' }}
    />
  );
}

/* ----------------------------- Risk & Compliance --------------------------- */
export function RiskComplianceTab() {
  const { patient, findings, openFindings, criticalCount } = usePatient();
  const lk = useLookups();
  const now = useStore((s) => s.now);
  const navigate = useNavigate();
  if (!patient) return null;

  const columns: Column<RiskFinding>[] = [
    { key: 'title', header: 'Finding', cell: (f) => <span className="font-medium text-ink-800">{f.title}</span> },
    { key: 'severity', header: 'Severity', cell: (f) => <SeverityBadge severity={f.severity} size="sm" /> },
    { key: 'category', header: 'Category', cell: (f) => CATEGORY_LABEL[f.category] },
    { key: 'detected', header: 'Detected', cell: (f) => fromNow(f.detectedAt) },
    { key: 'due', header: 'Due', cell: (f) => overdueLabel(f.dueAt, now).label },
    { key: 'assigned', header: 'Assigned To', cell: (f) => lk.userName(f.assignedUserId) },
    { key: 'status', header: 'Status', cell: (f) => <StatusBadge status={f.status} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SectionCard title="Documentation Risk Score">
          <ScoreMeter score={patient.documentationRiskScore} size="lg" />
        </SectionCard>
        <SectionCard title="Compliance">
          <p className="text-2xl font-semibold text-ink-900">{patient.documentationCompliance}%</p>
        </SectionCard>
        <SectionCard title="Open Findings">
          <p className="text-2xl font-semibold text-ink-900">{openFindings.length}</p>
        </SectionCard>
        <SectionCard title="Critical">
          <p className={cn('text-2xl font-semibold', criticalCount > 0 ? 'text-red-600' : 'text-ink-900')}>{criticalCount}</p>
        </SectionCard>
      </div>

      <SectionCard title="Risk Score Explanation">
        <ul className="space-y-1 text-sm">
          <li className="flex justify-between"><span className="text-ink-500">Base severity</span><span className="font-medium">+50</span></li>
          <li className="flex justify-between"><span className="text-ink-500">Overdue duration</span><span className="font-medium">+10</span></li>
          <li className="flex justify-between"><span className="text-ink-500">Patient safety relevance</span><span className="font-medium">+8</span></li>
          <li className="flex justify-between"><span className="text-ink-500">Repeat deficiency</span><span className="font-medium">+6</span></li>
          <li className="flex justify-between border-t border-ink-200 pt-1 font-semibold"><span>Total</span><span>{patient.documentationRiskScore}</span></li>
        </ul>
      </SectionCard>

      <DataTable columns={columns} rows={findings} rowKey={(f) => f.id} onRowClick={(f) => navigate(`/risk/findings/${f.id}`)} empty={{ title: 'No findings', description: 'This chart has no documentation findings.' }} />
    </div>
  );
}

/* ------------------------------- Audit History ---------------------------- */
export function AuditHistoryTab() {
  const { patient, db } = usePatient();
  if (!patient) return null;
  const rows = db.auditEvents.filter((e) => e.patientId === patient.id).sort((a, b) => b.at.localeCompare(a.at));

  return (
    <DataTable
      columns={[
        { key: 'at', header: 'Timestamp', cell: (e) => fmtDateTime(e.at) },
        { key: 'user', header: 'User', cell: (e) => e.userName },
        { key: 'role', header: 'Role', cell: (e) => e.role },
        { key: 'action', header: 'Action', cell: (e) => e.action },
        { key: 'module', header: 'Module', cell: (e) => e.module },
        { key: 'details', header: 'Details', cell: (e) => <span className="text-ink-500">{e.details}</span> },
      ]}
      rows={rows}
      rowKey={(e) => e.id}
      empty={{ title: 'No audit activity', description: 'No recorded activity for this patient yet.' }}
    />
  );
}

/* ------------------------------ Ask the Chart ---------------------------- */
export function AskTheChartTab() {
  const { patient, db } = usePatient();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string; sources?: { label: string; to: string }[] }[]>([]);
  const [input, setInput] = useState('');
  if (!patient) return null;

  const suggested = [
    'Why is this patient high documentation risk?',
    'What documentation is overdue?',
    'Summarize unresolved nursing documentation.',
    'What changed since yesterday?',
    'Were abnormal results acknowledged?',
    'Show care-plan changes from this week.',
  ];

  const ask = (q: string) => {
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setTimeout(() => {
      const res = askTheChart(q, patient.id, db);
      setMessages((m) => [...m, { role: 'ai', text: res.answer, sources: res.sources }]);
    }, 500);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <SectionCard title={<span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-500" /> Ask the Chart</span>} className="lg:col-span-2" bodyClassName="flex flex-col gap-3">
        <div className="min-h-[280px] flex-1 space-y-3">
          {messages.length === 0 && (
            <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3 text-sm text-ink-600">
              Ask a grounded question about {patient.firstName} {patient.lastName}'s record. Every answer cites the
              source documentation it is based on. This assistant summarizes and locates existing documentation — it
              does not make clinical decisions.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cn('rounded-lg p-3 text-sm', m.role === 'user' ? 'ml-8 bg-brand-50 text-ink-800' : 'mr-8 border border-ink-200 bg-white text-ink-700')}>
              {m.role === 'ai' && <div className="mb-1.5"><AiBadge label="AI-assisted answer — grounded in records" /></div>}
              <p className="leading-relaxed">{m.text}</p>
              {m.sources && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.sources.map((s) => (
                    <button key={s.label} onClick={() => navigate(s.to)} className="rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700 ring-1 ring-inset ring-violet-200 hover:bg-violet-100">
                      {s.label} · Open Source
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) ask(input.trim());
          }}
          className="flex gap-2"
        >
          <input className="input" placeholder="Ask about this chart…" value={input} onChange={(e) => setInput(e.target.value)} />
          <button className="btn-primary" type="submit">
            Ask
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Suggested questions">
        <ul className="space-y-2">
          {suggested.map((q) => (
            <li key={q}>
              <button onClick={() => ask(q)} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-left text-sm text-ink-700 hover:border-brand-300 hover:bg-brand-50/40">
                {q}
              </button>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
