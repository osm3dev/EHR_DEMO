import { type ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import { EmptyState } from './EmptyState';
import { TableSkeleton } from './Skeleton';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  align?: 'left' | 'right' | 'center';
  className?: string;
  hideOnMobile?: boolean;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  empty?: { title: string; description?: string; icon?: ReactNode };
  /** Renders each row as a card on small screens */
  mobileCard?: (row: T) => ReactNode;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  loading,
  empty,
  mobileCard,
  selectable,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: Props<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);

  const sorted = (() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  })();

  if (loading) return <TableSkeleton rows={6} cols={columns.length} />;
  if (!rows.length && empty)
    return <EmptyState title={empty.title} description={empty.description} icon={empty.icon} />;

  const allSelected = selectable && selectedIds && rows.length > 0 && rows.every((r) => selectedIds.has(rowKey(r)));

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto rounded-xl border border-ink-200 bg-white shadow-card md:block">
        <table className="w-full border-collapse">
          <thead className="border-b border-ink-200 bg-ink-50/60">
            <tr>
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={!!allSelected}
                    onChange={onToggleSelectAll}
                    className="rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                  />
                </th>
              )}
              {columns.map((col) => {
                const active = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    className={cn('th', col.align === 'right' && 'text-right', col.align === 'center' && 'text-center', col.className)}
                  >
                    {col.sortValue ? (
                      <button
                        className="inline-flex items-center gap-1 hover:text-ink-800"
                        onClick={() =>
                          setSort((s) =>
                            s?.key === col.key ? { key: col.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: col.key, dir: 'asc' },
                          )
                        }
                      >
                        {col.header}
                        {active ? (
                          sort!.dir === 'asc' ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )
                        ) : null}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {sorted.map((row) => {
              const key = rowKey(row);
              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn('bg-white transition-colors', onRowClick && 'cursor-pointer hover:bg-brand-50/40')}
                >
                  {selectable && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select row ${key}`}
                        checked={!!selectedIds?.has(key)}
                        onChange={() => onToggleSelect?.(key)}
                        className="rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('td', col.align === 'right' && 'text-right', col.align === 'center' && 'text-center', col.className)}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {sorted.map((row) => (
          <div
            key={rowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn('card p-4', onRowClick && 'cursor-pointer active:bg-brand-50/40')}
          >
            {mobileCard ? mobileCard(row) : columns.map((c) => (
              <div key={c.key} className="flex justify-between gap-4 py-1 text-sm">
                <span className="text-ink-500">{c.header}</span>
                <span className="text-right text-ink-800">{c.cell(row)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
