import { useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useLookups } from '@/hooks/useLookups';
import { DataTable, Drawer, EmptyState, FilterBar, MetricCard, PageHeader, SectionCard, ConfirmDialog } from '@/components/ui';
import { fmtDate, fmtDateTime, fromNow } from '@/utils/format';
import type { AuditEvent } from '@/types';
import { cn } from '@/utils/cn';

/* ---------------------------------- Users -------------------------------- */
export function UsersPage() {
  const db = useStore((s) => s.db);
  const lk = useLookups();
  return (
    <div className="space-y-4">
      <PageHeader title="Users" crumbs={[{ label: 'Administration' }, { label: 'Users' }]} actions={<button className="btn-primary text-sm">Add User</button>} />
      <DataTable
        columns={[
          { key: 'n', header: 'Name', cell: (u: (typeof db.users)[number]) => <span className="font-medium text-ink-800">{u.name}{u.credentials ? `, ${u.credentials}` : ''}</span> },
          { key: 'r', header: 'Role', cell: (u) => u.role },
          { key: 'f', header: 'Facility', cell: (u) => lk.facilityName(u.facilityId) },
          { key: 'u', header: 'Unit', cell: (u) => (u.unitId ? lk.unitName(u.unitId) : '—') },
          { key: 'e', header: 'Email', cell: (u) => <span className="text-ink-500">{u.email}</span> },
          { key: 's', header: 'Status', cell: (u) => <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium', u.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-ink-100 text-ink-500')}>{u.status}</span> },
          { key: 'l', header: 'Last Login', cell: (u) => fromNow(u.lastLogin) },
        ]}
        rows={db.users}
        rowKey={(u) => u.id}
      />
    </div>
  );
}

/* ----------------------------- Roles & Permissions --------------------- */
const PERMISSIONS = [
  'View Patient',
  'Edit Patient',
  'Create Notes',
  'Sign Notes',
  'Add Addendum',
  'View Risk',
  'Assign Risk',
  'Verify Risk',
  'Manage Rules',
  'View Staff Analytics',
  'Export Reports',
  'View Audit Logs',
  'Manage Users',
];
const ROLE_COLS = ['Nurse', 'Physician', 'DON', 'Compliance', 'Administrator'];
const MATRIX: Record<string, boolean[]> = {
  'View Patient': [true, true, true, true, true],
  'Edit Patient': [true, true, false, false, true],
  'Create Notes': [true, true, false, false, false],
  'Sign Notes': [true, true, false, false, false],
  'Add Addendum': [true, true, false, false, false],
  'View Risk': [true, true, true, true, true],
  'Assign Risk': [false, false, true, true, false],
  'Verify Risk': [false, false, true, true, false],
  'Manage Rules': [false, false, true, false, true],
  'View Staff Analytics': [false, false, true, true, true],
  'Export Reports': [false, false, true, true, true],
  'View Audit Logs': [false, false, true, true, true],
  'Manage Users': [false, false, false, false, true],
};

