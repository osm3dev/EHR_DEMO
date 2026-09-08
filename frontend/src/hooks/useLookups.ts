import { useCallback } from 'react';
import { useStore } from '@/store/useStore';

/** Convenience id → display-name resolvers bound to current store state. */
export function useLookups() {
  const db = useStore((s) => s.db);
  return {
    patient: useCallback((id?: string) => db.patients.find((p) => p.id === id), [db.patients]),
    patientName: useCallback((id?: string) => {
      const p = db.patients.find((x) => x.id === id);
      return p ? `${p.firstName} ${p.lastName}` : '—';
    }, [db.patients]),
    user: useCallback((id?: string) => db.users.find((u) => u.id === id), [db.users]),
    userName: useCallback((id?: string) => {
      const u = db.users.find((x) => x.id === id);
      return u ? `${u.name}${u.credentials ? `, ${u.credentials}` : ''}` : 'Unassigned';
    }, [db.users]),
    facilityName: useCallback((id?: string) => db.facilities.find((f) => f.id === id)?.name ?? '—', [db.facilities]),
    unitName: useCallback((id?: string) => db.units.find((u) => u.id === id)?.name ?? '—', [db.units]),
    rule: useCallback((id?: string) => db.riskRules.find((r) => r.id === id), [db.riskRules]),
  };
}
