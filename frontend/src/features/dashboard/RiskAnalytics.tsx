import { useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';
import { agingBuckets, complianceTrend, facilityOverview, severityDistribution, topCategories } from '@/store/selectors';
import { MetricCard, PageHeader, SectionCard } from '@/components/ui';
import { Donut, HBar, MultiLine, TrendLine, VBar } from '@/components/charts/Charts';
import { SEVERITY } from '@/utils/severity';
import { computeKpis } from '@/store/selectors';

export function RiskAnalytics() {
  const db = useStore((s) => s.db);
  const now = useStore((s) => s.now);
  const facilityFilter = useStore((s) => s.facilityFilter);
  const [range, setRange] = useState<'7D' | '30D' | '90D'>('90D');

  const kpis = useMemo(() => computeKpis(db, facilityFilter), [db, facilityFilter]);
  const sev = severityDistribution(db, facilityFilter);
  const aging = agingBuckets(db, facilityFilter, now);
  const cats = topCategories(db, facilityFilter);
  const facs = facilityOverview(db);

  const byFacilityTrend = complianceTrend(range).map((pt, i) => ({
    label: pt.label,
    'Houston North': Math.min(100, pt.value + 5),
    'Houston West': pt.value,
    Stafford: Math.max(60, pt.value - 8 + i),
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Clinical Risk Dashboard" subtitle="Trends, distribution and resolution performance across the organization." crumbs={[{ label: 'Command Center' }, { label: 'Clinical Risk Dashboard' }]} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard label="Compliance" value={`${kpis.compliance}%`} delta={{ value: 4.2, direction: 'up', goodWhen: 'up', suffix: '%' }} />
        <MetricCard label="Open Findings" value={kpis.openFindings} />
        <MetricCard label="Critical" value={kpis.criticalFindings} accent="critical" />
        <MetricCard label="Overdue" value={kpis.overdueDocumentation} accent="warning" />
        <MetricCard label="Resolved / wk" value={kpis.resolvedThisWeek} />
        <MetricCard label="High-Risk Charts" value={kpis.highRiskCharts} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Compliance Trend by Facility"
          className="lg:col-span-2"
          action={
            <div className="flex gap-1">
              {(['7D', '30D', '90D'] as const).map((r) => (
                <button key={r} onClick={() => setRange(r)} className={`rounded-md px-2 py-0.5 text-xs font-medium ${range === r ? 'bg-brand-100 text-brand-700' : 'text-ink-400'}`}>
                  {r}
                </button>
              ))}
            </div>
          }
        >
          <MultiLine
            data={byFacilityTrend}
            series={[
              { key: 'Houston North', label: 'Houston North', color: '#0d9488' },
              { key: 'Houston West', label: 'Houston West', color: '#4f46e5' },
              { key: 'Stafford', label: 'Stafford', color: '#f97316' },
            ]}
          />
        </SectionCard>
        <SectionCard title="Severity Distribution">
          <Donut data={sev.map((s) => ({ name: SEVERITY[s.severity].label, value: s.count, color: SEVERITY[s.severity].hex }))} />
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Risk Aging">
          <HBar data={aging.map((a) => ({ label: a.label, value: a.count }))} color="#f97316" />
        </SectionCard>
        <SectionCard title="Findings by Category">
          <HBar data={cats.map((c) => ({ label: c.label, value: c.findings }))} />
        </SectionCard>
        <SectionCard title="Avg Resolution Time by Facility">
          <VBar data={facs.map((f) => ({ label: f.facility.code, value: Number(f.avgResolutionHours.toFixed(1)) }))} color="#4f46e5" />
        </SectionCard>
      </div>

      <SectionCard title="30-day Compliance Trend (Organization)">
        <TrendLine data={complianceTrend('30D')} yDomain={[70, 100]} unit="%" />
      </SectionCard>

      <p className="text-xs text-ink-400">Prototype environment using synthetic demonstration data. Not intended for clinical use.</p>
    </div>
  );
}
