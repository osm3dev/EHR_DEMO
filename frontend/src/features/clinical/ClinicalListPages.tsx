import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { useLookups } from '@/hooks/useLookups';
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad';
import { DataTable, FilterBar, PageHeader, SeverityBadge } from '@/components/ui';
import { fmtDate, fmtDateTime, fmtTime, overdueLabel } from '@/utils/format';
import { cn } from '@/utils/cn';

function useScoped<T extends { patientId: string }>(rows: T[]) {
  const db = useStore((s) => s.db);
  const facilityFilter = useStore((s) => s.facilityFilter);
  return useMemo(() => {
    if (facilityFilter === 'all') return rows;
    const ids = new Set(db.patients.filter((p) => p.facilityId === facilityFilter).map((p) => p.id));
    return rows.filter((r) => ids.has(r.patientId));
  }, [rows, facilityFilter, db.patients]);
}

/* --------------------------------- Notes --------------------------------- */
export function NotesListPage() {
  const navigate = useNavigate();
  const lk = useLookups();
  const loading = useSimulatedLoad();
  const notes = useScoped(useStore((s) => s.db.notes));
  const [status, setStatus] = useState('all');
  const rows = notes.filter((n) => status === 'all' || n.status === status).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-4">
      <PageHeader title="Notes" subtitle="All clinical notes in scope" crumbs={[{ label: 'Clinical' }, { label: 'Notes' }]} />
      <FilterBar
        filters={[{ key: 'status', label: 'Status', options: [{ value: 'draft', label: 'Draft' }, { value: 'complete', label: 'Complete' }, { value: 'signed', label: 'Signed' }] }]}
        value={{ status }}
        onChange={(_, v) => setStatus(v)}
        onReset={() => setStatus('all')}
      />
      <DataTable
        loading={loading}
        columns={[
          { key: 'patient', header: 'Patient', cell: (n) => <span className="font-medium text-ink-800">{lk.patientName(n.patientId)}</span> },
          { key: 'type', header: 'Note Type', cell: (n) => n.title },
          { key: 'author', header: 'Author', cell: (n) => lk.user(n.authorId)?.name },
          { key: 'created', header: 'Created', cell: (n) => fmtDateTime(n.createdAt) },
          { key: 'signed', header: 'Signed', cell: (n) => (n.signedAt ? fmtDateTime(n.signedAt) : '—') },
          { key: 'status', header: 'Status', cell: (n) => <span className="capitalize">{n.status}</span> },
        ]}
        rows={rows}
        rowKey={(n) => n.id}
        onRowClick={(n) => navigate(`/patients/${n.patientId}/notes/${n.id}`)}
        empty={{ title: 'No notes', description: 'No notes match the current filters.' }}
      />
    </div>
  );
}

/* ------------------------------ Assessments ------------------------------ */
export function AssessmentsListPage() {
  const lk = useLookups();
  const navigate = useNavigate();
  const loading = useSimulatedLoad();
  const rows = useScoped(useStore((s) => s.db.assessments));

  return (
    <div className="space-y-4">
      <PageHeader title="Assessments" subtitle="Assessment completion across all patients" crumbs={[{ label: 'Clinical' }, { label: 'Assessments' }]} />
      <DataTable
        loading={loading}
        columns={[
          { key: 'patient', header: 'Patient', cell: (a) => <span className="font-medium text-ink-800">{lk.patientName(a.patientId)}</span> },
          { key: 'type', header: 'Assessment', cell: (a) => a.type },
          { key: 'due', header: 'Due', cell: (a) => fmtDateTime(a.dueAt) },
          {
            key: 'status',
            header: 'Status',
            cell: (a) => (
              <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium', a.status === 'complete' ? 'bg-green-50 text-green-700' : a.status === 'overdue' ? 'bg-red-50 text-red-700' : a.status === 'due_soon' ? 'bg-amber-50 text-amber-700' : 'bg-ink-100 text-ink-600')}>
                {a.status.replace('_', ' ')}
              </span>
            ),
          },
          { key: 'by', header: 'Completed By', cell: (a) => lk.user(a.completedById)?.name ?? '—' },
          { key: 'pct', header: 'Completion', cell: (a) => `${a.completionPercent}%` },
        ]}
        rows={rows}
        rowKey={(a) => a.id}
        onRowClick={(a) => navigate(`/patients/${a.patientId}/assessments`)}
        empty={{ title: 'No assessments', description: 'Nothing to show.' }}
      />
    </div>
  );
}

