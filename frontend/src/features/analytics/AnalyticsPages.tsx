import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { complianceTrend, facilityOverview, staffPerformance, topCategories } from '@/store/selectors';
import { DataTable, MetricCard, PageHeader, SectionCard, Drawer } from '@/components/ui';
import { HBar, MultiLine, TrendLine, VBar, Sparkline } from '@/components/charts/Charts';
import { isOpen } from '@/utils/severity';
import { cn } from '@/utils/cn';

/* --------------------------- Compliance Overview -------------------------- */
export function ComplianceOverviewPage() {
  const db = useStore((s) => s.db);
  const cats = topCategories(db, 'all');
  const facs = facilityOverview(db);
  const orgCompliance = Math.round(facs.reduce((s, f) => s + f.compliance, 0) / facs.length);

  return (
    <div className="space-y-6">
      <PageHeader title="Compliance Overview" subtitle="Documentation compliance — not an overall clinical quality rating." crumbs={[{ label: 'Analytics' }, { label: 'Compliance Overview' }]} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Org Compliance" value={`${orgCompliance}%`} delta={{ value: 4.2, direction: 'up', goodWhen: 'up', suffix: '%' }} />
        <MetricCard label="Open Findings" value={db.findings.filter((f) => isOpen(f.status)).length} />
        <MetricCard label="Facilities" value={facs.length} />
        <MetricCard label="Resolved (wk)" value={db.findings.filter((f) => f.status === 'closed').length} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="90-day Compliance Trend">
          <TrendLine data={complianceTrend('90D')} yDomain={[70, 100]} unit="%" />
        </SectionCard>
        <SectionCard title="Open Findings by Category">
          <HBar data={cats.map((c) => ({ label: c.label, value: c.findings }))} />
        </SectionCard>
      </div>
      <SectionCard title="Facility Compliance">
        <DataTable
          columns={[
            { key: 'f', header: 'Facility', cell: (r: (typeof facs)[number]) => <span className="font-medium text-ink-800">{r.facility.name}</span> },
            { key: 'c', header: 'Compliance', align: 'right', cell: (r) => `${r.compliance}%` },
            { key: 'crit', header: 'Critical', align: 'right', cell: (r) => r.critical },
            { key: 'open', header: 'Open', align: 'right', cell: (r) => r.open },
            { key: 'res', header: 'Avg Resolution', align: 'right', cell: (r) => `${r.avgResolutionHours.toFixed(1)}h` },
          ]}
          rows={facs}
          rowKey={(r) => r.facility.id}
        />
      </SectionCard>
    </div>
  );
}

