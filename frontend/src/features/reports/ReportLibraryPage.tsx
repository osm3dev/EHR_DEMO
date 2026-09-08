import { useNavigate } from 'react-router-dom';
import { FileBarChart } from 'lucide-react';
import { PageHeader } from '@/components/ui';
import { REPORTS } from './reportCatalog';

export function ReportLibraryPage() {
  const navigate = useNavigate();
  const groups = [...new Set(REPORTS.map((r) => r.group))];

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Run, filter and export standard documentation and risk reports." crumbs={[{ label: 'Analytics' }, { label: 'Reports' }]} />
      {groups.map((g) => (
        <div key={g}>
          <h2 className="mb-2 text-sm font-semibold text-ink-700">{g}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {REPORTS.filter((r) => r.group === g).map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/reports/${r.id}`)}
                className="card group flex items-start gap-3 p-4 text-left transition-shadow hover:shadow-md"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                  <FileBarChart className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-800">{r.name}</p>
                  <p className="mt-0.5 text-xs text-ink-500">{r.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
