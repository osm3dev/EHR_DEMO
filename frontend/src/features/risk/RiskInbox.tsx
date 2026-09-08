import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronsUp, TriangleAlert, UserPlus } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useLookups } from '@/hooks/useLookups';
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad';
import {
  DataTable,
  FilterBar,
  PageHeader,
  SeverityBadge,
  StatusBadge,
  Tabs,
  type Column,
  type FilterDef,
} from '@/components/ui';
import { CATEGORY_LABEL, isOpen, SEVERITY_ORDER } from '@/utils/severity';
import { fmtDateTime, fromNow, overdueLabel } from '@/utils/format';
import { parseISO } from 'date-fns';
import { FindingDrawer } from './FindingDrawer';
import type { RiskFinding } from '@/types';
import { cn } from '@/utils/cn';

type Preset = 'all' | 'critical' | 'overdue' | 'aging' | 'resolved';

const TAB_DEFS = [
  { id: 'all', label: 'All' },
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'mine', label: 'My Findings' },
  { id: 'awaiting_verification', label: 'Awaiting Verification' },
  { id: 'ai', label: 'AI Findings' },
  { id: 'resolved', label: 'Resolved' },
];

export function RiskInbox({ preset = 'all' }: { preset?: Preset }) {
  const [params, setParams] = useSearchParams();
  const db = useStore((s) => s.db);
  const now = useStore((s) => s.now);
  const currentUser = useStore((s) => s.currentUser);
  const facilityFilter = useStore((s) => s.facilityFilter);
  const assignFinding = useStore((s) => s.assignFinding);
  const escalateFinding = useStore((s) => s.escalateFinding);
  const lk = useLookups();
  const loading = useSimulatedLoad(400, [preset, facilityFilter]);

  const presetTab =
    preset === 'critical' ? 'critical' : preset === 'overdue' ? 'overdue' : preset === 'resolved' ? 'resolved' : params.get('severity') === 'critical' ? 'critical' : 'all';
  const [tab, setTab] = useState<string>(presetTab);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({
    category: params.get('category') ?? 'all',
    severity: params.get('severity') ?? 'all',
    status: 'all',
    assignee: 'all',
    aging: preset === 'aging' ? '48' : 'all',
  });
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filterDefs: FilterDef[] = [
    { key: 'category', label: 'Category', options: Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label })) },
    { key: 'severity', label: 'Severity', options: SEVERITY_ORDER.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })) },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'detected', label: 'Detected' },
        { value: 'assigned', label: 'Assigned' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'awaiting_verification', label: 'Awaiting Verification' },
        { value: 'closed', label: 'Closed' },
      ],
    },
    { key: 'assignee', label: 'Assigned', options: db.users.filter((u) => u.role !== 'Administrator').map((u) => ({ value: u.id, label: u.name })) },
    {
      key: 'aging',
      label: 'Aging',
      options: [
        { value: '24', label: '> 24h old' },
        { value: '48', label: '> 48h old' },
        { value: '168', label: '> 7d old' },
      ],
    },
  ];

  const rows = useMemo(() => {
    let list = db.findings.slice();
    if (facilityFilter !== 'all') list = list.filter((f) => f.facilityId === facilityFilter);

    // tab
    if (tab === 'critical') list = list.filter((f) => f.severity === 'critical' && isOpen(f.status));
    else if (tab === 'high') list = list.filter((f) => f.severity === 'high' && isOpen(f.status));
    else if (tab === 'overdue') list = list.filter((f) => f.isOverdue && isOpen(f.status));
    else if (tab === 'mine') list = list.filter((f) => f.assignedUserId === currentUser?.id);
    else if (tab === 'awaiting_verification') list = list.filter((f) => f.status === 'awaiting_verification');
    else if (tab === 'ai') list = list.filter((f) => f.isAiGenerated);
    else if (tab === 'resolved') list = list.filter((f) => ['closed', 'false_positive', 'accepted_exception'].includes(f.status));
    else list = list.filter((f) => isOpen(f.status));

    if (preset === 'resolved') list = db.findings.filter((f) => ['closed', 'false_positive', 'accepted_exception'].includes(f.status));

    // filters
    if (filters.category !== 'all') list = list.filter((f) => f.category === filters.category);
    if (filters.severity !== 'all') list = list.filter((f) => f.severity === filters.severity);
    if (filters.status !== 'all') list = list.filter((f) => f.status === filters.status);
    if (filters.assignee !== 'all') list = list.filter((f) => f.assignedUserId === filters.assignee);
    if (filters.aging !== 'all') {
      const h = Number(filters.aging);
      list = list.filter((f) => (parseISO(now).getTime() - parseISO(f.detectedAt).getTime()) / 3600_000 > h);
    }

    // search
    const t = search.trim().toLowerCase();
    if (t) {
      list = list.filter((f) => {
        const p = lk.patient(f.patientId);
        return (
          f.title.toLowerCase().includes(t) ||
          lk.patientName(f.patientId).toLowerCase().includes(t) ||
          (p?.mrn ?? '').includes(t) ||
          lk.userName(f.assignedUserId).toLowerCase().includes(t)
        );
      });
    }

    return list.sort((a, b) => b.priorityScore - a.priorityScore);
  }, [db.findings, tab, filters, search, facilityFilter, currentUser, now, preset, lk]);

  const tabCounts = useMemo(() => {
    const scoped = facilityFilter === 'all' ? db.findings : db.findings.filter((f) => f.facilityId === facilityFilter);
    return {
      all: scoped.filter((f) => isOpen(f.status)).length,
      critical: scoped.filter((f) => f.severity === 'critical' && isOpen(f.status)).length,
      high: scoped.filter((f) => f.severity === 'high' && isOpen(f.status)).length,
      overdue: scoped.filter((f) => f.isOverdue && isOpen(f.status)).length,
      mine: scoped.filter((f) => f.assignedUserId === currentUser?.id && isOpen(f.status)).length,
      awaiting_verification: scoped.filter((f) => f.status === 'awaiting_verification').length,
      ai: scoped.filter((f) => f.isAiGenerated && isOpen(f.status)).length,
      resolved: scoped.filter((f) => f.status === 'closed').length,
    } as Record<string, number>;
  }, [db.findings, facilityFilter, currentUser]);

  const toggleSelect = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleAll = () =>
    setSelected((s) => (s.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))));

  const bulkAssign = () => {
    const nurse = db.users.find((u) => u.role === 'Nurse');
    selected.forEach((id) => nurse && assignFinding(id, nurse.id));
    setSelected(new Set());
  };
  const bulkEscalate = () => {
    selected.forEach((id) => escalateFinding(id));
    setSelected(new Set());
  };

  const columns: Column<RiskFinding>[] = [
    { key: 'severity', header: 'Severity', cell: (f) => <SeverityBadge severity={f.severity} size="sm" />, sortValue: (f) => SEVERITY_ORDER.indexOf(f.severity) },
    {
      key: 'patient',
      header: 'Patient',
      sortValue: (f) => lk.patientName(f.patientId),
      cell: (f) => (
        <div>
          <p className="font-medium text-ink-800">{lk.patientName(f.patientId)}</p>
          <p className="text-xs text-ink-400">MRN {lk.patient(f.patientId)?.mrn}</p>
        </div>
      ),
    },
    { key: 'finding', header: 'Finding', cell: (f) => (
      <div className="max-w-xs">
        <p className="truncate text-ink-800">{f.title}</p>
        {f.isAiGenerated && <span className="text-[11px] font-medium text-violet-600">AI-assisted</span>}
      </div>
    ) },
    { key: 'category', header: 'Category', cell: (f) => <span className="text-ink-500">{CATEGORY_LABEL[f.category]}</span> },
    { key: 'facility', header: 'Facility', cell: (f) => lk.facilityName(f.facilityId) },
    { key: 'assignee', header: 'Assigned To', cell: (f) => <span className="text-ink-600">{lk.userName(f.assignedUserId)}</span> },
    { key: 'detected', header: 'Detected', sortValue: (f) => f.detectedAt, cell: (f) => <span className="text-xs text-ink-500">{fromNow(f.detectedAt)}</span> },
    {
      key: 'due',
      header: 'Due',
      sortValue: (f) => f.dueAt,
      cell: (f) => {
        const d = overdueLabel(f.dueAt, now);
        return <span className={cn('text-xs font-medium', d.overdue ? 'text-red-600' : 'text-ink-500')}>{d.label}</span>;
      },
    },
    { key: 'status', header: 'Status', cell: (f) => <StatusBadge status={f.status} /> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Risk Inbox"
        subtitle="Every open documentation finding across your scope, prioritized by risk."
        crumbs={[{ label: 'Risk Management' }, { label: 'Risk Inbox' }]}
      />

      <Tabs
        tabs={TAB_DEFS.map((t) => ({ ...t, count: tabCounts[t.id] }))}
        active={tab}
        onChange={(id) => {
          setTab(id);
          params.delete('severity');
          setParams(params);
        }}
      />

      <FilterBar
        filters={filterDefs}
        value={filters}
        onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
        onReset={() => setFilters({ category: 'all', severity: 'all', status: 'all', assignee: 'all', aging: 'all' })}
        search={{ value: search, onChange: setSearch, placeholder: 'Search patient, finding, MRN or staff…' }}
      />

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm">
          <span className="font-medium text-brand-800">{selected.size} selected</span>
          <button className="btn-secondary py-1 text-xs" onClick={bulkAssign}>
            <UserPlus className="h-3.5 w-3.5" /> Assign
          </button>
          <button className="btn-secondary py-1 text-xs" onClick={bulkEscalate}>
            <ChevronsUp className="h-3.5 w-3.5" /> Escalate
          </button>
          <button className="btn-secondary py-1 text-xs" onClick={bulkEscalate}>
            <TriangleAlert className="h-3.5 w-3.5" /> Change Priority
          </button>
          <button className="btn-ghost py-1 text-xs" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(f) => f.id}
        onRowClick={(f) => setDrawerId(f.id)}
        loading={loading}
        selectable
        selectedIds={selected}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleAll}
        empty={{
          title: 'No findings match your filters',
          description: 'Try clearing filters or switching tabs. A clean inbox means documentation is on track.',
        }}
        mobileCard={(f) => (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <SeverityBadge severity={f.severity} size="sm" />
              <StatusBadge status={f.status} />
            </div>
            <p className="font-medium text-ink-800">{f.title}</p>
            <p className="text-sm text-ink-500">
              {lk.patientName(f.patientId)} · MRN {lk.patient(f.patientId)?.mrn}
            </p>
            <p className="text-xs text-ink-400">
              {lk.facilityName(f.facilityId)} · {overdueLabel(f.dueAt, now).label} · {lk.userName(f.assignedUserId)}
            </p>
          </div>
        )}
      />

      <p className="text-xs text-ink-400">
        {rows.length} finding{rows.length === 1 ? '' : 's'} shown · Last evaluation {fmtDateTime(now)}
      </p>

      <FindingDrawer findingId={drawerId} onClose={() => setDrawerId(null)} />
    </div>
  );
}
