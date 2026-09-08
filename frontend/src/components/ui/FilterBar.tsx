import { type ReactNode } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface FilterDef {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface Props {
  filters: FilterDef[];
  value: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onReset?: () => void;
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
  right?: ReactNode;
}

export function FilterBar({ filters, value, onChange, onReset, search, right }: Props) {
  const activeCount = Object.values(value).filter((v) => v && v !== 'all').length;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-ink-200 bg-white p-3 shadow-card lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {search && (
          <div className="relative min-w-[220px] flex-1 lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              className="input pl-9"
              placeholder={search.placeholder ?? 'Search...'}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
            />
          </div>
        )}
        {filters.map((f) => (
          <div key={f.key} className="relative">
            <select
              aria-label={f.label}
              className={cn(
                'appearance-none rounded-lg border border-ink-300 bg-white py-2 pl-3 pr-8 text-sm text-ink-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30',
                value[f.key] && value[f.key] !== 'all' && 'border-brand-400 bg-brand-50/50 text-brand-800',
              )}
              value={value[f.key] ?? 'all'}
              onChange={(e) => onChange(f.key, e.target.value)}
            >
              <option value="all">{f.label}: All</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {f.label}: {o.label}
                </option>
              ))}
            </select>
            <SlidersHorizontal className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
          </div>
        ))}
        {activeCount > 0 && onReset && (
          <button onClick={onReset} className="btn-ghost px-2 py-1 text-xs">
            <X className="h-3.5 w-3.5" /> Clear {activeCount}
          </button>
        )}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}
