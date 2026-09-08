import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, PanelLeftClose, ShieldCheck } from 'lucide-react';
import { NAV } from './navigation';
import { useStore } from '@/store/useStore';
import { computeKpis } from '@/store/selectors';
import { cn } from '@/utils/cn';

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const db = useStore((s) => s.db);
  const facilityFilter = useStore((s) => s.facilityFilter);
  const currentUser = useStore((s) => s.currentUser);
  const kpis = computeKpis(db, facilityFilter);
  const myTasks = db.tasks.filter((t) => t.assignedToId === currentUser?.id && t.status !== 'completed').length;
  const openInbox = db.findings.filter((f) => ['detected', 'assigned', 'acknowledged', 'in_progress', 'corrected', 'awaiting_verification'].includes(f.status)).length;

  const location = useLocation();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const badgeValue = (b?: string) =>
    b === 'critical' ? kpis.criticalFindings : b === 'openInbox' ? openInbox : b === 'myTasks' ? myTasks : undefined;

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-ink-200 bg-white">
      <div className="flex items-center gap-2.5 border-b border-ink-200 px-4 py-3.5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-900">Sentinel EHR</p>
          <p className="truncate text-[11px] text-ink-400">Documentation Risk Intelligence</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="btn-ghost p-1.5 lg:hidden" aria-label="Close navigation">
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="border-b border-ink-200 px-4 py-2.5">
        <label className="sr-only" htmlFor="org-select">
          Organization
        </label>
        <select id="org-select" className="input py-1.5 text-xs" defaultValue={db.org.id}>
          <option value={db.org.id}>{db.org.name}</option>
        </select>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {NAV.map((section) => {
          const isCollapsed = collapsed[section.id];
          const sectionActive = section.items.some((i) => location.pathname === i.to.split('?')[0]);
          return (
            <div key={section.id}>
              <button
                onClick={() => setCollapsed((c) => ({ ...c, [section.id]: !c[section.id] }))}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold uppercase tracking-wide transition-colors',
                  sectionActive ? 'text-brand-700' : 'text-ink-400 hover:text-ink-600',
                )}
              >
                <section.icon className="h-4 w-4" />
                <span className="flex-1 text-left">{section.label}</span>
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isCollapsed && '-rotate-90')} />
              </button>
              {!isCollapsed && (
                <div className="mb-1 mt-0.5 space-y-0.5 pl-2">
                  {section.items.map((item) => {
                    const badge = badgeValue(item.badge);
                    return (
                      <NavLink
                        key={item.to + item.label}
                        to={item.to}
                        end={item.to === '/dashboard'}
                        onClick={onClose}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors',
                            isActive
                              ? 'bg-brand-50 font-medium text-brand-800'
                              : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
                          )
                        }
                      >
                        <span className="flex-1 truncate">{item.label}</span>
                        {typeof badge === 'number' && badge > 0 && (
                          <span
                            className={cn(
                              'rounded-full px-1.5 text-[11px] font-semibold',
                              item.badge === 'critical' ? 'bg-red-100 text-red-700' : 'bg-ink-100 text-ink-600',
                            )}
                          >
                            {badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-ink-200 px-4 py-2.5 text-[11px] leading-tight text-ink-400">
        Prototype environment using synthetic demonstration data. Not intended for clinical use.
      </div>
    </aside>
  );
}
