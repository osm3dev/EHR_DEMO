import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FlaskConical, Play, Save, ShieldCheck } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { ConfirmDialog, PageHeader, SectionCard, SeverityBadge } from '@/components/ui';
import type { RiskRule, RuleTriggerType, Severity } from '@/types';
import { cn } from '@/utils/cn';

const TRIGGERS: RuleTriggerType[] = ['Patient Admitted', 'Fall Incident', 'Order Entered', 'Lab Resulted', 'Note Signed', 'Shift Change', 'Care Plan Created'];
const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low'];

const BLANK: RiskRule = {
  id: '',
  name: '',
  category: 'assessments',
  trigger: 'Fall Incident',
  requirement: '',
  deadlineHours: 2,
  severity: 'high',
  escalation: [
    { afterHoursOverdue: 2, notifyRole: 'Charge Nurse' },
    { afterHoursOverdue: 4, notifyRole: 'Director of Nursing', raiseSeverityTo: 'critical' },
  ],
  responsibleRole: 'Nurse',
  scope: 'All Facilities',
  evaluationType: 'Deterministic',
  version: 1,
  status: 'draft',
  updatedAt: new Date().toISOString(),
  updatedById: 'user-admin-1',
};

export function RuleBuilderPage() {
  const { ruleId } = useParams();
  const navigate = useNavigate();
  const existing = useStore((s) => s.db.riskRules.find((r) => r.id === ruleId));
  const patients = useStore((s) => s.db.patients);
  const saveRule = useStore((s) => s.saveRule);
  const activateRule = useStore((s) => s.activateRule);

  const [rule, setRule] = useState<RiskRule>(() =>
    existing ? { ...existing } : { ...BLANK, id: 'PFR-002', name: 'Post-Fall Reassessment', requirement: 'Post-Fall Assessment Completed' },
  );
  const [testPatient, setTestPatient] = useState(patients[1]?.id ?? patients[0]?.id);
  const [testResult, setTestResult] = useState<null | ReturnType<typeof runTest>>(null);
  const [confirmActivate, setConfirmActivate] = useState(false);

  const set = <K extends keyof RiskRule>(k: K, v: RiskRule[K]) => setRule((r) => ({ ...r, [k]: v }));

  const patient = useMemo(() => patients.find((p) => p.id === testPatient), [patients, testPatient]);

  function runTest() {
    // synthetic evaluation: trigger passes, requirement fails, deadline exceeded
    return {
      trigger: 'Passed' as const,
      requirement: 'Failed' as const,
      deadline: 'Exceeded' as const,
      wouldGenerate: true,
      severity: rule.severity,
      evidence: `${rule.requirement || 'Required documentation'} incomplete for ${patient?.firstName} ${patient?.lastName}. ` +
        `Trigger "${rule.trigger}" occurred ${rule.deadlineHours + 1}h ago; deadline is ${rule.deadlineHours}h.`,
    };
  }

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/risk/rules')} className="btn-ghost -ml-2 text-sm">
        <ArrowLeft className="h-4 w-4" /> Risk Rules
      </button>
      <PageHeader
        title={existing ? `${rule.name}` : 'Create Documentation Risk Rule'}
        subtitle={existing ? `${rule.id} · Version ${rule.version} · ${rule.status}` : 'Define a trigger, requirement, deadline and escalation path.'}
        crumbs={[{ label: 'Risk Management', to: '/risk/rules' }, { label: 'Rule Builder' }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-ink-100 px-2 py-1 text-xs font-medium text-ink-600">Version {rule.version}</span>
            <button className="btn-secondary text-sm" onClick={() => { saveRule(rule); }}>
              <Save className="h-4 w-4" /> Save Draft
            </button>
            <button className="btn-secondary text-sm" onClick={() => setTestResult(runTest())}>
              <FlaskConical className="h-4 w-4" /> Test Rule
            </button>
            <button className="btn-primary text-sm" onClick={() => setConfirmActivate(true)}>
              <ShieldCheck className="h-4 w-4" /> Activate Rule
            </button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Definition" className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Rule Name">
              <input className="input" value={rule.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label="Rule ID">
              <input className="input font-mono text-xs" value={rule.id} onChange={(e) => set('id', e.target.value)} />
            </Field>
            <Field label="Category">
              <select className="input" value={rule.category} onChange={(e) => set('category', e.target.value as RiskRule['category'])}>
                {['assessments', 'signatures', 'care_plans', 'medication_reconciliation', 'orders', 'labs', 'notes', 'consent'].map((c) => (
                  <option key={c} value={c}>
                    {c.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Evaluation Type">
              <select className="input" value={rule.evaluationType} onChange={(e) => set('evaluationType', e.target.value as RiskRule['evaluationType'])}>
                <option value="Deterministic">Deterministic</option>
                <option value="AI-Assisted">AI-Assisted</option>
              </select>
            </Field>
            <Field label="Trigger">
              <select className="input" value={rule.trigger} onChange={(e) => set('trigger', e.target.value as RuleTriggerType)}>
                {TRIGGERS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Requirement">
              <input className="input" value={rule.requirement} onChange={(e) => set('requirement', e.target.value)} placeholder="e.g. Post-Fall Assessment Completed" />
            </Field>
            <Field label="Deadline">
              <div className="flex gap-2">
                <input
                  type="number"
                  className="input"
                  value={rule.deadlineHours}
                  onChange={(e) => set('deadlineHours', Number(e.target.value))}
                />
                <select className="input w-28" defaultValue="Hours">
                  <option>Hours</option>
                  <option>Days</option>
                </select>
              </div>
            </Field>
            <Field label="Severity">
              <select className="input" value={rule.severity} onChange={(e) => set('severity', e.target.value as Severity)}>
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Responsible Role">
              <select className="input" value={rule.responsibleRole} onChange={(e) => set('responsibleRole', e.target.value as RiskRule['responsibleRole'])}>
                {['Nurse', 'Physician', 'Charge Nurse', 'Director of Nursing'].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Scope">
              <select className="input" value={rule.scope} onChange={(e) => set('scope', e.target.value)}>
                <option>All Facilities</option>
                <option>Houston North</option>
                <option>Houston West</option>
                <option>Stafford</option>
              </select>
            </Field>
          </div>

          <div className="mt-5">
            <p className="label">Escalation path</p>
            <div className="space-y-2">
              {rule.escalation.map((step, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-ink-200 bg-ink-50/40 p-2.5 text-sm">
                  <span className="text-ink-500">After</span>
                  <input
                    type="number"
                    className="input w-16 py-1"
                    value={step.afterHoursOverdue}
                    onChange={(e) =>
                      setRule((r) => {
                        const esc = [...r.escalation];
                        esc[i] = { ...esc[i], afterHoursOverdue: Number(e.target.value) };
                        return { ...r, escalation: esc };
                      })
                    }
                  />
                  <span className="text-ink-500">hours overdue, notify</span>
                  <select
                    className="input w-44 py-1"
                    value={step.notifyRole}
                    onChange={(e) =>
                      setRule((r) => {
                        const esc = [...r.escalation];
                        esc[i] = { ...esc[i], notifyRole: e.target.value as RiskRule['responsibleRole'] };
                        return { ...r, escalation: esc };
                      })
                    }
                  >
                    {['Charge Nurse', 'Director of Nursing', 'Compliance'].map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                  {step.raiseSeverityTo && (
                    <span className="text-ink-500">
                      and raise severity to <strong>{step.raiseSeverityTo}</strong>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Test panel */}
        <SectionCard title="Rule Testing" bodyClassName="space-y-3">
          <Field label="Synthetic patient">
            <select className="input" value={testPatient} onChange={(e) => setTestPatient(e.target.value)}>
              {patients.slice(0, 12).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} · MRN {p.mrn}
                </option>
              ))}
            </select>
          </Field>
          <button className="btn-primary w-full text-sm" onClick={() => setTestResult(runTest())}>
            <Play className="h-4 w-4" /> Run Test
          </button>

          {testResult && (
            <div className="space-y-2 rounded-lg border border-ink-200 p-3 text-sm">
              <Row label="Trigger" value={testResult.trigger} good />
              <Row label="Requirement" value={testResult.requirement} good={false} />
              <Row label="Deadline" value={testResult.deadline} good={false} />
              <div className="border-t border-ink-200 pt-2">
                <p className="font-semibold text-ink-800">
                  Result: {testResult.wouldGenerate ? 'Finding would be generated' : 'No finding'}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-ink-500">Severity:</span>
                  <SeverityBadge severity={testResult.severity} size="sm" />
                </div>
                <p className="mt-2 text-xs text-ink-500">
                  <span className="font-medium text-ink-700">Evidence:</span> {testResult.evidence}
                </p>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <ConfirmDialog
        open={confirmActivate}
        onClose={() => setConfirmActivate(false)}
        onConfirm={() => {
          if (!useStore.getState().db.riskRules.find((r) => r.id === rule.id)) saveRule(rule);
          activateRule(rule.id);
          navigate('/risk/rules');
        }}
        title="Activate rule"
        message={
          <>
            Activating <strong>{rule.name}</strong> will begin evaluating it against all charts in scope (
            {rule.scope}). A new rule version will be recorded.
          </>
        }
        confirmLabel="Activate Rule"
        requireCheckbox="I confirm this rule is configured correctly and approved for production use."
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{label}</span>
      <span className={cn('font-semibold', good ? 'text-green-600' : 'text-red-600')}>{value}</span>
    </div>
  );
}
