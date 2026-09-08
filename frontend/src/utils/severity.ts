import type { Severity, SeverityOrResolved, FindingStatus, RiskCategory } from '@/types';

interface SeverityMeta {
  label: string;
  /** Tailwind classes for a soft badge */
  badge: string;
  dot: string;
  text: string;
  bar: string;
  hex: string;
}

export const SEVERITY: Record<SeverityOrResolved, SeverityMeta> = {
  critical: {
    label: 'Critical',
    badge: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
    dot: 'bg-red-600',
    text: 'text-red-700',
    bar: 'bg-red-500',
    hex: '#dc2626',
  },
  high: {
    label: 'High',
    badge: 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200',
    dot: 'bg-orange-500',
    text: 'text-orange-700',
    bar: 'bg-orange-500',
    hex: '#f97316',
  },
  medium: {
    label: 'Medium',
    badge: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    bar: 'bg-amber-500',
    hex: '#f59e0b',
  },
  low: {
    label: 'Low',
    badge: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
    dot: 'bg-blue-500',
    text: 'text-blue-700',
    bar: 'bg-blue-500',
    hex: '#3b82f6',
  },
  resolved: {
    label: 'Resolved',
    badge: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200',
    dot: 'bg-green-600',
    text: 'text-green-700',
    bar: 'bg-green-500',
    hex: '#16a34a',
  },
};

export const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low'];

export const STATUS_META: Record<FindingStatus, { label: string; badge: string }> = {
  detected: { label: 'Detected', badge: 'bg-ink-100 text-ink-700 ring-1 ring-inset ring-ink-200' },
  assigned: { label: 'Assigned', badge: 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200' },
  acknowledged: { label: 'Acknowledged', badge: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200' },
  in_progress: { label: 'In Progress', badge: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200' },
  corrected: { label: 'Corrected', badge: 'bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200' },
  awaiting_verification: {
    label: 'Awaiting Verification',
    badge: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200',
  },
  closed: { label: 'Closed', badge: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200' },
  accepted_exception: {
    label: 'Accepted Exception',
    badge: 'bg-ink-100 text-ink-600 ring-1 ring-inset ring-ink-200',
  },
  false_positive: {
    label: 'False Positive',
    badge: 'bg-ink-100 text-ink-500 ring-1 ring-inset ring-ink-200 line-through',
  },
};

export const CATEGORY_LABEL: Record<RiskCategory, string> = {
  assessments: 'Missing Assessments',
  signatures: 'Missing Signatures',
  care_plans: 'Care Plan Gaps',
  medication_reconciliation: 'Medication Reconciliation',
  orders: 'Orders',
  labs: 'Lab Follow-up',
  notes: 'Notes',
  consent: 'Consent',
};

export const OPEN_STATUSES: FindingStatus[] = [
  'detected',
  'assigned',
  'acknowledged',
  'in_progress',
  'corrected',
  'awaiting_verification',
];

export function isOpen(status: FindingStatus): boolean {
  return OPEN_STATUSES.includes(status);
}