/* --------------------------- Facility Performance ------------------------ */
export function FacilityPerformancePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const db = useStore((s) => s.db);
  const facs = facilityOverview(db);
  const selected = params.get('facility');
  const focus = facs.find((f) => f.facility.id === selected);

  const trend = complianceTrend('30D').map((pt, i) => ({
    label: pt.label,
    'Houston North': Math.min(100, pt.value + 5),
    'Houston West': pt.value,
    Stafford: Math.max(60, pt.value - 8 + i),
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Facility Performance" subtitle="Drill from facility → unit → staff → patient → finding." crumbs={[{ label: 'Analytics' }, { label: 'Facility Performance' }]} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Best Compliance" value={`${Math.max(...facs.map((f) => f.compliance))}%`} />
        <MetricCard label="Total Critical" value={facs.reduce((s, f) => s + f.critical, 0)} accent="critical" />
        <MetricCard label="Total Open" value={facs.reduce((s, f) => s + f.open, 0)} />
        <MetricCard label="Avg Resolution" value={`${(facs.reduce((s, f) => s + f.avgResolutionHours, 0) / facs.length).toFixed(1)}h`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Compliance Trend">
          <MultiLine
            data={trend}
            series={[
              { key: 'Houston North', label: 'Houston North', color: '#0d9488' },
              { key: 'Houston West', label: 'Houston West', color: '#4f46e5' },
              { key: 'Stafford', label: 'Stafford', color: '#f97316' },
            ]}
          />
        </SectionCard>
        <SectionCard title="Resolution Performance (hrs)">
          <VBar data={facs.map((f) => ({ label: f.facility.code, value: Number(f.avgResolutionHours.toFixed(1)) }))} color="#4f46e5" />
        </SectionCard>
      </div>
      <SectionCard title="Facilities">
        <DataTable
          columns={[
            { key: 'f', header: 'Facility', cell: (r: (typeof facs)[number]) => <span className="font-medium text-ink-800">{r.facility.name}</span> },
            { key: 'c', header: 'Compliance', align: 'right', cell: (r) => `${r.compliance}%` },
            { key: 'crit', header: 'Critical', align: 'right', cell: (r) => <span className="text-red-600">{r.critical}</span> },
            { key: 'high', header: 'High', align: 'right', cell: (r) => <span className="text-orange-600">{r.high}</span> },
            { key: 'open', header: 'Open', align: 'right', cell: (r) => r.open },
            { key: 'res', header: 'Avg Resolution', align: 'right', cell: (r) => `${r.avgResolutionHours.toFixed(1)}h` },
          ]}
          rows={facs}
          rowKey={(r) => r.facility.id}
          onRowClick={(r) => navigate(`/risk/inbox?facility=${r.facility.id}`)}
        />
      </SectionCard>
      {focus && (
        <SectionCard title={`${focus.facility.name} — units`}>
          <DataTable
            columns={[
              { key: 'u', header: 'Unit', cell: (u: (typeof db.units)[number]) => u.name },
              { key: 't', header: 'Type', cell: (u) => u.type },
              { key: 'p', header: 'Patients', align: 'right', cell: (u) => db.patients.filter((p) => p.unitId === u.id).length },
              { key: 'f', header: 'Open Findings', align: 'right', cell: (u) => db.findings.filter((f) => f.unitId === u.id && isOpen(f.status)).length },
            ]}
            rows={db.units.filter((u) => u.facilityId === focus.facility.id)}
            rowKey={(u) => u.id}
          />
        </SectionCard>
      )}
    </div>
  );
}

/* ----------------------------- Unit Performance ------------------------- */
export function UnitPerformancePage() {
  const db = useStore((s) => s.db);
  const lk = { facilityName: (id: string) => db.facilities.find((f) => f.id === id)?.name };
  const rows = db.units.map((u) => {
    const open = db.findings.filter((f) => f.unitId === u.id && isOpen(f.status));
    const patients = db.patients.filter((p) => p.unitId === u.id && p.admissionStatus !== 'discharged');
    const compliance = patients.length ? Math.round(patients.reduce((s, p) => s + p.documentationCompliance, 0) / patients.length) : 0;
    return { unit: u, open: open.length, critical: open.filter((f) => f.severity === 'critical').length, compliance, patients: patients.length };
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Unit Performance" crumbs={[{ label: 'Analytics' }, { label: 'Unit Performance' }]} />
      <SectionCard title="Units">
        <DataTable
          columns={[
            { key: 'u', header: 'Unit', cell: (r: (typeof rows)[number]) => <span className="font-medium text-ink-800">{lk.facilityName(r.unit.facilityId)} · {r.unit.name}</span> },
            { key: 'p', header: 'Patients', align: 'right', cell: (r) => r.patients },
            { key: 'c', header: 'Compliance', align: 'right', cell: (r) => `${r.compliance}%` },
            { key: 'o', header: 'Open Findings', align: 'right', cell: (r) => r.open },
            { key: 'cr', header: 'Critical', align: 'right', cell: (r) => <span className="text-red-600">{r.critical}</span> },
          ]}
          rows={rows}
          rowKey={(r) => r.unit.id}
        />
      </SectionCard>
    </div>
  );
}

/* ---------------------------- Staff Performance ------------------------- */
export function StaffPerformancePage() {
  const db = useStore((s) => s.db);
  const rows = useMemo(() => staffPerformance(db), [db]);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const focus = rows.find((r) => r.user.id === drawerId);

  const avg = Math.round(rows.reduce((s, r) => s + r.compliance, 0) / rows.length);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Documentation Performance"
        subtitle="These are documentation metrics — not overall clinical quality ratings."
        crumbs={[{ label: 'Analytics' }, { label: 'Staff Performance' }]}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Average Compliance" value={`${avg}%`} />
        <MetricCard label="Open Findings" value={rows.reduce((s, r) => s + r.open, 0)} />
        <MetricCard label="Overdue Findings" value={rows.reduce((s, r) => s + r.overdue, 0)} accent="warning" />
        <MetricCard label="Avg Resolution" value={`${(rows.reduce((s, r) => s + r.avgResolutionHours, 0) / rows.length).toFixed(1)}h`} />
      </div>
      <SectionCard title="Clinicians">
        <DataTable
          columns={[
            { key: 'n', header: 'Clinician', cell: (r: (typeof rows)[number]) => <span className="font-medium text-ink-800">{r.user.name}</span> },
            { key: 'c', header: 'Compliance', align: 'right', cell: (r) => `${r.compliance}%` },
            { key: 'o', header: 'Open', align: 'right', cell: (r) => r.open },
            { key: 'cr', header: 'Critical', align: 'right', cell: (r) => <span className="text-red-600">{r.critical}</span> },
            { key: 'ov', header: 'Overdue', align: 'right', cell: (r) => r.overdue },
            {
              key: 't',
              header: 'Trend',
              cell: (r) => (
                <span className={cn('text-xs font-medium', r.trend === 'Improving' ? 'text-green-600' : r.trend === 'Declining' ? 'text-red-600' : 'text-ink-500')}>{r.trend}</span>
              ),
            },
          ]}
          rows={rows}
          rowKey={(r) => r.user.id}
          onRowClick={(r) => setDrawerId(r.user.id)}
        />
      </SectionCard>

      <Drawer open={!!focus} onClose={() => setDrawerId(null)} title={focus?.user.name ?? ''} subtitle="Documentation performance detail">
        {focus && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Compliance" value={`${focus.compliance}%`} />
              <MetricCard label="Avg Resolution" value={`${focus.avgResolutionHours.toFixed(1)}h`} />
              <MetricCard label="Open Tasks" value={db.tasks.filter((t) => t.assignedToId === focus.user.id && t.status !== 'completed').length} />
              <MetricCard label="Repeat Findings" value={Math.max(0, focus.open - focus.critical)} />
            </div>
            <SectionCard title="Compliance trend">
              <Sparkline data={[focus.compliance - 6, focus.compliance - 3, focus.compliance - 4, focus.compliance - 1, focus.compliance]} height={80} />
            </SectionCard>
            <SectionCard title="Most common findings">
              <ul className="space-y-1 text-sm text-ink-700">
                {db.findings
                  .filter((f) => f.assignedUserId === focus.user.id)
                  .slice(0, 5)
                  .map((f) => (
                    <li key={f.id} className="flex justify-between">
                      <span>{f.title}</span>
                      <span className="text-ink-400">{f.category}</span>
                    </li>
                  ))}
              </ul>
            </SectionCard>
            <p className="text-xs text-ink-400">Documentation metrics only. Not a clinical quality score.</p>
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* ------------------------------- Risk Trends --------------------------- */
export function RiskTrendsPage() {
  const db = useStore((s) => s.db);
  const cats = topCategories(db, 'all');
  const trend = complianceTrend('90D').map((pt, i) => ({
    label: pt.label,
    Detected: 40 - i * 2 + (i % 2) * 6,
    Resolved: 30 - i + (i % 3) * 4,
  }));
  return (
    <div className="space-y-6">
      <PageHeader title="Risk Trends" crumbs={[{ label: 'Analytics' }, { label: 'Risk Trends' }]} />
      <SectionCard title="Detected vs Resolved (90 days)">
        <MultiLine
          data={trend}
          series={[
            { key: 'Detected', label: 'Detected', color: '#f97316' },
            { key: 'Resolved', label: 'Resolved', color: '#0d9488' },
          ]}
        />
      </SectionCard>
      <SectionCard title="Findings by Category">
        <HBar data={cats.map((c) => ({ label: c.label, value: c.findings }))} />
      </SectionCard>
    </div>
  );
}
