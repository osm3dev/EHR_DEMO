import type { Severity } from '@/types';

/** Prototype priority scoring — see spec §68. */
export const SEVERITY_BASE: Record<Severity, number> = {
  critical: 70,
  high: 50,
  medium: 30,
  low: 10,
};

export interface ScoreInputs {
  severity: Severity;
  overduePoints: number; // 0-15
  patientSafetyPoints: number; // 0-10
  repeatDeficiencyPoints: number; // 0-5
}

export function computePriorityScore(i: ScoreInputs): {
  total: number;
  breakdown: { label: string; points: number }[];
} {
  const breakdown = [
    { label: `Base severity (${i.severity})`, points: SEVERITY_BASE[i.severity] },
    { label: 'Overdue duration', points: clamp(i.overduePoints, 0, 15) },
    { label: 'Patient safety relevance', points: clamp(i.patientSafetyPoints, 0, 10) },
    { label: 'Repeat deficiency', points: clamp(i.repeatDeficiencyPoints, 0, 5) },
  ];
  const total = Math.min(
    100,
    breakdown.reduce((s, b) => s + b.points, 0),
  );
  return { total, breakdown };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
