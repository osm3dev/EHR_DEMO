import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { DataTable, PageHeader, SeverityBadge, type Column } from '@/components/ui';
import { CATEGORY_LABEL } from '@/utils/severity';
import { fmtDate } from '@/utils/format';
import type { RiskRule } from '@/types';
import { cn } from '@/utils/cn';

export function RuleListPage() {
  const navigate = useNavigate();
  const rules = useStore((s) => s.db.riskRules);

  const columns: Column<RiskRule>[] = [
    { key: 'id', header: 'Rule ID', cell: (r) => <span className="font-mono text-xs font-medium text-ink-700">{r.id}</span> },
    { key: 'name', header: 'Rule Name', cell: (r) => <span className="font-medium text-ink-800">{r.name}</span> },
    { key: 'category', header: 'Category', cell: (r) => CATEGORY_LABEL[r.category] },
    { key: 'trigger', header: 'Trigger', cell: (r) => r.trigger },
    { key: 'severity', header: 'Severity', cell: (r) => <SeverityBadge severity={r.severity} size="sm" /> },
    { key: 'scope', header: 'Scope', cell: (r) => r.scope },
    { key: 'type', header: 'Type', cell: (r) => r.evaluationType },
    { key: 'version', header: 'Version', cell: (r) => `v${r.version}` },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium', r.status === 'active' ? 'bg-green-50 text-green-700' : r.status === 'draft' ? 'bg-amber-50 text-amber-700' : 'bg-ink-100 text-ink-500')}>
          {r.status}
        </span>
      ),
    },
    { key: 'updated', header: 'Last Updated', cell: (r) => fmtDate(r.updatedAt) },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Documentation Risk Rules"
        subtitle="Deterministic and AI-assisted rules that continuously evaluate every chart."
        crumbs={[{ label: 'Risk Management' }, { label: 'Risk Rules' }]}
        actions={
          <button className="btn-primary text-sm" onClick={() => navigate('/risk/rules/new')}>
            <Plus className="h-4 w-4" /> Create Rule
          </button>
        }
      />
      <DataTable columns={columns} rows={rules} rowKey={(r) => r.id} onRowClick={(r) => navigate(`/risk/rules/${r.id}`)} empty={{ title: 'No rules', description: 'Create your first documentation risk rule.' }} />
    </div>
  );
}
