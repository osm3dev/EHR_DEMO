import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Props {
  label: string;
  value: string | number;
  delta?: { value: number; direction: 'up' | 'down' | 'flat'; goodWhen?: 'up' | 'down'; suffix?: string };
  hint?: string;
  onClick?: () => void;
  accent?: 'default' | 'critical' | 'warning';
  loading?: boolean;
}

export function MetricCard({ label, value, delta, hint, onClick, accent = 'default', loading }: Props) {
  const Comp = onClick ? 'button' : 'div';
  const good =
    delta && (delta.goodWhen ? delta.direction === delta.goodWhen : delta.direction === 'up');
  const DeltaIcon = delta?.direction === 'up' ? ArrowUpRight : delta?.direction === 'down' ? ArrowDownRight : Minus;

  return (
    <Comp
      onClick={onClick}
      className={cn(
        'card group flex w-full flex-col gap-2 p-4 text-left transition-shadow',
        onClick && 'hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        accent === 'critical' && 'border-red-200 bg-red-50/40',
        accent === 'warning' && 'border-orange-200 bg-orange-50/40',
      )}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</span>
      {loading ? (
        <span className="h-8 w-16 animate-pulse rounded bg-ink-200" />
      ) : (
        <span className="text-2xl font-semibold text-ink-900">{value}</span>
      )}
      <div className="flex items-center gap-2 text-xs">
        {delta && !loading && (
          <span className={cn('inline-flex items-center gap-0.5 font-medium', good ? 'text-green-600' : 'text-red-600')}>
            <DeltaIcon className="h-3.5 w-3.5" />
            {Math.abs(delta.value)}
            {delta.suffix ?? ''}
          </span>
        )}
        {hint && <span className="text-ink-400">{hint}</span>}
      </div>
    </Comp>
  );
}
