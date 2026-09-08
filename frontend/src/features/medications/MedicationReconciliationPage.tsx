import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useLookups } from '@/hooks/useLookups';
import { ConfirmDialog, EmptyState, SectionCard } from '@/components/ui';
import { overdueLabel } from '@/utils/format';
import { cn } from '@/utils/cn';

const DECISIONS = ['continue', 'change', 'discontinue', 'add'] as const;

export function MedicationReconciliationPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const lk = useLookups();
  const now = useStore((s) => s.now);
  const recon = useStore((s) => s.db.reconciliations.find((r) => r.patientId === patientId));
  const allMeds = useStore((s) => s.db.medications);
  const meds = allMeds.filter((m) => m.patientId === patientId);
  const completeReconciliation = useStore((s) => s.completeReconciliation);
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);

  if (!recon) return <EmptyState title="No reconciliation record" description="This patient has no admission medication reconciliation." />;

  const done = recon.status === 'complete';
  const due = overdueLabel(recon.dueAt, now);
  const allDecided = recon.items.every((it) => decisions[it.medicationName] || it.decision);

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(`/patients/${patientId}/medications`)} className="btn-ghost -ml-2 text-sm">
        <ArrowLeft className="h-4 w-4" /> Medications
      </button>

      <div
        className={cn(
          'flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between',
          done ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50',
        )}
      >
        <div>
          <p className={cn('text-sm font-semibold', done ? 'text-green-800' : 'text-red-800')}>
            Medication Reconciliation — {done ? 'COMPLETE' : recon.status.replace('_', ' ').toUpperCase()}
          </p>
          <p className={cn('text-sm', done ? 'text-green-700' : 'text-red-700')}>
            {done ? `Completed by ${lk.user(recon.completedById)?.name}` : due.overdue ? `Overdue by ${due.label.replace('Overdue ', '')}` : due.label}
          </p>
        </div>
        {done && <CheckCircle2 className="h-6 w-6 text-green-600" />}
      </div>

      <SectionCard title="Reconcile home medications against the current inpatient list">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="pb-2 font-semibold">Previous / Home Medication</th>
                <th className="px-3 pb-2 font-semibold"></th>
                <th className="pb-2 font-semibold">Current Inpatient Order</th>
                <th className="pb-2 pl-4 font-semibold">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {recon.items.map((it) => {
                const current = meds.find((m) => it.medicationName.toLowerCase().startsWith(m.name.toLowerCase()));
                const decision = decisions[it.medicationName] || it.decision || '';
                return (
                  <tr key={it.medicationName}>
                    <td className="py-3 text-ink-700">{it.medicationName}</td>
                    <td className="px-3 py-3 text-ink-300">
                      <ArrowRight className="h-4 w-4" />
                    </td>
                    <td className="py-3 text-ink-700">
                      {current ? `${current.name} ${current.dose} ${current.route} ${current.frequency}` : <span className="text-amber-700">Not currently ordered</span>}
                    </td>
                    <td className="py-3 pl-4">
                      {done ? (
                        <span className="rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">{decision || 'continue'}</span>
                      ) : (
                        <select
                          className="input py-1.5 text-xs"
                          value={decision}
                          onChange={(e) => setDecisions((d) => ({ ...d, [it.medicationName]: e.target.value }))}
                        >
                          <option value="">Select…</option>
                          {DECISIONS.map((d) => (
                            <option key={d} value={d}>
                              {d[0].toUpperCase() + d.slice(1)}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!done && (
          <div className="mt-4 flex items-center justify-between border-t border-ink-200 pt-4">
            <p className="text-xs text-ink-400">
              Completing this reconciliation re-evaluates rule RX-ADM-001 and moves the associated critical finding to Awaiting Verification.
            </p>
            <button className="btn-primary text-sm" disabled={!allDecided} onClick={() => setConfirm(true)}>
              <CheckCircle2 className="h-4 w-4" /> Complete Reconciliation
            </button>
          </div>
        )}
        {done && (
          <div className="mt-4 border-t border-ink-200 pt-4">
            <button className="btn-secondary text-sm" onClick={() => navigate(`/risk/inbox?status=awaiting_verification`)}>
              Go to Awaiting Verification
            </button>
          </div>
        )}
      </SectionCard>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          completeReconciliation(patientId!);
          setConfirm(false);
        }}
        title="Complete medication reconciliation"
        message="This signs the reconciliation, marks all listed medications as reconciled, and triggers re-evaluation of the admission medication reconciliation rule."
        confirmLabel="Complete & Sign"
        requireCheckbox="I have reviewed each medication and the decisions above are accurate."
      />
    </div>
  );
}