/* ------------------------------- Care Plans ----------------------------- */
export function CarePlansListPage() {
  const lk = useLookups();
  const navigate = useNavigate();
  const rows = useScoped(useStore((s) => s.db.carePlans));
  return (
    <div className="space-y-4">
      <PageHeader title="Care Plans" crumbs={[{ label: 'Clinical' }, { label: 'Care Plans' }]} />
      <DataTable
        columns={[
          { key: 'patient', header: 'Patient', cell: (c) => <span className="font-medium text-ink-800">{lk.patientName(c.patientId)}</span> },
          { key: 'name', header: 'Care Plan', cell: (c) => c.name },
          { key: 'status', header: 'Status', cell: (c) => <span className="capitalize">{c.status}</span> },
          { key: 'review', header: 'Next Review', cell: (c) => fmtDate(c.nextReviewAt) },
          {
            key: 'sig',
            header: 'Signatures',
            cell: (c) => {
              const missing = c.signatures.filter((s) => s.required && !s.signedAt).length;
              return missing ? <span className="font-medium text-amber-700">{missing} missing</span> : <span className="text-green-700">Complete</span>;
            },
          },
        ]}
        rows={rows}
        rowKey={(c) => c.id}
        onRowClick={(c) => navigate(`/patients/${c.patientId}/care-plan`)}
        empty={{ title: 'No care plans', description: 'Nothing to show.' }}
      />
    </div>
  );
}

/* ------------------------------ Medications ----------------------------- */
export function MedicationsListPage() {
  const lk = useLookups();
  const navigate = useNavigate();
  const rows = useScoped(useStore((s) => s.db.medications));
  const [reconciled, setReconciled] = useState('all');
  const filtered = rows.filter((m) => reconciled === 'all' || (reconciled === 'no' ? !m.reconciled : m.reconciled));
  return (
    <div className="space-y-4">
      <PageHeader title="Medications" crumbs={[{ label: 'Clinical' }, { label: 'Medications' }]} />
      <FilterBar
        filters={[{ key: 'reconciled', label: 'Reconciled', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] }]}
        value={{ reconciled }}
        onChange={(_, v) => setReconciled(v)}
        onReset={() => setReconciled('all')}
      />
      <DataTable
        columns={[
          { key: 'patient', header: 'Patient', cell: (m) => <span className="font-medium text-ink-800">{lk.patientName(m.patientId)}</span> },
          { key: 'name', header: 'Medication', cell: (m) => m.name },
          { key: 'dose', header: 'Dose', cell: (m) => `${m.dose} ${m.route} ${m.frequency}` },
          { key: 'prescriber', header: 'Prescriber', cell: (m) => lk.user(m.prescriberId)?.name },
          { key: 'reconciled', header: 'Reconciled', cell: (m) => (m.reconciled ? <span className="text-green-700">Yes</span> : <span className="font-medium text-amber-700">No</span>) },
        ]}
        rows={filtered}
        rowKey={(m) => m.id}
        onRowClick={(m) => navigate(`/patients/${m.patientId}/medications`)}
        empty={{ title: 'No medications', description: 'Nothing to show.' }}
      />
    </div>
  );
}

