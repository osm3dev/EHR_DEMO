import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sun } from 'lucide-react';
import { useStore } from '@/store/useStore';
import {
  agingBuckets,
  complianceTrend,
  computeKpis,
  facilityOverview,
  heatmap,
  severityDistribution,
  topCategories,
} from '@/store/selectors';
import { useLookups } from '@/hooks/useLookups';
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad';
import {
  CardSkeleton,
  DataTable,
  EmptyState,
  MetricCard,
  PageHeader,
  SectionCard,
  SeverityBadge,
  StatusBadge,
  TrendArrow,
  type Column,
} from '@/components/ui';
import { Donut, HBar, TrendLine } from '@/components/charts/Charts';
import { SEVERITY } from '@/utils/severity';
import { fmtDateTime, overdueLabel } from '@/utils/format';
import { FindingDrawer } from '@/features/risk/FindingDrawer';
import type { RiskFinding } from '@/types';
import { cn } from '@/utils/cn';

export function CommandCenter() {
  const navigate = useNavigate();
  const db = useStore((s) => s.db);
  const now = useStore((s) => s.now);
  const facilityFilter = useStore((s) => s.facilityFilter);
  const lk = useLookups();
  const [range, setRange] = useState<'7D' | '30D' | '90D'>('30D');
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [shift, setShift] = useState('all');
  const [category, setCategory] = useState('all');

  const loading = useSimulatedLoad(500, [facilityFilter]);

  const kpis = useMemo(() => computeKpis(db, facilityFilter), [db, facilityFilter]);
  const sev = useMemo(() => severityDistribution(db, facilityFilter), [db, facilityFilter]);
  const aging = useMemo(() => agingBuckets(db, facilityFilter, now), [db, facilityFilter, now]);
  const cats = useMemo(() => topCategories(db, facilityFilter), [db, facilityFilter]);
  const facRows = useMemo(() => facilityOverview(db), [db]);
  const heat = useMemo(() => heatmap(db), [db]);

  const criticalRows = useMemo(
    () =>
      db.findings
        .filter((f) => (facilityFilter === 'all' || f.facilityId === facilityFilter) && ['critical', 'high'].includes(f.severity) && !['closed', 'false_positive', 'accepted_exception'].includes(f.status))
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, 8),
    [db.findings, facilityFilter],
  );

  const goInbox = (params: string) => navigate(`/risk/inbox?${params}`);

  const kpiCards = [
    { label: 'Documentation Compliance', value: `${kpis.compliance}%`, delta: { value: kpis.complianceDelta, direction: 'up' as const, goodWhen: 'up' as const, suffix: '%' }, hint: 'vs last period', to: 'view=all' },
    { label: 'Critical Findings', value: kpis.criticalFindings, delta: { value: Math.abs(kpis.criticalDelta), direction: 'down' as const, goodWhen: 'down' as const }, hint: 'since yesterday', to: 'severity=critical', accent: 'critical' as const },
    { label: 'Open Findings', value: kpis.openFindings, to: 'status=open' },
    { label: 'Charts Requiring Review', value: kpis.chartsRequiringReview, to: 'view=charts' },
    { label: 'Overdue Documentation', value: kpis.overdueDocumentation, to: 'aging=overdue', accent: 'warning' as const },
    { label: 'Unsigned Documentation', value: kpis.unsignedDocumentation, to: 'category=signatures' },
    { label: 'High-Risk Charts', value: kpis.highRiskCharts, to: 'view=highrisk' },
    { label: 'Resolved This Week', value: kpis.resolvedThisWeek, to: 'status=resolved' },
  ];

  const trendData = complianceTrend(range);

  const critColumns: Column<RiskFinding>[] = [
    { key: 'patient', header: 'Patient', cell: (f) => <span className="font-medium text-ink-800">{lk.patientName(f.patientId)}</span> },
    { key: 'mrn', header: 'MRN', cell: (f) => <span className="text-ink-500">{lk.patient(f.patientId)?.mrn}</span>, hideOnMobile: true },
    { key: 'finding', header: 'Finding', cell: (f) => f.title },
    { key: 'facility', header: 'Facility', cell: (f) => lk.facilityName(f.facilityId), hideOnMobile: true },
    { key: 'severity', header: 'Severity', cell: (f) => <SeverityBadge severity={f.severity} size="sm" /> },
    { key: 'assigned', header: 'Assigned To', cell: (f) => lk.userName(f.assignedUserId), hideOnMobile: true },
    {
      key: 'age',
      header: 'Age / Due',
      cell: (f) => {
        const d = overdueLabel(f.dueAt, now);
        return <span className={cn('text-xs font-medium', d.overdue ? 'text-red-600' : 'text-ink-500')}>{d.label}</span>;
      },
    },
    { key: 'status', header: 'Status', cell: (f) => <StatusBadge status={f.status} /> },
    {
      key: 'action',
      header: 'Action',
      align: 'right',
      cell: (f) => (
        <div className="flex justify-end gap-1.5">
          <button className="btn-secondary px-2 py-1 text-xs" onClick={(e) => { e.stopPropagation(); setDrawerId(f.id); }}>
            View Finding
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinical Risk Command Center"
        subtitle="Your organization's documentation health at a glance."
        actions={
          <div className="flex flex-wrap gap-2">
            <select className="input py-1.5 text-xs" value={shift} onChange={(e) => setShift(e.target.value)} aria-label="Shift">
              <option value="all">All Shifts</option>
              <option value="day">Day</option>
              <option value="night">Night</option>
            </select>
            <select className="input py-1.5 text-xs" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Risk Category">
              <option value="all">All Risk Categories</option>
              {cats.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
            <button className="btn-secondary text-xs" onClick={() => goInbox('view=all')}>
              Open Risk Inbox <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
          : kpiCards.map((k) => (
              <MetricCard
                key={k.label}
                label={k.label}
                value={k.value}
                delta={k.delta}
                hint={k.hint}
                accent={k.accent}
                onClick={() => goInbox(k.to)}
              />
            ))}
      </div>

      {/* Morning brief */}
      <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-600 text-white">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-900">Morning Clinical Risk Brief</p>
              <p className="text-sm text-ink-600">
                <strong>{kpis.chartsEvaluated}</strong> charts evaluated ·{' '}
                <strong>{kpis.chartsRequiringReview}</strong> require attention (
                <span className="text-red-700">{kpis.criticalFindings} critical</span>,{' '}
                <span className="text-orange-700">{kpis.highFindings} high</span>) ·{' '}
                <strong>{kpis.resolvedSinceYesterday}</strong> findings resolved since yesterday
              </p>
            </div>
          </div>
          <button className="btn-primary shrink-0 text-sm" onClick={() => goInbox('severity=critical')}>
            Review Critical Findings
          </button>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Documentation Compliance Trend"
          action={
            <div className="flex gap-1">
              {(['7D', '30D', '90D'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    'rounded-md px-2 py-0.5 text-xs font-medium',
                    range === r ? 'bg-brand-100 text-brand-700' : 'text-ink-400 hover:text-ink-700',
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          }
        >
          <TrendLine data={trendData} yDomain={[70, 100]} unit="%" />
        </SectionCard>

        <SectionCard title="Risk Severity Distribution">
          <Donut
            data={sev.map((s) => ({ name: SEVERITY[s.severity].label, value: s.count, color: SEVERITY[s.severity].hex }))}
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            {sev.map((s) => (
              <div key={s.severity} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: SEVERITY[s.severity].hex }} />
                  {SEVERITY[s.severity].label}
                </span>
                <span className="font-semibold text-ink-800">{s.count}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Risk Aging">
          <HBar data={aging.map((a) => ({ label: a.label, value: a.count }))} color="#f97316" />
          <p className="mt-2 text-xs text-ink-400">Time since each open finding was detected.</p>
        </SectionCard>
      </div>

      {/* Categories + Facility overview */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Top Documentation Risk Categories" action={<button className="text-xs font-medium text-brand-700" onClick={() => navigate('/analytics/trends')}>Risk trends →</button>}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="pb-2 font-semibold">Risk Category</th>
                <th className="pb-2 text-right font-semibold">Findings</th>
                <th className="pb-2 pl-4 font-semibold">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {cats.map((c) => (
                <tr
                  key={c.key}
                  className="cursor-pointer hover:bg-brand-50/40"
                  onClick={() => goInbox(`category=${c.key}`)}
                >
                  <td className="py-2.5 font-medium text-ink-800">{c.label}</td>
                  <td className="py-2.5 text-right text-ink-700">{c.findings}</td>
                  <td className="py-2.5 pl-4">
                    <TrendArrow trend={c.trend} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard title="Facility Risk Overview">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="pb-2 font-semibold">Facility</th>
                <th className="pb-2 text-right font-semibold">Compliance</th>
                <th className="pb-2 text-right font-semibold">Critical</th>
                <th className="pb-2 text-right font-semibold">High</th>
                <th className="pb-2 text-right font-semibold">Open</th>
                <th className="pb-2 text-right font-semibold">Avg Res.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {facRows.map((r) => (
                <tr
                  key={r.facility.id}
                  className="cursor-pointer hover:bg-brand-50/40"
                  onClick={() => navigate(`/analytics/facility?facility=${r.facility.id}`)}
                >
                  <td className="py-2.5 font-medium text-ink-800">{r.facility.name}</td>
                  <td className="py-2.5 text-right">{r.compliance}%</td>
                  <td className="py-2.5 text-right text-red-600">{r.critical}</td>
                  <td className="py-2.5 text-right text-orange-600">{r.high}</td>
                  <td className="py-2.5 text-right">{r.open}</td>
                  <td className="py-2.5 text-right text-ink-500">{r.avgResolutionHours.toFixed(1)}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      </div>

      {/* Heatmap */}
      <SectionCard title="Clinical Risk Heatmap" bodyClassName="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink-400">
              <th className="pb-2 font-semibold">Facility</th>
              {heat[0]?.cells.map((c) => (
                <th key={c.category} className="pb-2 text-center font-semibold">
                  {c.category}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heat.map((row) => (
              <tr key={row.facility.id}>
                <td className="py-1.5 pr-3 font-medium text-ink-800">{row.facility.name}</td>
                {row.cells.map((c) => (
                  <td key={c.category} className="p-1">
                    <button
                      onClick={() => goInbox(`facility=${row.facility.id}&category=${c.category.toLowerCase()}`)}
                      className={cn(
                        'flex w-full flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-xs font-semibold transition-transform hover:scale-[1.02]',
                        c.severity === 'none'
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : c.severity === 'critical'
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : c.severity === 'high'
                              ? 'border-orange-200 bg-orange-50 text-orange-700'
                              : c.severity === 'medium'
                                ? 'border-amber-200 bg-amber-50 text-amber-700'
                                : 'border-blue-200 bg-blue-50 text-blue-700',
                      )}
                    >
                      <span>{c.severity === 'none' ? 'Clear' : SEVERITY[c.severity].label}</span>
                      <span className="text-[11px] font-normal opacity-70">{c.count} open</span>
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      {/* Critical issues */}
      <SectionCard
        title="Critical Issues Requiring Attention"
        action={<button className="text-xs font-medium text-brand-700" onClick={() => goInbox('severity=critical')}>View all →</button>}
        bodyClassName="p-0"
      >
        <div className="p-4">
          <DataTable
            columns={critColumns}
            rows={criticalRows}
            rowKey={(f) => f.id}
            onRowClick={(f) => setDrawerId(f.id)}
            loading={loading}
            empty={{
              title: 'No critical or high findings',
              description: 'There are currently no unresolved critical documentation findings for this scope.',
            }}
          />
        </div>
      </SectionCard>

      <p className="text-xs text-ink-400">
        Prototype environment using synthetic demonstration data. Not intended for clinical use.
      </p>

      <FindingDrawer findingId={drawerId} onClose={() => setDrawerId(null)} />
    </div>
  );
}
