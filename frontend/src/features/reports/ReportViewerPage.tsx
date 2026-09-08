import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Play } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useLookups } from '@/hooks/useLookups';
import { DataTable, EmptyState, PageHeader, SectionCard } from '@/components/ui';
import { REPORTS } from './reportCatalog';
import { facilityOverview, staffPerformance } from '@/store/selectors';
import { isOpen } from '@/utils/severity';
import { fmtDate } from '@/utils/format';

export function ReportViewerPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const db = useStore((s) => s.db);
  const pushToast = useStore((s) => s.pushToast);
  const lk = useLookups();
  const report = REPORTS.find((r) => r.id === reportId);
  const [ran, setRan] = useState(false);
  const [filters, setFilters] = useState({ facility: 'all', severity: 'all', range: '30D' });

  const data = useMemo(() => buildReport(reportId ?? '', db, lk), [reportId, db, lk]);

  if (!report) return <EmptyState title="Report not found" description="Choose a report from the library." />;

  const exportAs = (fmt: string) => pushToast({ title: `${report.name} exported (${fmt}).`, tone: 'success', body: 'Simulated export — a real deployment would stream the file.' });

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/reports')} className="btn-ghost -ml-2 text-sm">
        <ArrowLeft className="h-4 w-4" /> Reports
      </button>
      <PageHeader
        title={report.name}
        subtitle={report.description}
        crumbs={[{ label: 'Reports', to: '/reports' }, { label: report.name }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary text-sm" onClick={() => exportAs('PDF')}>
              <Download className="h-4 w-4" /> PDF
            </button>
            <button className="btn-secondary text-sm" onClick={() => exportAs('CSV')}>
              <Download className="h-4 w-4" /> CSV
            </button>
            <button className="btn-secondary text-sm" onClick={() => exportAs('Excel')}>
              <Download className="h-4 w-4" /> Excel
            </button>
          </div>
        }
      />

      <SectionCard title="Parameters" bodyClassName="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="label">Facility</span>
          <select className="input" value={filters.facility} onChange={(e) => setFilters((f) => ({ ...f, facility: e.target.value }))}>
            <option value="all">All Facilities</option>
            {db.facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Severity</span>
          <select className="input" value={filters.severity} onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value }))}>
            <option value="all">All</option>
            <option>critical</option>
            <option>high</option>
            <option>medium</option>
            <option>low</option>
          </select>
        </label>
        <label className="block">
          <span className="label">Date Range</span>
          <select className="input" value={filters.range} onChange={(e) => setFilters((f) => ({ ...f, range: e.target.value }))}>
            <option>7D</option>
            <option>30D</option>
            <option>90D</option>
          </select>
        </label>
        <button className="btn-primary text-sm" onClick={() => setRan(true)}>
          <Play className="h-4 w-4" /> Run Report
        </button>
      </SectionCard>

      {ran ? (
        <SectionCard title={`Results — generated ${fmtDate(useStore.getState().now)}`}>
          <DataTable
            columns={data.columns}
            rows={data.rows}
            rowKey={(r: any) => r.id ?? r.facility?.id ?? r.user?.id ?? JSON.stringify(r).slice(0, 40)}
            empty={{ title: 'No rows', description: 'No data for these parameters.' }}
          />
        </SectionCard>
      ) : (
        <EmptyState title="Report not run yet" description="Set parameters and select Run Report to generate results." />
      )}
      <p className="text-xs text-ink-400">Prototype environment using synthetic demonstration data. Exports are simulated.</p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildReport(id: string, db: ReturnType<typeof useStore.getState>['db'], lk: any): { columns: any[]; rows: any[] } {
  switch (id) {
    case 'risk-by-facility':
      return {
        columns: [
          { key: 'f', header: 'Facility', cell: (r: any) => r.facility.name },
          { key: 'c', header: 'Compliance', cell: (r: any) => `${r.compliance}%` },
          { key: 'crit', header: 'Critical', cell: (r: any) => r.critical },
          { key: 'open', header: 'Open', cell: (r: any) => r.open },
          { key: 'res', header: 'Avg Resolution', cell: (r: any) => `${r.avgResolutionHours.toFixed(1)}h` },
        ],
        rows: facilityOverview(db),
      };
    case 'risk-by-staff':
      return {
        columns: [
          { key: 'n', header: 'Clinician', cell: (r: any) => r.user.name },
          { key: 'c', header: 'Compliance', cell: (r: any) => `${r.compliance}%` },
          { key: 'o', header: 'Open', cell: (r: any) => r.open },
          { key: 'ov', header: 'Overdue', cell: (r: any) => r.overdue },
          { key: 't', header: 'Trend', cell: (r: any) => r.trend },
        ],
        rows: staffPerformance(db),
      };
    case 'risk-by-patient':
      return {
        columns: [
          { key: 'p', header: 'Patient', cell: (r: any) => `${r.firstName} ${r.lastName}` },
          { key: 'mrn', header: 'MRN', cell: (r: any) => r.mrn },
          { key: 'score', header: 'Doc Risk', cell: (r: any) => r.documentationRiskScore },
          { key: 'comp', header: 'Compliance', cell: (r: any) => `${r.documentationCompliance}%` },
          { key: 'open', header: 'Open Findings', cell: (r: any) => db.findings.filter((f) => f.patientId === r.id && isOpen(f.status)).length },
        ],
        rows: db.patients.filter((p) => p.admissionStatus !== 'discharged').sort((a, b) => b.documentationRiskScore - a.documentationRiskScore),
      };
    case 'audit-activity':
      return {
        columns: [
          { key: 'at', header: 'Timestamp', cell: (r: any) => r.at.replace('T', ' ').slice(0, 16) },
          { key: 'u', header: 'User', cell: (r: any) => r.userName },
          { key: 'a', header: 'Action', cell: (r: any) => r.action },
          { key: 'm', header: 'Module', cell: (r: any) => r.module },
        ],
        rows: db.auditEvents.slice(0, 40),
      };
    default:
      return {
        columns: [
          { key: 'p', header: 'Patient', cell: (r: any) => lk.patientName(r.patientId) },
          { key: 't', header: 'Finding', cell: (r: any) => r.title },
          { key: 's', header: 'Severity', cell: (r: any) => r.severity },
          { key: 'st', header: 'Status', cell: (r: any) => r.status.replace('_', ' ') },
          { key: 'due', header: 'Due', cell: (r: any) => fmtDate(r.dueAt) },
        ],
        rows: db.findings
          .filter((f) => (id === 'critical-findings' ? f.severity === 'critical' : id === 'ai-findings' ? f.isAiGenerated : id === 'overdue-documentation' ? f.isOverdue : true))
          .slice(0, 60),
      };
  }
}