/* ---------------------------------- MAR -------------------------------- */
export function MarListPage() {
  const lk = useLookups();
  const rows = useScoped(useStore((s) => s.db.administrations)).sort((a, b) => b.scheduledTime.localeCompare(a.scheduledTime));
  return (
    <div className="space-y-4">
      <PageHeader title="MAR" subtitle="Medication administration records in scope" crumbs={[{ label: 'Clinical' }, { label: 'MAR' }]} />
      <DataTable
        columns={[
          { key: 'patient', header: 'Patient', cell: (a) => <span className="font-medium text-ink-800">{lk.patientName(a.patientId)}</span> },
          { key: 'med', header: 'Medication', cell: (a) => a.medicationName },
          { key: 'time', header: 'Scheduled', cell: (a) => `${fmtDate(a.scheduledTime)} ${fmtTime(a.scheduledTime)}` },
          {
            key: 'status',
            header: 'Status',
            cell: (a) => (
              <span className={cn('rounded-md px-2 py-0.5 text-xs font-semibold capitalize', a.status === 'administered' ? 'bg-green-100 text-green-700' : a.status === 'missed' ? 'bg-red-100 text-red-700' : a.status === 'due' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700')}>
                {a.status}
              </span>
            ),
          },
          { key: 'by', header: 'Administered By', cell: (a) => lk.user(a.administeredById)?.name ?? '—' },
        ]}
        rows={rows}
        rowKey={(a) => a.id}
        empty={{ title: 'No administrations', description: 'Nothing to show.' }}
      />
    </div>
  );
}

/* --------------------------------- Orders ------------------------------ */
export function OrdersListPage() {
  const lk = useLookups();
  const navigate = useNavigate();
  const now = useStore((s) => s.now);
  const rows = useScoped(useStore((s) => s.db.orders)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div className="space-y-4">
      <PageHeader title="Orders" crumbs={[{ label: 'Clinical' }, { label: 'Orders' }]} />
      <DataTable
        columns={[
          { key: 'patient', header: 'Patient', cell: (o) => <span className="font-medium text-ink-800">{lk.patientName(o.patientId)}</span> },
          { key: 'name', header: 'Order', cell: (o) => o.name },
          { key: 'type', header: 'Type', cell: (o) => o.type },
          { key: 'provider', header: 'Ordering Provider', cell: (o) => lk.user(o.orderingProviderId)?.name },
          { key: 'created', header: 'Created', cell: (o) => fmtDateTime(o.createdAt) },
          { key: 'status', header: 'Status', cell: (o) => <span className="capitalize">{o.status}</span> },
          {
            key: 'ack',
            header: 'Acknowledgement',
            cell: (o) =>
              o.acknowledgedAt ? (
                <span className="text-green-700">Acknowledged</span>
              ) : o.status === 'active' ? (
                <span className="font-medium text-red-600">Awaiting — {overdueLabel(o.createdAt, now).label.replace('Overdue ', 'for ')}</span>
              ) : (
                '—'
              ),
          },
        ]}
        rows={rows}
        rowKey={(o) => o.id}
        onRowClick={(o) => navigate(`/patients/${o.patientId}/orders`)}
        empty={{ title: 'No orders', description: 'Nothing to show.' }}
      />
    </div>
  );
}

/* ---------------------------------- Labs ------------------------------- */
export function LabsListPage() {
  const lk = useLookups();
  const navigate = useNavigate();
  const rows = useScoped(useStore((s) => s.db.labs)).sort((a, b) => b.resultTime.localeCompare(a.resultTime));
  const [abn, setAbn] = useState('all');
  const filtered = rows.filter((l) => abn === 'all' || (abn === 'abnormal' ? l.status !== 'normal' : l.status === 'normal'));
  return (
    <div className="space-y-4">
      <PageHeader title="Labs" crumbs={[{ label: 'Clinical' }, { label: 'Labs' }]} />
      <FilterBar filters={[{ key: 'abn', label: 'Result', options: [{ value: 'abnormal', label: 'Abnormal only' }, { value: 'normal', label: 'Normal only' }] }]} value={{ abn }} onChange={(_, v) => setAbn(v)} onReset={() => setAbn('all')} />
      <DataTable
        columns={[
          { key: 'patient', header: 'Patient', cell: (l) => <span className="font-medium text-ink-800">{lk.patientName(l.patientId)}</span> },
          { key: 'test', header: 'Test', cell: (l) => l.test },
          { key: 'result', header: 'Result', cell: (l) => `${l.value} ${l.units}` },
          { key: 'range', header: 'Reference', cell: (l) => `${l.referenceLow} – ${l.referenceHigh}` },
          {
            key: 'status',
            header: 'Status',
            cell: (l) =>
              l.status === 'normal' ? (
                <span className="text-green-700">Normal</span>
              ) : (
                <span className={cn('font-semibold', l.status.includes('critical') ? 'text-red-700' : 'text-orange-700')}>{l.status.replace('_', ' ')}</span>
              ),
          },
          { key: 'reviewed', header: 'Reviewed', cell: (l) => (l.reviewed ? <span className="text-green-700">Yes</span> : <span className="font-medium text-amber-700">No</span>) },
        ]}
        rows={filtered}
        rowKey={(l) => l.id}
        onRowClick={(l) => navigate(`/patients/${l.patientId}/labs`)}
        empty={{ title: 'No labs', description: 'Nothing to show.' }}
      />
    </div>
  );
}

/* --------------------------------- Vitals ----------------------------- */
export function VitalsListPage() {
  const lk = useLookups();
  const navigate = useNavigate();
  const rows = useScoped(useStore((s) => s.db.vitals));
  return (
    <div className="space-y-4">
      <PageHeader title="Vitals" crumbs={[{ label: 'Clinical' }, { label: 'Vitals' }]} />
      <DataTable
        columns={[
          { key: 'patient', header: 'Patient', cell: (v) => <span className="font-medium text-ink-800">{lk.patientName(v.patientId)}</span> },
          { key: 'type', header: 'Vital', cell: (v) => v.type },
          { key: 'value', header: 'Latest', cell: (v) => `${v.value} ${v.unit}` },
          { key: 'at', header: 'Recorded', cell: (v) => fmtDateTime(v.recordedAt) },
          { key: 'by', header: 'By', cell: (v) => lk.user(v.recordedById)?.name },
        ]}
        rows={rows}
        rowKey={(v) => v.id}
        onRowClick={(v) => navigate(`/patients/${v.patientId}/vitals`)}
        empty={{ title: 'No vitals', description: 'Nothing to show.' }}
      />
    </div>
  );
}

/* -------------------------------- Documents --------------------------- */
export function DocumentsListPage() {
  const lk = useLookups();
  const navigate = useNavigate();
  const notes = useScoped(useStore((s) => s.db.notes));
  return (
    <div className="space-y-4">
      <PageHeader title="Documents" crumbs={[{ label: 'Clinical' }, { label: 'Documents' }]} />
      <DataTable
        columns={[
          { key: 'patient', header: 'Patient', cell: (n) => <span className="font-medium text-ink-800">{lk.patientName(n.patientId)}</span> },
          { key: 'name', header: 'Document', cell: (n) => n.title },
          { key: 'type', header: 'Type', cell: (n) => n.type },
          { key: 'created', header: 'Created', cell: (n) => fmtDateTime(n.createdAt) },
          { key: 'status', header: 'Status', cell: (n) => <span className="capitalize">{n.status}</span> },
        ]}
        rows={notes}
        rowKey={(n) => n.id}
        onRowClick={(n) => navigate(`/patients/${n.patientId}/documents`)}
        empty={{ title: 'No documents', description: 'Nothing to show.' }}
      />
    </div>
  );
}