export function RolesPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Roles & Permissions" crumbs={[{ label: 'Administration' }, { label: 'Roles & Permissions' }]} />
      <SectionCard title="Permission matrix" bodyClassName="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-ink-50/60">
            <tr>
              <th className="th">Permission</th>
              {ROLE_COLS.map((r) => (
                <th key={r} className="th text-center">
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {PERMISSIONS.map((p) => (
              <tr key={p}>
                <td className="td font-medium text-ink-800">{p}</td>
                {MATRIX[p].map((allowed, i) => (
                  <td key={i} className="td text-center">
                    {allowed ? (
                      <span className="inline-block rounded bg-green-100 px-1.5 text-xs font-semibold text-green-700">Allow</span>
                    ) : (
                      <span className="text-ink-300">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

/* ------------------------------- Facilities --------------------------- */
export function FacilitiesPage() {
  const db = useStore((s) => s.db);
  return (
    <div className="space-y-4">
      <PageHeader title="Facilities" crumbs={[{ label: 'Administration' }, { label: 'Facilities' }]} />
      <DataTable
        columns={[
          { key: 'n', header: 'Facility', cell: (f: (typeof db.facilities)[number]) => <span className="font-medium text-ink-800">{f.name}</span> },
          { key: 'c', header: 'Code', cell: (f) => f.code },
          { key: 'loc', header: 'Location', cell: (f) => `${f.city}, ${f.state}` },
          { key: 'u', header: 'Units', cell: (f) => db.units.filter((u) => u.facilityId === f.id).length },
          { key: 'p', header: 'Patients', cell: (f) => db.patients.filter((p) => p.facilityId === f.id).length },
        ]}
        rows={db.facilities}
        rowKey={(f) => f.id}
      />
    </div>
  );
}

export function UnitsPage() {
  const db = useStore((s) => s.db);
  const lk = useLookups();
  return (
    <div className="space-y-4">
      <PageHeader title="Units" crumbs={[{ label: 'Administration' }, { label: 'Units' }]} />
      <DataTable
        columns={[
          { key: 'n', header: 'Unit', cell: (u: (typeof db.units)[number]) => <span className="font-medium text-ink-800">{u.name}</span> },
          { key: 'f', header: 'Facility', cell: (u) => lk.facilityName(u.facilityId) },
          { key: 't', header: 'Type', cell: (u) => u.type },
          { key: 'b', header: 'Beds', cell: (u) => u.beds },
        ]}
        rows={db.units}
        rowKey={(u) => u.id}
      />
    </div>
  );
}

export function TemplatesPage() {
  const templates = [
    { name: 'Nursing Progress Note', fields: 7, updated: '2026-08-20' },
    { name: 'Admission Assessment', fields: 24, updated: '2026-08-11' },
    { name: 'Fall Risk Assessment', fields: 9, updated: '2026-07-30' },
    { name: 'CHF Care Plan', fields: 12, updated: '2026-08-02' },
    { name: 'Discharge Summary', fields: 15, updated: '2026-06-19' },
  ];
  return (
    <div className="space-y-4">
      <PageHeader title="Clinical Templates" crumbs={[{ label: 'Administration' }, { label: 'Clinical Templates' }]} actions={<button className="btn-primary text-sm">New Template</button>} />
      <DataTable
        columns={[
          { key: 'n', header: 'Template', cell: (t: (typeof templates)[number]) => <span className="font-medium text-ink-800">{t.name}</span> },
          { key: 'f', header: 'Fields', cell: (t) => t.fields },
          { key: 'u', header: 'Last Updated', cell: (t) => fmtDate(t.updated) },
        ]}
        rows={templates}
        rowKey={(t) => t.name}
      />
    </div>
  );
}

export function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState({ critical: true, overdue: true, digest: true, ai: false });
  return (
    <div className="space-y-4">
      <PageHeader title="Notification Settings" crumbs={[{ label: 'Administration' }, { label: 'Notification Settings' }]} />
      <SectionCard title="Delivery preferences">
        <ul className="divide-y divide-ink-100">
          {[
            ['critical', 'Critical finding detected or escalated', 'Immediate push + email'],
            ['overdue', 'Documentation becomes overdue', 'Email to assignee and charge nurse'],
            ['digest', 'Morning Clinical Risk Brief', 'Daily at 06:30 to nurse leaders'],
            ['ai', 'AI-assisted finding requires review', 'In-app only'],
          ].map(([key, label, detail]) => (
            <li key={key} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-ink-800">{label}</p>
                <p className="text-xs text-ink-500">{detail}</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={prefs[key as keyof typeof prefs]}
                  onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))}
                />
                <div className="h-5 w-9 rounded-full bg-ink-200 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-brand-600 peer-checked:after:translate-x-4" />
              </label>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}

/* ------------------------------ Audit Logs --------------------------- */
export function AuditLogsPage() {
  const events = useStore((s) => s.db.auditEvents);
  const [filters, setFilters] = useState({ module: 'all', action: 'all' });
  const [drawer, setDrawer] = useState<AuditEvent | null>(null);

  const filtered = useMemo(
    () =>
      events
        .filter((e) => filters.module === 'all' || e.module === filters.module)
        .filter((e) => filters.action === 'all' || e.action === filters.action)
        .slice()
        .sort((a, b) => b.at.localeCompare(a.at)),
    [events, filters],
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Audit Logs" subtitle="Every access and change is recorded." crumbs={[{ label: 'Administration' }, { label: 'Audit Logs' }]} />
      <FilterBar
        filters={[
          { key: 'module', label: 'Module', options: [...new Set(events.map((e) => e.module))].map((m) => ({ value: m, label: m })) },
          { key: 'action', label: 'Action', options: [...new Set(events.map((e) => e.action))].map((a) => ({ value: a, label: a })) },
        ]}
        value={filters}
        onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
        onReset={() => setFilters({ module: 'all', action: 'all' })}
      />
      <DataTable
        columns={[
          { key: 'at', header: 'Timestamp', cell: (e) => fmtDateTime(e.at) },
          { key: 'u', header: 'User', cell: (e) => <span className="font-medium text-ink-800">{e.userName}</span> },
          { key: 'r', header: 'Role', cell: (e) => e.role },
          { key: 'a', header: 'Action', cell: (e) => e.action },
          { key: 'm', header: 'Module', cell: (e) => e.module },
          { key: 'd', header: 'Details', cell: (e) => <span className="text-ink-500">{e.details}</span> },
          { key: 'ip', header: 'IP', cell: (e) => <span className="font-mono text-xs text-ink-400">{e.ip}</span> },
        ]}
        rows={filtered}
        rowKey={(e) => e.id}
        onRowClick={(e) => setDrawer(e)}
        empty={{ title: 'No audit events', description: 'No activity matches these filters.' }}
      />
      <Drawer open={!!drawer} onClose={() => setDrawer(null)} title="Audit event" subtitle={drawer?.id} width="md">
        {drawer && (
          <dl className="space-y-3 text-sm">
            {Object.entries({
              Timestamp: fmtDateTime(drawer.at),
              User: drawer.userName,
              Role: drawer.role,
              Action: drawer.action,
              Module: drawer.module,
              Entity: drawer.entity,
              Details: drawer.details,
              'IP Address': drawer.ip,
              Session: drawer.session,
            }).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-ink-100 pb-2">
                <dt className="text-ink-400">{k}</dt>
                <dd className="text-right font-medium text-ink-800">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </Drawer>
    </div>
  );
}

/* ----------------------------- AI Governance ------------------------- */
export function AIGovernancePage() {
  const ai = useStore((s) => s.db.aiAnalyses);
  return (
    <div className="space-y-6">
      <PageHeader title="AI Governance" subtitle="Oversight of AI-assisted documentation capabilities." crumbs={[{ label: 'Administration' }, { label: 'AI Governance' }]} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ai.map((a) => (
          <SectionCard key={a.id} title={a.feature}>
            <p className="text-sm text-ink-600">{a.purpose}</p>
            <dl className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between"><dt className="text-ink-400">Status</dt><dd className="font-medium text-green-700">Active</dd></div>
              <div className="flex justify-between"><dt className="text-ink-400">Model</dt><dd className="text-ink-700">{a.model}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-400">Last Validation</dt><dd className="text-ink-700">{fmtDate(a.lastValidation)}</dd></div>
            </dl>
          </SectionCard>
        ))}
      </div>

      <SectionCard title="AI Features" bodyClassName="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-ink-50/60">
            <tr>
              {['AI Feature', 'Model', 'Version', 'Purpose', 'Validation', 'Facilities', 'Status'].map((h) => (
                <th key={h} className="th">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {ai.map((a) => (
              <tr key={a.id}>
                <td className="td font-medium text-ink-800">{a.feature}</td>
                <td className="td">{a.model}</td>
                <td className="td">{a.version}</td>
                <td className="td text-ink-500">{a.purpose}</td>
                <td className="td">{fmtDate(a.lastValidation)}</td>
                <td className="td">{a.enabledFacilityIds.length} of 3</td>
                <td className="td"><span className="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Active</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard title="AI Quality Metrics (prototype / demo data)">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard label="Finding acceptance" value="83%" />
          <MetricCard label="False positive rate" value="11%" />
          <MetricCard label="Evidence accuracy" value="94%" />
          <MetricCard label="Reviewer agreement" value="88%" />
        </div>
        <p className="mt-3 text-xs text-ink-400">These metrics are illustrative demonstration data and do not reflect a validated model.</p>
      </SectionCard>
    </div>
  );
}

export function SystemSettingsPage() {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="space-y-4">
      <PageHeader title="System Settings" crumbs={[{ label: 'Administration' }, { label: 'System Settings' }]} />
      <SectionCard title="Environment">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-ink-100 pb-2"><dt className="text-ink-400">Environment</dt><dd className="font-medium">Prototype / Demo</dd></div>
          <div className="flex justify-between border-b border-ink-100 pb-2"><dt className="text-ink-400">Data source</dt><dd className="font-medium">Synthetic dataset (local)</dd></div>
          <div className="flex justify-between border-b border-ink-100 pb-2"><dt className="text-ink-400">Rule evaluation interval</dt><dd className="font-medium">Continuous (event-driven)</dd></div>
          <div className="flex justify-between"><dt className="text-ink-400">Backend target</dt><dd className="font-medium">Node.js + PostgreSQL (see /backend)</dd></div>
        </dl>
      </SectionCard>
      <SectionCard title="Emergency access">
        <p className="text-sm text-ink-600">Break-glass access grants temporary elevated permissions and is fully audited.</p>
        <button className="btn-danger mt-3 text-sm" onClick={() => setConfirm(true)}>
          Use Emergency Access
        </button>
      </SectionCard>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {}}
        title="Confirm emergency access"
        message="Break-glass access is logged and reviewed by Compliance. Only proceed if you have a legitimate clinical need."
        tone="danger"
        confirmLabel="Confirm Emergency Access"
        requireReason
        requireCheckbox="I understand this action is audited and reported to Compliance."
      />
    </div>
  );
}
