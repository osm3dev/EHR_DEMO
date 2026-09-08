import { useParams } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { isOpen } from '@/utils/severity';

export function usePatient() {
  const { patientId } = useParams();
  const db = useStore((s) => s.db);
  const patient = db.patients.find((p) => p.id === patientId) ?? null;
  const findings = db.findings.filter((f) => f.patientId === patientId);
  const openFindings = findings.filter((f) => isOpen(f.status));
  return {
    patientId: patientId!,
    patient,
    db,
    findings,
    openFindings,
    criticalCount: openFindings.filter((f) => f.severity === 'critical').length,
  };
}
