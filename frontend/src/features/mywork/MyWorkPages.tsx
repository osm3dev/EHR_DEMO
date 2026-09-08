import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { useLookups } from '@/hooks/useLookups';
import { DataTable, EmptyState, PageHeader, ScoreMeter, SeverityBadge, StatusBadge, Tabs } from '@/components/ui';
import { isOpen } from '@/utils/severity';
import { fmtDateTime, overdueLabel } from '@/utils/format';
import { cn } from '@/utils/cn';

export function MyPatientsPage() {
  const navigate = useNavigate();
  const db = useStore((s) => s.db);
  const user = useStore((s) => s.currentUser)!;
  const lk = useLookups();
  const mine = db.patients.filter((p) => p.primaryNurseId === user.id || p.attendingId === user.id);
  const rows = mine.length ? mine : db.patients.filter((p) => p.facilityId === user.facilityId).slice(0, 12);

  return (
    <div className="space-y-4">
      <PageHeader title="My Patients" subtitle={`${rows.length} patients on your panel`} crumbs={[{ label: 'My Work' }, { label: 'My Patients' }]} />
      <DataTable
        columns={[
          { key: 'p', header: 'Patient', cell: (p) => <span className="font-medium text-ink-800">{p.firstName} {p.lastName}</span> },
          { key: 'loc', header: 'Location', cell: (p) => `${lk.facilityName(p.facilityId)} · ${lk.unitName(p.unitId)} · ${p.room}` },
          { key: 'open', header: 'Open Findings', align: 'center', cell: (p) => db.findings.filter((f) => f.patientId === p.id && isOpen(f.status)).length },
          { key: 'risk', header: 'Doc Risk', cell: (p) => <div className="w-28"><ScoreMeter score={p.documentationRiskScore} size="sm" /></div> },
        ]}
        rows={rows}
        rowKey={(p) => p.id}
        onRowClick={(p) => navigate(`/patients/${p.id}`)}
        empty={{ title: 'No patients assigned', description: 'You have no patients on your panel right now.' }}
      />
    </div>
  );
}

