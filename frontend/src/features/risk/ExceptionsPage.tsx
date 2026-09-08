import { useStore } from '@/store/useStore';
import { useLookups } from '@/hooks/useLookups';
import { EmptyState, PageHeader, SectionCard } from '@/components/ui';
import { fmtDateTime } from '@/utils/format';

export function ExceptionsPage() {
  const exceptions = useStore((s) => s.db.exceptions);
  const findings = useStore((s) => s.db.findings);
  const resolveException = useStore((s) => s.resolveException);
  const lk = useLookups();

  return (
    <div className="space-y-4">
      <PageHeader title="Exceptions" subtitle="Requests to accept a documentation deficiency as non-applicable." crumbs={[{ label: 'Risk Management' }, { label: 'Exceptions' }]} />
      {exceptions.length === 0 && <EmptyState title="No exception requests" description="There are no pending requests to review." />}
      {exceptions.map((ex) => {
        const finding = findings.find((f) => f.id === ex.findingId);
        return (
          <SectionCard
            key={ex.id}
            title={finding?.title ?? 'Documentation finding'}
            action={<span className="text-xs text-ink-400">{fmtDateTime(ex.createdAt)}</span>}
          >
            <dl className="grid gap-3 sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase text-ink-400">Patient</dt>
                <dd className="text-sm text-ink-800">{lk.patientName(ex.patientId)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-ink-400">Requested by</dt>
                <dd className="text-sm text-ink-800">{lk.user(ex.requestedById)?.name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-ink-400">Status</dt>
                <dd className="text-sm font-medium capitalize text-ink-800">{ex.status.replace('_', ' ')}</dd>
              </div>
              <div className="sm:col-span-3">
                <dt className="text-xs uppercase text-ink-400">Reason</dt>
                <dd className="text-sm text-ink-700">{ex.reason}</dd>
              </div>
            </dl>

            <div className="mt-3">
              <p className="mb-1 text-xs font-semibold uppercase text-ink-400">History</p>
              <ul className="space-y-1 text-xs text-ink-500">
                {ex.history.map((h, i) => (
                  <li key={i}>
                    {fmtDateTime(h.at)} — {h.action} ({lk.user(h.actorId)?.name})
                  </li>
                ))}
              </ul>
            </div>

            {ex.status === 'pending' && (
              <div className="mt-4 flex gap-2">
                <button className="btn-primary text-sm" onClick={() => resolveException(ex.id, 'approved')}>
                  Approve Exception
                </button>
                <button className="btn-secondary text-sm" onClick={() => resolveException(ex.id, 'rejected')}>
                  Reject
                </button>
                <button className="btn-ghost text-sm" onClick={() => resolveException(ex.id, 'info_requested')}>
                  Request Information
                </button>
              </div>
            )}
          </SectionCard>
        );
      })}
    </div>
  );
}
