import { SEVERITY } from '@/utils/severity';
import type { SeverityOrResolved } from '@/types';
import { cn } from '@/utils/cn';

interface Props {
  severity: SeverityOrResolved;
  size?: 'sm' | 'md';
  withDot?: boolean;
  className?: string;
}

/** Severity is always communicated with text, never colour alone (spec §3, §60). */
export function SeverityBadge({ severity, size = 'md', withDot = true, className }: Props) {
  const meta = SEVERITY[severity];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md font-semibold',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs',
        meta.badge,
        className,
      )}
    >
      {withDot && <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} aria-hidden />}
      {meta.label}
    </span>
  );
}
