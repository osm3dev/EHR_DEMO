import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { useLookups } from '@/hooks/useLookups';
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad';
import { DataTable, FilterBar, PageHeader, type Column, type FilterDef } from '@/components/ui';
import { isOpen } from '@/utils/severity';
import { age, fmtDate } from '@/utils/format';
import { ScoreMeter } from '@/components/ui';
import type { Patient } from '@/types';
import { cn } from '@/utils/cn';

export function PatientDirectory() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const db = useStore((s) => s.db);
  const facilityFilter = useStore((s) => s.facilityFilter);
  const lk = useLookups();
  const loading = useSimulatedLoad(400, [facilityFilter]);

  const statusParam = params.get('status');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({
    unit: 'all',
    nurse: 'all',
    provider: 'all',
    admission: statusParam === 'discharged' ? 'discharged' : statusParam === 'admitted' ? 'admitted' : 'all',
    risk: 'all',
  });

  const filterDefs: FilterDef[] = [
    { key: 'unit', label: 'Unit', options: db.units.map((u) => ({ value: u.id, label: `${lk.facilityName(u.facilityId)} · ${u.name}` })) },
    { key: 'nurse', label: 'Nurse', options: db.users.filter((u) => u.role === 'Nurse').map((u) => ({ value: u.id, label: u.name })) },
    { key: 'provider', label: 'Provider', options: db.users.filter((u) => u.role === 'Physician').map((u) => ({ value: u.id, label: u.name })) },
    { key: 'admission', label: 'Admission', options: [{ value: 'admitted', label: 'Admitted' }, { value: 'observation', label: 'Observation' }, { value: 'discharged', label: 'Discharged' }] },
    { key: 'risk', label: 'Doc Risk', options: [{ value: 'high', label: 'High (65+)' }, { value: 'medium', label: 'Medium (35–64)' }, { value: 'low', label: 'Low (<35)' }] },
  ];

  const rows = useMemo(() => {
    let list = db.patients.slice();
    if (facilityFilter !== 'all') list = list.filter((p) => p.facilityId === facilityFilter);
    if (filters.unit !== 'all') list = list.filter((p) => p.unitId === filters.unit);
    if (filters.nurse !== 'all') list = list.filter((p) => p.primaryNurseId === filters.nurse);
    if (filters.provider !== 'all') list = list.filter((p) => p.attendingId === filters.provider);
    if (filters.admission !== 'all') list = list.filter((p) => p.admissionStatus === filters.admission);
    if (filters.risk === 'high') list = list.filter((p) => p.documentationRiskScore >= 65);
    if (filters.risk === 'medium') list = list.filter((p) => p.documentationRiskScore >= 35 && p.documentationRiskScore < 65);
    if (filters.risk === 'low') list = list.filter((p) => p.documentationRiskScore < 35);
    const t = search.trim().toLowerCase();
    if (t) list = list.filter((p) => `${p.firstName} ${p.lastName}`.toLowerCase().includes(t) || p.mrn.includes(t) || p.dob.includes(t));
    return list.sort((a, b) => b.documentationRiskScore - a.documentationRiskScore);
  }, [db.patients, filters, search, facilityFilter]);

  const openFor = (id: string) => db.findings.filter((f) => f.patientId === id && isOpen(f.status));

  const columns: Column<Patient>[] = [
    {
      key: 'patient',
      header: 'Patient',
      sortValue: (p) => p.lastName,
      cell: (p) => (
        <div>
          <p className="font-medium text-ink-800">
            {p.firstName} {p.lastName}
          </p>
          <p className="text-xs text-ink-400">
            MRN {p.mrn} · {p.sex} {age(p.dob)}y
          </p>
        </div>
      ),
    },
    { key: 'dob', header: 'DOB', cell: (p) => fmtDate(p.dob) },
    { key: 'facility', header: 'Facility / Unit', cell: (p) => `${lk.facilityName(p.facilityId)} · ${lk.unitName(p.unitId)}` },
    { key: 'provider', header: 'Provider', cell: (p) => lk.user(p.attendingId)?.name },
    { key: 'nurse', header: 'Primary Nurse', cell: (p) => lk.user(p.primaryNurseId)?.name },
    { key: 'admit', header: 'Admitted', sortValue: (p) => p.admissionDate, cell: (p) => fmtDate(p.admissionDate) },
    {
      key: 'compliance',
      header: 'Compliance',
      align: 'right',
      sortValue: (p) => p.documentationCompliance,
      cell: (p) => <span className="font-medium text-ink-700">{p.documentationCompliance}%</span>,
    },
    {
      key: 'findings',
      header: 'Open / Critical',
      align: 'center',
      sortValue: (p) => openFor(p.id).length,
      cell: (p) => {
        const open = openFor(p.id);
        const crit = open.filter((f) => f.severity === 'critical').length;
        return (
          <span className="inline-flex items-center gap-1.5 text-sm">
            <span className="rounded-md bg-ink-100 px-1.5 font-semibold text-ink-700">{open.length}</span>
            {crit > 0 && <span className="rounded-md bg-red-100 px-1.5 font-semibold text-red-700">{crit}</span>}
          </span>
        );
      },
    },
    {
      key: 'risk',
      header: 'Doc Risk',
      sortValue: (p) => p.documentationRiskScore,
      cell: (p) => (
        <div className="w-28">
          <ScoreMeter score={p.documentationRiskScore} size="sm" />
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (p) => (
        <span
          className={cn(
            'rounded-md px-2 py-0.5 text-xs font-medium',
            p.admissionStatus === 'admitted' ? 'bg-brand-50 text-brand-700' : p.admissionStatus === 'observation' ? 'bg-blue-50 text-blue-700' : 'bg-ink-100 text-ink-500',
          )}
        >
          {p.admissionStatus[0].toUpperCase() + p.admissionStatus.slice(1)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Patients" subtitle={`${rows.length} patients in current scope`} crumbs={[{ label: 'Patients' }]} />
      <FilterBar
        filters={filterDefs}
        value={filters}
        onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
        onReset={() => setFilters({ unit: 'all', nurse: 'all', provider: 'all', admission: 'all', risk: 'all' })}
        search={{ value: search, onChange: setSearch, placeholder: 'Search by name, MRN or DOB…' }}
      />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(p) => p.id}
        onRowClick={(p) => navigate(`/patients/${p.id}`)}
        loading={loading}
        empty={{ title: 'No patients found', description: 'Adjust your search or filters to see patients.' }}
        mobileCard={(p) => (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="font-medium text-ink-800">
                {p.firstName} {p.lastName}
              </p>
              <span className="text-xs text-ink-400">MRN {p.mrn}</span>
            </div>
            <p className="text-sm text-ink-500">
              {lk.facilityName(p.facilityId)} · {lk.unitName(p.unitId)}
            </p>
            <ScoreMeter score={p.documentationRiskScore} size="sm" />
          </div>
        )}
      />
    </div>
  );
}
