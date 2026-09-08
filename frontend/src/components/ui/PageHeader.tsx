import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  to?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  crumbs?: Crumb[];
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, crumbs, actions }: Props) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        {crumbs && crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-1 text-xs text-ink-400">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                {c.to ? (
                  <Link to={c.to} className="hover:text-ink-700">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-ink-500">{c.label}</span>
                )}
                {i < crumbs.length - 1 && <ChevronRight className="h-3 w-3" />}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-xl font-semibold text-ink-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
