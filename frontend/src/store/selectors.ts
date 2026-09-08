import type { MockDB } from '@/data/mockdb';
import type { RiskFinding, Severity } from '@/types';
import { isOpen } from '@/utils/severity';
import { parseISO } from 'date-fns';

export interface Kpis {
  compliance: number;
  complianceDelta: number;
  criticalFindings: number;
  criticalDelta: number;
  openFindings: number;
  chartsRequiringReview: number;
  overdueDocumentation: number;
  unsignedDocumentation: number;
  highRiskCharts: number;
  resolvedThisWeek: number;
  chartsEvaluated: number;
  highFindings: number;
  resolvedSinceYesterday: number;
}

export function facilityScoped<T extends { facilityId?: string }>(rows: T[], facilityFilter: string): T[] {
  if (facilityFilter === 'all') return rows;
  return rows.filter((r) => r.facilityId === facilityFilter);
}

export function computeKpis(db: MockDB, facilityFilter: string): Kpis {
  const findings = facilityScoped(db.findings, facilityFilter);
  const open = findings.filter((f) => isOpen(f.status));
  const critical = open.filter((f) => f.severity === 'critical');
  const high = open.filter((f) => f.severity === 'high');
  const patients = facilityScoped(db.patients, facilityFilter).filter((p) => p.admissionStatus !== 'discharged');

  const closed = findings.filter((f) => f.status === 'closed');
  const chartsWithOpen = new Set(open.map((f) => f.patientId));
  const highRiskCharts = patients.filter((p) => p.documentationRiskScore >= 65).length;

  const overdue = open.filter((f) => f.isOverdue).length;
  const unsigned = facilityScoped(
    db.notes.map((n) => ({ ...n, facilityId: db.patients.find((p) => p.id === n.patientId)?.facilityId })),
    facilityFilter,
  ).filter((n) => n.status === 'draft' || n.status === 'complete').length;

  const compliance = patients.length
    ? Math.round(patients.reduce((s, p) => s + p.documentationCompliance, 0) / patients.length)
    : 0;

  return {
    compliance,
    complianceDelta: 4.2,
    criticalFindings: critical.length,
    criticalDelta: -7,
    openFindings: open.length,
    chartsRequiringReview: chartsWithOpen.size,
    overdueDocumentation: overdue,
    unsignedDocumentation: unsigned,
    highRiskCharts,
    // "this week" includes a synthetic backlog of prior resolutions so the
    // number reads realistically; it still increments as findings are closed live.
    resolvedThisWeek: closed.length + 62,
    chartsEvaluated: facilityScoped(db.patients, facilityFilter).length + 275,
    highFindings: high.length,
    resolvedSinceYesterday: closed.length + 22,
  };
}

export interface SeverityCount {
  severity: Severity;
  count: number;
}

export function severityDistribution(db: MockDB, facilityFilter: string): SeverityCount[] {
  const open = facilityScoped(db.findings, facilityFilter).filter((f) => isOpen(f.status));
  return (['critical', 'high', 'medium', 'low'] as Severity[]).map((severity) => ({
    severity,
    count: open.filter((f) => f.severity === severity).length,
  }));
}

export function agingBuckets(db: MockDB, facilityFilter: string, nowIso: string) {
  const now = Date.parse(nowIso);
  const open = facilityScoped(db.findings, facilityFilter).filter((f) => isOpen(f.status));
  const buckets = [
    { label: '< 24 hours', min: 0, max: 24 },
    { label: '24–48 hours', min: 24, max: 48 },
    { label: '2–7 days', min: 48, max: 168 },
    { label: '> 7 days', min: 168, max: Infinity },
  ];
  return buckets.map((b) => ({
    label: b.label,
    count: open.filter((f) => {
      const ageH = (now - parseISO(f.detectedAt).getTime()) / 3600_000;
      return ageH >= b.min && ageH < b.max;
    }).length,
  }));
}

export interface CategoryRow {
  key: RiskFinding['category'];
  label: string;
  findings: number;
  trend: 'up' | 'down' | 'flat';
}

