import { Drawer } from '@/components/ui';
import { useStore } from '@/store/useStore';
import { FindingDetail } from './FindingDetail';

export function FindingDrawer({ findingId, onClose }: { findingId: string | null; onClose: () => void }) {
  const finding = useStore((s) => s.db.findings.find((f) => f.id === findingId));
  return (
    <Drawer open={!!findingId} onClose={onClose} title="Risk Finding" width="xl" subtitle={finding?.id}>
      {finding ? <FindingDetail finding={finding} onNavigateAway={onClose} /> : null}
    </Drawer>
  );
}
