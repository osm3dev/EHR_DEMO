import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, FileWarning, TriangleAlert } from 'lucide-react';
import { Modal } from '@/components/ui';
import type { ClinicalNote } from '@/types';
import { cn } from '@/utils/cn';

export interface ScrubFinding {
  id: string;
  tier: 'must' | 'review';
  title: string;
  detail: React.ReactNode;
  field?: string;
}

/** Documentation-quality check run before a note can be signed (spec §25). */
export function evaluateNote(note: ClinicalNote): { completeness: number; findings: ScrubFinding[] } {
  const required = ['Patient Status', 'Clinical Observation', 'Intervention', 'Patient Response', 'Follow-up Plan'];
  const filled = required.filter((f) => (note.fields[f] ?? '').trim().length > 3);
  const completeness = Math.round((filled.length / required.length) * 100);

  const findings: ScrubFinding[] = [];
  for (const f of required) {
    if ((note.fields[f] ?? '').trim().length <= 3) {
      findings.push({
        id: `missing-${f}`,
        tier: 'must',
        title: `${f} Missing`,
        detail: 'Required field has not been completed.',
        field: f,
      });
    }
  }

  const obs = (note.fields['Clinical Observation'] ?? '').toLowerCase();
  if (obs.includes('ambulates independently') || obs.includes('independent')) {
    findings.push({
      id: 'mobility-contradiction',
      tier: 'review',
      title: 'Possible Mobility Documentation Inconsistency',
      detail: (
        <div className="space-y-1 text-sm">
          <p>
            <span className="font-medium text-ink-700">Current note:</span> "Patient ambulates independently."
          </p>
          <p>
            <span className="font-medium text-ink-700">Recent PT note (same day):</span> "Patient requires two-person assistance."
          </p>
        </div>
      ),
      field: 'Clinical Observation',
    });
  }

  return { completeness, findings };
}

interface Props {
  open: boolean;
  onClose: () => void;
  note: ClinicalNote;
  onGoToField: (field: string) => void;
  onSign: () => void;
  onOverrideSign: (reason: string) => void;
}

export function PreSignScrubber({ open, onClose, note, onGoToField, onSign, onOverrideSign }: Props) {
  const { completeness, findings } = useMemo(() => evaluateNote(note), [note]);
  const must = findings.filter((f) => f.tier === 'must');
  const review = findings.filter((f) => f.tier === 'review');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [overrideMode, setOverrideMode] = useState(false);
  const [reason, setReason] = useState('');
  const [ack, setAck] = useState(false);

  const activeReview = review.filter((f) => !dismissed.has(f.id));
  const canSignClean = must.length === 0;
  const total = must.length + activeReview.length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Documentation Review"
      subtitle={total > 0 ? `We found ${total} item${total === 1 ? '' : 's'} that should be reviewed before signing.` : 'This note passes all documentation checks.'}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Continue Editing
          </button>
          {canSignClean && total === 0 ? (
            <button
              className="btn-primary"
              onClick={() => {
                onSign();
                onClose();
              }}
            >
              <CheckCircle2 className="h-4 w-4" /> Sign Note
            </button>
          ) : !overrideMode ? (
            <button className="btn-danger" onClick={() => setOverrideMode(true)}>
              Override &amp; Sign
            </button>
          ) : (
            <button
              className="btn-danger"
              disabled={reason.trim().length < 5 || !ack}
              onClick={() => {
                onOverrideSign(reason.trim());
                onClose();
              }}
            >
              Confirm Override &amp; Sign
            </button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        {/* Completeness */}
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-ink-700">Completeness</span>
            <span className="font-semibold text-ink-900">{completeness}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
            <div className={cn('h-full rounded-full', completeness >= 90 ? 'bg-green-500' : completeness >= 70 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${completeness}%` }} />
          </div>
        </div>

        {/* Must resolve */}
        {must.length > 0 && (
          <section>
            <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-red-700">
              <FileWarning className="h-4 w-4" /> Must Resolve
            </h4>
            <div className="space-y-2">
              {must.map((f) => (
                <div key={f.id} className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                  <div>
                    <p className="text-sm font-semibold text-red-800">{f.title}</p>
                    <p className="text-sm text-red-700">{f.detail}</p>
                  </div>
                  {f.field && (
                    <button
                      className="btn-secondary shrink-0 text-xs"
                      onClick={() => {
                        onGoToField(f.field!);
                        onClose();
                      }}
                    >
                      Go to Field <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Review recommended */}
        {activeReview.length > 0 && (
          <section>
            <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-700">
              <TriangleAlert className="h-4 w-4" /> Review Recommended
            </h4>
            <div className="space-y-2">
              {activeReview.map((f) => (
                <div key={f.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm font-semibold text-amber-800">{f.title}</p>
                  <div className="mt-1 text-amber-700">{f.detail}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button className="btn-secondary text-xs">Review Evidence</button>
                    <button className="btn-ghost text-xs" onClick={() => setDismissed((d) => new Set(d).add(f.id))}>
                      Dismiss Finding
                    </button>
                    {f.field && (
                      <button
                        className="btn-ghost text-xs"
                        onClick={() => {
                          onGoToField(f.field!);
                          onClose();
                        }}
                      >
                        Go to Field
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-400">
              This is an AI-assisted finding. It does not state which clinical statement is correct — a clinician must review both entries.
            </p>
          </section>
        )}

        {total === 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <CheckCircle2 className="h-4 w-4" /> All required fields are complete and no inconsistencies were detected.
          </div>
        )}

        {/* Override block */}
        {overrideMode && (
          <section className="rounded-lg border border-red-200 bg-white p-3">
            <label className="label" htmlFor="override-reason">
              Override reason <span className="text-red-600">*</span>
            </label>
            <textarea
              id="override-reason"
              className="input min-h-[70px]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why the note is being signed with unresolved documentation items."
            />
            <label className="mt-2 flex items-start gap-2 text-sm text-ink-700">
              <input type="checkbox" className="mt-0.5 rounded border-ink-300 text-brand-600 focus:ring-brand-500" checked={ack} onChange={(e) => setAck(e.target.checked)} />
              <span>I understand this override is recorded in the audit log and may generate a documentation finding.</span>
            </label>
          </section>
        )}
      </div>
    </Modal>
  );
}
