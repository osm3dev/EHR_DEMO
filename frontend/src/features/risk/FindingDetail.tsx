import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileWarning,
  GitBranch,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import type { RiskFinding } from '@/types';
import { useStore } from '@/store/useStore';
import { useLookups } from '@/hooks/useLookups';
import { AiBadge, Avatar, ConfirmDialog, KeyValue, SeverityBadge, StatusBadge } from '@/components/ui';
import { fmtDateTime, fmtTime, fromNow, overdueLabel } from '@/utils/format';
import { CATEGORY_LABEL } from '@/utils/severity';
import { cn } from '@/utils/cn';

const SOURCE_ROUTES: Record<string, (f: RiskFinding, refId: string) => string> = {
  medication_reconciliation: (f) => `/patients/${f.patientId}/medications/reconciliation`,
  encounter: (f) => `/patients/${f.patientId}`,
  patient: (f) => `/patients/${f.patientId}`,
  note: (f, refId) => `/patients/${f.patientId}/notes/${refId}`,
};

export function FindingDetail({ finding, onNavigateAway }: { finding: RiskFinding; onNavigateAway?: () => void }) {
  const navigate = useNavigate();
  const lk = useLookups();
  const now = useStore((s) => s.now);
  const users = useStore((s) => s.db.users);
  const assignFinding = useStore((s) => s.assignFinding);
  const acknowledgeFinding = useStore((s) => s.acknowledgeFinding);
  const escalateFinding = useStore((s) => s.escalateFinding);
  const verifyFinding = useStore((s) => s.verifyFinding);
  const markFalsePositive = useStore((s) => s.markFalsePositive);

  const [confirmVerify, setConfirmVerify] = useState(false);
  const [confirmFP, setConfirmFP] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);

  const rule = lk.rule(finding.ruleId);
  const patient = lk.patient(finding.patientId);
  const due = overdueLabel(finding.dueAt, now);
  const nurses = users.filter((u) => u.role === 'Nurse' || u.role === 'Physician' || u.role === 'Charge Nurse');

  const go = (to: string) => {
    onNavigateAway?.();
    navigate(to);
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={finding.severity} />
          <StatusBadge status={finding.status} />
          {finding.isAiGenerated && <AiBadge />}
          {due.overdue && (
            <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
              {due.label}
            </span>
          )}
        </div>
        <h3 className="mt-2 text-lg font-semibold text-ink-900">{finding.title}</h3>
        <p className="mt-1 text-sm text-ink-500">
          {patient?.firstName} {patient?.lastName} · MRN {patient?.mrn} · {lk.facilityName(finding.facilityId)} ·{' '}
          {lk.unitName(finding.unitId)}
        </p>
      </div>

      {/* Score */}
      <div className="rounded-xl border border-ink-200 bg-ink-50/50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink-700">Documentation Risk Score</span>
          <span className="text-lg font-semibold text-ink-900">
            {finding.priorityScore}
            <span className="text-sm font-normal text-ink-400"> / 100</span>
          </span>
        </div>
        <div className="mt-3 space-y-1.5">
          {finding.scoreBreakdown.map((b) => (
            <div key={b.label} className="flex items-center justify-between text-xs">
              <span className="text-ink-500">{b.label}</span>
              <span className="font-medium text-ink-700">+{b.points}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-ink-200 pt-1.5 text-xs font-semibold">
            <span className="text-ink-700">Total</span>
            <span className="text-ink-900">{finding.priorityScore}</span>
          </div>
        </div>
      </div>

      {/* Why flagged */}
      <Section icon={<FileWarning className="h-4 w-4" />} title="Why This Was Flagged">
        <p className="text-sm leading-relaxed text-ink-700">{finding.whyFlagged}</p>
      </Section>

      {/* Evidence */}
      {finding.evidence.length > 0 && (
        <Section icon={<ClipboardCheck className="h-4 w-4" />} title="Evidence">
          <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {finding.evidence.map((e) => (
              <div key={e.label} className="py-1.5">
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">{e.label}</dt>
                <dd
                  className={cn(
                    'mt-0.5 text-sm',
                    e.emphasis === 'danger' && 'font-semibold text-red-700',
                    e.emphasis === 'warning' && 'font-medium text-amber-700',
                    !e.emphasis && 'text-ink-800',
                  )}
                >
                  {e.value}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {/* Source documentation */}
      {finding.sourceRefs.length > 0 && (
        <Section icon={<ExternalLink className="h-4 w-4" />} title="Source Documentation">
          <div className="flex flex-wrap gap-2">
            {finding.sourceRefs.map((ref) => {
              const builder = SOURCE_ROUTES[ref.kind];
              return (
                <button
                  key={ref.id}
                  onClick={() => builder && go(builder(finding, ref.id))}
                  className="btn-secondary text-xs"
                >
                  {ref.label}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {/* Rule information */}
      <Section icon={<GitBranch className="h-4 w-4" />} title="Rule Information">
        <dl className="grid grid-cols-2 gap-x-6 sm:grid-cols-3">
          <KeyValue label="Rule ID">{finding.ruleId}</KeyValue>
          <KeyValue label="Rule Version">v{finding.ruleVersion}</KeyValue>
          <KeyValue label="Type">{rule?.evaluationType ?? 'Deterministic'}</KeyValue>
          <KeyValue label="Category">{CATEGORY_LABEL[finding.category]}</KeyValue>
          <KeyValue label="Severity">
            <SeverityBadge severity={finding.severity} size="sm" />
          </KeyValue>
          <KeyValue label="Responsible Role">{rule?.responsibleRole ?? '—'}</KeyValue>
        </dl>
        <button onClick={() => rule && go(`/risk/rules/${rule.id}`)} className="mt-2 text-sm font-medium text-brand-700 hover:underline">
          View rule definition →
        </button>
      </Section>

      {/* Assignment */}
      <Section icon={<UserCog className="h-4 w-4" />} title="Assignment">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {finding.assignedUserId ? (
              <>
                <Avatar name={lk.user(finding.assignedUserId)?.name ?? '?'} color={lk.user(finding.assignedUserId)?.avatarColor} size={32} />
                <div>
                  <p className="text-sm font-medium text-ink-800">{lk.userName(finding.assignedUserId)}</p>
                  <p className="text-xs text-ink-400">{lk.user(finding.assignedUserId)?.role}</p>
                </div>
              </>
            ) : (
              <span className="text-sm text-ink-500">Unassigned</span>
            )}
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary text-xs" onClick={() => setReassignOpen((v) => !v)}>
              Reassign
            </button>
            <button className="btn-secondary text-xs" onClick={() => escalateFinding(finding.id)}>
              Escalate
            </button>
          </div>
        </div>
        {reassignOpen && (
          <div className="mt-3 flex flex-wrap gap-2">
            {nurses.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  assignFinding(finding.id, n.id);
                  setReassignOpen(false);
                }}
                className="rounded-lg border border-ink-300 px-2.5 py-1 text-xs hover:bg-ink-50"
              >
                {n.name}
              </button>
            ))}
          </div>
        )}
      </Section>

      {/* Recommended action */}
      <Section icon={<ShieldCheck className="h-4 w-4" />} title="Recommended Action">
        <p className="text-sm text-ink-700">{finding.recommendedAction}</p>
        {finding.recommendedActionLink && (
          <button className="btn-primary mt-3 text-sm" onClick={() => go(finding.recommendedActionLink!)}>
            Go to Documentation
          </button>
        )}
      </Section>

      {/* Timeline */}
      <Section icon={<GitBranch className="h-4 w-4" />} title="Finding Timeline">
        <ol className="relative ml-2 space-y-4 border-l border-ink-200 pl-5">
          {finding.timeline.map((ev) => (
            <li key={ev.id} className="relative">
              <span className="absolute -left-[26px] top-1 grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-white bg-brand-500" />
              <p className="text-sm text-ink-800">{ev.description}</p>
              <p className="mt-0.5 text-xs text-ink-400">
                {fmtTime(ev.at)} · {fmtDateTime(ev.at)} {ev.actorName ? `· ${ev.actorName}` : ''}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Verify / lifecycle actions */}
      <div className="sticky bottom-0 -mx-6 flex flex-wrap gap-2 border-t border-ink-200 bg-white px-6 py-3">
        {finding.status === 'awaiting_verification' ? (
          <button className="btn-primary" onClick={() => setConfirmVerify(true)}>
            <CheckCircle2 className="h-4 w-4" /> Verify Correction & Close
          </button>
        ) : finding.status === 'detected' || finding.status === 'assigned' ? (
          <button className="btn-secondary" onClick={() => acknowledgeFinding(finding.id)}>
            Acknowledge
          </button>
        ) : null}
        {finding.isAiGenerated && finding.status !== 'closed' && finding.status !== 'false_positive' && (
          <button className="btn-secondary" onClick={() => setConfirmFP(true)}>
            Mark False Positive
          </button>
        )}
        <button className="btn-ghost" onClick={() => go(`/risk/findings/${finding.id}`)}>
          Open full page
        </button>
      </div>

      <p className="text-xs text-ink-400">
        Completing corrective work moves a finding to <strong>Awaiting Verification</strong>. The underlying
        documentation is re-evaluated before a nurse leader closes it — a task alone never closes a finding.
      </p>

      <ConfirmDialog
        open={confirmVerify}
        onClose={() => setConfirmVerify(false)}
        onConfirm={() => verifyFinding(finding.id)}
        title="Verify correction"
        message={
          <>
            Confirm that the required documentation is complete and correct for{' '}
            <strong>{finding.title}</strong>. This will close the finding and record your name as verifier in
            the audit log.
          </>
        }
        confirmLabel="Verify & Close"
        requireCheckbox="I have reviewed the source documentation and confirm the deficiency is resolved."
      />
      <ConfirmDialog
        open={confirmFP}
        onClose={() => setConfirmFP(false)}
        onConfirm={() => markFalsePositive(finding.id, 'Reviewer determined the flag does not represent a real documentation deficiency.')}
        title="Mark as false positive"
        message="This sends the AI-assisted finding to False Positive Review and feeds AI quality metrics. It does not delete the finding."
        confirmLabel="Send to Review"
        requireReason
      />

      <p className="text-right text-[11px] text-ink-400">Detected {fromNow(finding.detectedAt)}</p>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-800">
        <span className="text-ink-400">{icon}</span>
        {title}
      </h4>
      {children}
    </section>
  );
}
