import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { EmptyState, PageHeader } from '@/components/ui';
import { FindingDetail } from './FindingDetail';

export function FindingDetailPage() {
  const { findingId } = useParams();
  const navigate = useNavigate();
  const finding = useStore((s) => s.db.findings.find((f) => f.id === findingId));

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="btn-ghost -ml-2 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <PageHeader title="Risk Finding" crumbs={[{ label: 'Risk Management', to: '/risk/inbox' }, { label: 'Finding' }]} />
      {finding ? (
        <div className="mx-auto max-w-3xl rounded-xl border border-ink-200 bg-white p-6 shadow-card">
          <FindingDetail finding={finding} />
        </div>
      ) : (
        <EmptyState title="Finding not found" description="This finding may have been closed or reassigned." />
      )}
    </div>
  );
}