export function topCategories(db: MockDB, facilityFilter: string): CategoryRow[] {
  const open = facilityScoped(db.findings, facilityFilter).filter((f) => isOpen(f.status));
  const labels: Record<string, string> = {
    assessments: 'Missing Assessments',
    signatures: 'Missing Signatures',
    care_plans: 'Care Plan Gaps',
    medication_reconciliation: 'Medication Reconciliation',
    orders: 'Orders',
    labs: 'Lab Follow-up',
    notes: 'Notes',
    consent: 'Consent',
  };
  const trendByKey: Record<string, 'up' | 'down' | 'flat'> = {
    assessments: 'up',
    signatures: 'down',
    care_plans: 'up',
    medication_reconciliation: 'down',
    orders: 'flat',
    labs: 'up',
    notes: 'flat',
    consent: 'flat',
  };
  const counts = new Map<string, number>();
  for (const f of open) counts.set(f.category, (counts.get(f.category) ?? 0) + 1);
  return [...counts.entries()]
    .map(([key, findings]) => ({ key: key as RiskFinding['category'], label: labels[key], findings, trend: trendByKey[key] ?? 'flat' }))
    .sort((a, b) => b.findings - a.findings);
}

export function facilityOverview(db: MockDB) {
  return db.facilities.map((fac) => {
    const patients = db.patients.filter((p) => p.facilityId === fac.id && p.admissionStatus !== 'discharged');
    const findings = db.findings.filter((f) => f.facilityId === fac.id);
    const open = findings.filter((f) => isOpen(f.status));
    const closed = findings.filter((f) => f.status === 'closed');
    const compliance = patients.length ? Math.round(patients.reduce((s, p) => s + p.documentationCompliance, 0) / patients.length) : 0;
    return {
      facility: fac,
      compliance,
      critical: open.filter((f) => f.severity === 'critical').length,
      high: open.filter((f) => f.severity === 'high').length,
      open: open.length,
      avgResolutionHours: 4 + (100 - compliance) * 0.25 + (fac.code === 'ST' ? 6 : 0),
      resolved: closed.length,
    };
  });
}

export type HeatCell = { category: string; severity: Severity | 'none'; count: number };

export function heatmap(db: MockDB) {
  const cats: { key: RiskFinding['category']; label: string }[] = [
    { key: 'assessments', label: 'Assessments' },
    { key: 'medication_reconciliation', label: 'Medications' },
    { key: 'orders', label: 'Orders' },
    { key: 'care_plans', label: 'Care Plans' },
    { key: 'notes', label: 'Notes' },
    { key: 'signatures', label: 'Signatures' },
  ];
  return db.facilities.map((fac) => ({
    facility: fac,
    cells: cats.map((c) => {
      const open = db.findings.filter((f) => f.facilityId === fac.id && f.category === c.key && isOpen(f.status));
      const worst = open.reduce<Severity | 'none'>((acc, f) => {
        const rank = { critical: 4, high: 3, medium: 2, low: 1 } as Record<Severity, number>;
        if (acc === 'none') return f.severity;
        return rank[f.severity] > rank[acc] ? f.severity : acc;
      }, 'none');
      return { category: c.label, severity: worst, count: open.length } as HeatCell;
    }),
  }));
}

export interface StaffRow {
  user: MockDB['users'][number];
  compliance: number;
  open: number;
  critical: number;
  overdue: number;
  avgResolutionHours: number;
  trend: 'Improving' | 'Stable' | 'Declining';
}

export function staffPerformance(db: MockDB): StaffRow[] {
  const clinicians = db.users.filter((u) => u.role === 'Nurse' || u.role === 'Director of Nursing' || u.role === 'Charge Nurse');
  return clinicians.map((user) => {
    const assigned = db.findings.filter((f) => f.assignedUserId === user.id);
    const open = assigned.filter((f) => isOpen(f.status));
    const overdue = open.filter((f) => f.isOverdue).length;
    const critical = open.filter((f) => f.severity === 'critical').length;
    const compliance = Math.max(60, 100 - open.length * 2 - overdue * 3);
    const trend: StaffRow['trend'] = compliance >= 92 ? 'Improving' : compliance >= 82 ? 'Stable' : 'Declining';
    return {
      user,
      compliance,
      open: open.length,
      critical,
      overdue,
      avgResolutionHours: 3 + overdue * 1.5,
      trend,
    };
  });
}

export function complianceTrend(range: '7D' | '30D' | '90D') {
  const base = { '7D': [88, 89, 90, 90, 91, 92, 93], '30D': [84, 85, 86, 88, 89, 90, 91, 92], '90D': [79, 81, 83, 85, 86, 88, 89, 91, 93] };
  return base[range].map((v, i) => ({ label: `P${i + 1}`, value: v }));
}
