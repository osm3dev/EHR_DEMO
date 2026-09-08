export interface ReportDef {
  id: string;
  name: string;
  description: string;
  group: string;
}

export const REPORTS: ReportDef[] = [
  { id: 'documentation-compliance', name: 'Documentation Compliance', description: 'Compliance rate by facility, unit and period.', group: 'Compliance' },
  { id: 'missing-documentation', name: 'Missing Documentation', description: 'Required documentation not yet started.', group: 'Compliance' },
  { id: 'overdue-documentation', name: 'Overdue Documentation', description: 'Documentation past its required completion time.', group: 'Compliance' },
  { id: 'missing-signatures', name: 'Missing Signatures', description: 'Notes, orders and care plans awaiting signature.', group: 'Compliance' },
  { id: 'assessment-completion', name: 'Assessment Completion', description: 'Completion rate by assessment type.', group: 'Clinical' },
  { id: 'care-plan-compliance', name: 'Care Plan Compliance', description: 'Care plan review cadence adherence.', group: 'Clinical' },
  { id: 'medication-reconciliation', name: 'Medication Reconciliation', description: 'Reconciliation completion within 24h of admission.', group: 'Clinical' },
  { id: 'order-acknowledgement', name: 'Order Acknowledgement', description: 'Time to nursing acknowledgement of orders.', group: 'Clinical' },
  { id: 'risk-by-facility', name: 'Risk by Facility', description: 'Open findings and severity mix by facility.', group: 'Risk' },
  { id: 'risk-by-unit', name: 'Risk by Unit', description: 'Open findings and severity mix by unit.', group: 'Risk' },
  { id: 'risk-by-staff', name: 'Risk by Staff', description: 'Findings assigned, resolved and overdue by clinician.', group: 'Risk' },
  { id: 'risk-by-patient', name: 'Risk by Patient', description: 'Documentation risk score and open findings by patient.', group: 'Risk' },
  { id: 'risk-aging', name: 'Risk Aging', description: 'Age distribution of open findings.', group: 'Risk' },
  { id: 'critical-findings', name: 'Critical Findings', description: 'All critical findings with status and assignment.', group: 'Risk' },
  { id: 'resolution-performance', name: 'Resolution Performance', description: 'Mean time to correction and verification.', group: 'Risk' },
  { id: 'ai-findings', name: 'AI Findings', description: 'AI-assisted findings, acceptance and false-positive rate.', group: 'AI' },
  { id: 'audit-activity', name: 'Audit Activity', description: 'User activity by module and action.', group: 'Governance' },
];
