import { useStore } from '@/store/useStore';
import { useLookups } from '@/hooks/useLookups';
import { DataTable, EmptyState, MetricCard, PageHeader } from '@/components/ui';
import type { FalsePositiveReview } from '@/types';

export function FalsePositivesPage() {
  const fps = useStore((s) => s.db.falsePositives);
  const resolve = useStore((s) => s.resolveFalsePositive);
  const lk = useLookups();

  const confirmedRate = fps.length ? Math.round((fps.filter((f) => f.status === 'confirmed').length / fps.length) * 100) : 0;

  const columns = [
    { key: 'type', header: 'Finding Type', cell: (f: FalsePositiveReview) => <span className="font-medium text-ink-800">{f.findingType}</span> },
    { key: 'patient', header: 'Patient', cell: (f: FalsePositiveReview) => lk.patientName(f.patientId) },
    { key: 'by', header: 'Submitted By', cell: (f: FalsePositiveReview) => lk.user(f.submittedById)?.name },
    { key: 'reason', header: 'Reason', cell: (f: FalsePositiveReview) => <span className="text-ink-500">{f.reason}</span> },
    { key: 'conf', header: 'AI Confidence', cell: (f: FalsePositiveReview) => `${Math.round(f.aiConfidence * 100)}%` },
    { key: 'status', header: 'Status', cell: (f: FalsePositiveReview) => <span className="capitalize">{f.status}</span> },
    {
      key: 'actions',
      header: '',
      align: 'right' as const,
      cell: (f: FalsePositiveReview) =>
        f.status === 'pending' ? (
          <div className="flex justify-end gap-1.5">
            <button className="btn-secondary px-2 py-1 text-xs" onClick={() => resolve(f.id, 'confirmed')}>
              Confirm False Positive
            </button>
            <button className="btn-ghost px-2 py-1 text-xs" onClick={() => resolve(f.id, 'reinstated')}>
              Reinstate Finding
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="False Positive Review" subtitle="Review disputed AI-assisted findings. Outcomes feed AI quality metrics." crumbs={[{ label: 'Risk Management' }, { label: 'False Positive Review' }]} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Submitted" value={fps.length} />
        <MetricCard label="Confirmed FP Rate" value={`${confirmedRate}%`} />
        <MetricCard label="Pending" value={fps.filter((f) => f.status === 'pending').length} />
        <MetricCard label="Reinstated" value={fps.filter((f) => f.status === 'reinstated').length} />
      </div>
      {fps.length === 0 ? (
        <EmptyState title="No false positive reviews" description="No AI findings have been disputed." />
      ) : (
        <DataTable columns={columns} rows={fps} rowKey={(f) => f.id} />
      )}
      <p className="text-xs text-ink-400">Prototype/demo AI quality data. Not intended for clinical use.</p>
    </div>
  );
}
