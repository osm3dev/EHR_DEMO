/**
 * Repository layer. Today it reads from the in-memory Zustand store; swapping
 * these functions for `fetch('/api/...')` calls is all that's required to move
 * to the Node/PostgreSQL backend. Feature code imports from here, never from
 * `@/data/mockdb` directly.
 */
import { useStore } from '@/store/useStore';
import type { RiskFinding } from '@/types';

const db = () => useStore.getState().db;

export const patientRepo = {
  list: () => db().patients,
  byId: (id: string) => db().patients.find((p) => p.id === id) ?? null,
};

export const findingRepo = {
  list: () => db().findings,
  byId: (id: string) => db().findings.find((f) => f.id === id) ?? null,
  forPatient: (patientId: string): RiskFinding[] => db().findings.filter((f) => f.patientId === patientId),
};

export const noteRepo = {
  list: () => db().notes,
  forPatient: (patientId: string) => db().notes.filter((n) => n.patientId === patientId),
  byId: (id: string) => db().notes.find((n) => n.id === id) ?? null,
};

export const ruleRepo = {
  list: () => db().riskRules,
  byId: (id: string) => db().riskRules.find((r) => r.id === id) ?? null,
};

export const userRepo = {
  list: () => db().users,
  byId: (id: string) => db().users.find((u) => u.id === id) ?? null,
  name: (id?: string) => db().users.find((u) => u.id === id)?.name ?? '—',
};

export const facilityRepo = {
  list: () => db().facilities,
  byId: (id: string) => db().facilities.find((f) => f.id === id) ?? null,
  name: (id?: string) => db().facilities.find((f) => f.id === id)?.name ?? '—',
};

export const unitRepo = {
  name: (id?: string) => db().units.find((u) => u.id === id)?.name ?? '—',
};
