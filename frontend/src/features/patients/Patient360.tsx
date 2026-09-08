import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeft, TriangleAlert } from 'lucide-react';
import { usePatient } from './usePatient';
import { useLookups } from '@/hooks/useLookups';
import { Avatar, EmptyState, ScoreMeter } from '@/components/ui';
import { age, fmtDate } from '@/utils/format';
import { cn } from '@/utils/cn';

const TABS = [
  { to: '.', label: 'Overview', end: true },
  { to: 'timeline', label: 'Timeline' },
  { to: 'notes', label: 'Notes' },
  { to: 'assessments', label: 'Assessments' },
  { to: 'care-plan', label: 'Care Plan' },
  { to: 'medications', label: 'Medications' },
  { to: 'mar', label: 'MAR' },
  { to: 'orders', label: 'Orders' },
  { to: 'labs', label: 'Labs' },
  { to: 'vitals', label: 'Vitals' },
  { to: 'documents', label: 'Documents' },
  { to: 'risk', label: 'Risk & Compliance' },
  { to: 'ask', label: 'Ask the Chart' },
  { to: 'audit', label: 'Audit History' },
];

export function Patient360() {
  const navigate = useNavigate();
  const { patient, openFindings, criticalCount } = usePatient();
  const lk = useLookups();

  if (!patient)
    return <EmptyState title="Patient not found" description="This record may have been discharged or archived." />;

  const name = `${patient.firstName} ${patient.lastName}`;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/patients')} className="btn-ghost -ml-2 text-sm">
        <ArrowLeft className="h-4 w-4" /> Patient Directory
      </button>

      {/* Alert strip */}
      {(patient.allergies.length > 0 || criticalCount > 0) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          <TriangleAlert className="h-4 w-4" />
          {patient.allergies.map((a) => (
            <span key={a.substance} className="font-medium">
              Allergy: {a.substance} ({a.reaction})
            </span>
          ))}
          {criticalCount > 0 && (
            <span className="font-medium">
              {criticalCount} Critical Documentation Finding{criticalCount === 1 ? '' : 's'}
            </span>
          )}
        </div>
      )}

      {/* Header card */}
      <div className="card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={name} size={52} />
            <div>
              <h1 className="text-lg font-semibold text-ink-900">{name}</h1>
              <p className="text-sm text-ink-500">
                {patient.sex === 'F' ? 'Female' : 'Male'} · {age(patient.dob)}y · MRN {patient.mrn} · DOB {fmtDate(patient.dob)}
              </p>
              <p className="mt-0.5 text-xs text-ink-400">
                {lk.facilityName(patient.facilityId)} · {lk.unitName(patient.unitId)} · Room {patient.room} · Attending{' '}
                {lk.user(patient.attendingId)?.name} · Primary Nurse {lk.user(patient.primaryNurseId)?.name}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[520px]">
            <div className="rounded-lg border border-ink-200 p-3">
              <p className="text-[11px] uppercase tracking-wide text-ink-400">Documentation Risk</p>
              <div className="mt-1">
                <ScoreMeter score={patient.documentationRiskScore} size="sm" />
              </div>
            </div>
            <Metric label="Doc Compliance" value={`${patient.documentationCompliance}%`} />
            <Metric label="Open Findings" value={openFindings.length} />
            <Metric label="Critical" value={criticalCount} tone={criticalCount > 0 ? 'danger' : 'default'} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-ink-200">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              cn(
                'relative whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'text-brand-700' : 'text-ink-500 hover:text-ink-800',
              )
            }
          >
            {({ isActive }) => (
              <>
                {t.label}
                {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-600" />}
              </>
            )}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
}

function Metric({ label, value, tone = 'default' }: { label: string; value: string | number; tone?: 'default' | 'danger' }) {
  return (
    <div className="rounded-lg border border-ink-200 p-3">
      <p className="text-[11px] uppercase tracking-wide text-ink-400">{label}</p>
      <p className={cn('mt-1 text-xl font-semibold', tone === 'danger' ? 'text-red-600' : 'text-ink-900')}>{value}</p>
    </div>
  );
}
