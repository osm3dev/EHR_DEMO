import { cn } from '@/utils/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-ink-200/80', className)} />;
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
      <div className="border-b border-ink-200 bg-ink-50/60 px-4 py-3">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="divide-y divide-ink-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className={cn('h-4', c === 0 ? 'w-40' : 'w-24')} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('card space-y-3 p-4', className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}
