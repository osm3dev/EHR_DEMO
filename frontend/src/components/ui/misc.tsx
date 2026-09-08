import type { ReactNode } from 'react';
import { ArrowRight, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { initials } from '@/utils/format';
import { cn } from '@/utils/cn';

export function Avatar({ name, color, size = 32 }: { name: string; color?: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, backgroundColor: color ?? '#0d9488', fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function TrendArrow({ trend, className }: { trend: 'up' | 'down' | 'flat'; className?: string }) {
  if (trend === 'up') return <TrendingUp className={cn('h-4 w-4 text-red-500', className)} aria-label="Increasing" />;
  if (trend === 'down') return <TrendingDown className={cn('h-4 w-4 text-green-600', className)} aria-label="Decreasing" />;
  return <Minus className={cn('h-4 w-4 text-ink-400', className)} aria-label="No change" />;
}

export function SectionCard({
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('card', className)}>
      {(title || action) && (
        <header className="flex items-center justify-between border-b border-ink-200 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink-800">{title}</h2>
          {action}
        </header>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

export function ScoreMeter({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const band = score >= 75 ? 'critical' : score >= 55 ? 'high' : score >= 35 ? 'medium' : 'low';
  const colors = {
    critical: 'text-red-600 bg-red-500',
    high: 'text-orange-600 bg-orange-500',
    medium: 'text-amber-600 bg-amber-500',
    low: 'text-blue-600 bg-blue-500',
  } as const;
  const label = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }[band];
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between">
        <span className={cn('font-semibold', colors[band].split(' ')[0], size === 'lg' ? 'text-2xl' : 'text-lg')}>
          {score}
          <span className="text-sm font-normal text-ink-400"> / 100</span>
        </span>
        <span className={cn('text-xs font-semibold', colors[band].split(' ')[0])}>{label}</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink-100">
        <div className={cn('h-full rounded-full', colors[band].split(' ')[1])} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function LinkArrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 group-hover:gap-1.5">
      {children}
      <ArrowRight className="h-4 w-4 transition-all" />
    </span>
  );
}

export function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-2">
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink-800">{children}</dd>
    </div>
  );
}

export function AiBadge({ label = 'AI-Assisted Finding — Review Required' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-200">
      <span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden />
      {label}
    </span>
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-ink-200">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'relative whitespace-nowrap px-3.5 py-2.5 text-sm font-medium transition-colors',
            active === t.id ? 'text-brand-700' : 'text-ink-500 hover:text-ink-800',
          )}
        >
          {t.label}
          {typeof t.count === 'number' && (
            <span
              className={cn(
                'ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                active === t.id ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500',
              )}
            >
              {t.count}
            </span>
          )}
          {active === t.id && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-600" />}
        </button>
      ))}
    </div>
  );
}