export function MyTasksPage() {
  const db = useStore((s) => s.db);
  const user = useStore((s) => s.currentUser)!;
  const now = useStore((s) => s.now);
  const lk = useLookups();
  const setTaskStatus = useStore((s) => s.setTaskStatus);
  const navigate = useNavigate();
  const [tab, setTab] = useState('mine');

  const rows = useMemo(() => {
    let list = db.tasks.slice();
    if (tab === 'mine') list = list.filter((t) => t.assignedToId === user.id);
    else if (tab === 'overdue') list = list.filter((t) => t.status !== 'completed' && new Date(t.dueAt) < new Date(now));
    else if (tab === 'completed') list = list.filter((t) => t.status === 'completed');
    return list.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  }, [db.tasks, tab, user.id, now]);

  return (
    <div className="space-y-4">
      <PageHeader title="My Tasks" crumbs={[{ label: 'My Work' }, { label: 'My Tasks' }]} />
      <Tabs
        tabs={[
          { id: 'mine', label: 'My Tasks', count: db.tasks.filter((t) => t.assignedToId === user.id && t.status !== 'completed').length },
          { id: 'team', label: 'Team Tasks' },
          { id: 'overdue', label: 'Overdue' },
          { id: 'completed', label: 'Completed' },
        ]}
        active={tab}
        onChange={setTab}
      />
      <DataTable
        columns={[
          { key: 't', header: 'Task', cell: (t) => <span className="font-medium text-ink-800">{t.title}</span> },
          { key: 'p', header: 'Patient', cell: (t) => (t.patientId ? lk.patientName(t.patientId) : '—') },
          { key: 'f', header: 'Related Finding', cell: (t) => (t.relatedFindingId ? <button className="text-brand-700 hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/risk/findings/${t.relatedFindingId}`); }}>{t.relatedFindingId}</button> : '—') },
          { key: 'pr', header: 'Priority', cell: (t) => <SeverityBadge severity={t.priority} size="sm" /> },
          { key: 'a', header: 'Assigned To', cell: (t) => lk.user(t.assignedToId)?.name },
          { key: 'd', header: 'Due', cell: (t) => <span className={cn('text-xs', overdueLabel(t.dueAt, now).overdue ? 'text-red-600' : 'text-ink-500')}>{overdueLabel(t.dueAt, now).label}</span> },
          {
            key: 's',
            header: 'Status',
            cell: (t) => (
              <select
                className="input py-1 text-xs"
                value={t.status}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setTaskStatus(t.id, e.target.value as any)}
              >
                {['open', 'in_progress', 'blocked', 'completed'].map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            ),
          },
        ]}
        rows={rows}
        rowKey={(t) => t.id}
        empty={{ title: 'No tasks', description: 'Nothing in this queue.' }}
      />
      <p className="text-xs text-ink-400">
        Completing a task does not automatically close a finding — the underlying documentation is re-evaluated before the risk finding is resolved.
      </p>
    </div>
  );
}

export function MyDocumentationPage() {
  const db = useStore((s) => s.db);
  const user = useStore((s) => s.currentUser)!;
  const lk = useLookups();
  const navigate = useNavigate();
  const notes = db.notes.filter((n) => n.authorId === user.id);
  const rows = notes.length ? notes : db.notes.slice(0, 10);

  return (
    <div className="space-y-4">
      <PageHeader title="My Documentation" subtitle="Notes and assessments you authored" crumbs={[{ label: 'My Work' }, { label: 'My Documentation' }]} />
      <DataTable
        columns={[
          { key: 'p', header: 'Patient', cell: (n) => lk.patientName(n.patientId) },
          { key: 't', header: 'Note', cell: (n) => <span className="font-medium text-ink-800">{n.title}</span> },
          { key: 'c', header: 'Created', cell: (n) => fmtDateTime(n.createdAt) },
          { key: 's', header: 'Status', cell: (n) => <span className="capitalize">{n.status}</span> },
        ]}
        rows={rows}
        rowKey={(n) => n.id}
        onRowClick={(n) => navigate(`/patients/${n.patientId}/notes/${n.id}`)}
        empty={{ title: 'No documentation', description: 'You have not authored any notes yet.' }}
      />
    </div>
  );
}

export function MyFindingsPage() {
  const db = useStore((s) => s.db);
  const user = useStore((s) => s.currentUser)!;
  const now = useStore((s) => s.now);
  const lk = useLookups();
  const navigate = useNavigate();
  const rows = db.findings.filter((f) => f.assignedUserId === user.id).sort((a, b) => b.priorityScore - a.priorityScore);

  return (
    <div className="space-y-4">
      <PageHeader title="My Risk Findings" subtitle={`${rows.filter((f) => isOpen(f.status)).length} open findings assigned to you`} crumbs={[{ label: 'My Work' }, { label: 'My Risk Findings' }]} />
      {rows.length === 0 ? (
        <EmptyState title="No findings assigned" description="You currently have no documentation findings assigned to you." />
      ) : (
        <DataTable
          columns={[
            { key: 'sev', header: 'Severity', cell: (f) => <SeverityBadge severity={f.severity} size="sm" /> },
            { key: 'p', header: 'Patient', cell: (f) => lk.patientName(f.patientId) },
            { key: 't', header: 'Finding', cell: (f) => <span className="font-medium text-ink-800">{f.title}</span> },
            { key: 'd', header: 'Due', cell: (f) => <span className={cn('text-xs', overdueLabel(f.dueAt, now).overdue ? 'text-red-600' : 'text-ink-500')}>{overdueLabel(f.dueAt, now).label}</span> },
            { key: 's', header: 'Status', cell: (f) => <StatusBadge status={f.status} /> },
          ]}
          rows={rows}
          rowKey={(f) => f.id}
          onRowClick={(f) => navigate(`/risk/findings/${f.id}`)}
        />
      )}
    </div>
  );
}
