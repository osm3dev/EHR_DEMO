import { STATUS_META } from '@/utils/severity';
import type { FindingStatus } from '@/types';
import { cn } from '@/utils/cn';

export function StatusBadge({ status, className }: { status: FindingStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold', meta.badge, className)}>
      {meta.label}
    </span>
  );
}
