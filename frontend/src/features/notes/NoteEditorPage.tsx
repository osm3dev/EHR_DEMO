import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, History, Save, ShieldCheck } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useLookups } from '@/hooks/useLookups';
import { EmptyState, SectionCard } from '@/components/ui';
import { fmtDateTime, fromNow } from '@/utils/format';
import { PreSignScrubber } from './PreSignScrubber';
import { cn } from '@/utils/cn';

const FIELDS = [
  { key: 'Date/Time', type: 'text', required: false },
  { key: 'Patient Status', type: 'textarea', required: true },
  { key: 'Clinical Observation', type: 'textarea', required: true },
  { key: 'Intervention', type: 'textarea', required: true },
  { key: 'Patient Response', type: 'textarea', required: true },
  { key: 'Follow-up Plan', type: 'textarea', required: true },
  { key: 'Additional Notes', type: 'textarea', required: false },
];

export function NoteEditorPage() {
  const { patientId, noteId } = useParams();
  const navigate = useNavigate();
  const lk = useLookups();
  const note = useStore((s) => s.db.notes.find((n) => n.id === noteId));
  const updateNoteField = useStore((s) => s.updateNoteField);
  const signNote = useStore((s) => s.signNote);
  const addAddendum = useStore((s) => s.addAddendum);

  const [scrubberOpen, setScrubberOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [addendumText, setAddendumText] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [focusField, setFocusField] = useState<string | null>(null);
  const fieldRefs = useRef<Record<string, HTMLTextAreaElement | HTMLInputElement | null>>({});

  // autosave indicator
  useEffect(() => {
    if (!note || note.status === 'signed') return;
    const t = setTimeout(() => setSavedAt(new Date().toISOString()), 800);
    return () => clearTimeout(t);
  }, [note?.fields, note]);

  useEffect(() => {
    if (focusField && fieldRefs.current[focusField]) {
      fieldRefs.current[focusField]!.focus();
      fieldRefs.current[focusField]!.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setFocusField(null);
    }
  }, [focusField]);

  if (!note) return <EmptyState title="Note not found" description="This note may have been removed." />;

  const signed = note.status === 'signed' || note.status === 'addendum';
  const missingRequired = FIELDS.filter((f) => f.required && (note.fields[f.key] ?? '').trim().length <= 3);

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(`/patients/${patientId}/notes`)} className="btn-ghost -ml-2 text-sm">
        <ArrowLeft className="h-4 w-4" /> Notes
      </button>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink-900">{note.title}</h1>
          <p className="text-sm text-ink-500">
            {lk.patientName(note.patientId)} · {note.type} · {lk.user(note.authorId)?.name} · created {fromNow(note.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('rounded-md px-2 py-1 text-xs font-medium', signed ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700')}>
            {signed ? `Signed ${note.signedAt ? fmtDateTime(note.signedAt) : ''}` : 'Draft'}
          </span>
          <button className="btn-ghost text-xs" onClick={() => setShowHistory((v) => !v)}>
            <History className="h-3.5 w-3.5" /> Version History
          </button>
        </div>
      </div>

      {showHistory && (
        <SectionCard title="Version History">
          <ol className="space-y-2 text-sm">
            {note.versionHistory.map((v) => (
              <li key={v.version} className="flex items-center justify-between">
                <span className="text-ink-700">
                  v{v.version} — {v.summary}
                </span>
                <span className="text-xs text-ink-400">
                  {fmtDateTime(v.savedAt)} · {lk.user(v.authorId)?.name}
                </span>
              </li>
            ))}
          </ol>
        </SectionCard>
      )}

      <SectionCard
        title={note.title}
        action={
          !signed && (
            <span className="flex items-center gap-1.5 text-xs text-ink-400">
              {savedAt ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-600" /> Autosaved {fromNow(savedAt)}
                </>
              ) : (
                'Editing…'
              )}
            </span>
          )
        }
      >
        <div className="space-y-4">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="label" htmlFor={`f-${f.key}`}>
                {f.key} {f.required && <span className="text-red-500">*</span>}
              </label>
              {f.type === 'textarea' ? (
                <textarea
                  id={`f-${f.key}`}
                  ref={(el) => (fieldRefs.current[f.key] = el)}
                  className={cn('input min-h-[72px]', f.required && (note.fields[f.key] ?? '').trim().length <= 3 && 'border-amber-300 bg-amber-50/30')}
                  disabled={signed}
                  value={note.fields[f.key] ?? ''}
                  onChange={(e) => updateNoteField(note.id, f.key, e.target.value)}
                />
              ) : (
                <input
                  id={`f-${f.key}`}
                  ref={(el) => (fieldRefs.current[f.key] = el)}
                  className="input"
                  disabled={signed}
                  value={note.fields[f.key] ?? ''}
                  onChange={(e) => updateNoteField(note.id, f.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        {!signed && (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-ink-200 pt-4">
            <button className="btn-secondary text-sm">
              <Save className="h-4 w-4" /> Save Draft
            </button>
            <button className="btn-secondary text-sm" onClick={() => setScrubberOpen(true)}>
              Run Documentation Check
            </button>
            <button className="btn-primary text-sm" onClick={() => setScrubberOpen(true)}>
              <ShieldCheck className="h-4 w-4" /> Sign Note
            </button>
            {missingRequired.length > 0 && (
              <span className="text-xs text-amber-700">{missingRequired.length} required field(s) incomplete</span>
            )}
          </div>
        )}
      </SectionCard>

      {/* Addenda */}
      {signed && (
        <SectionCard title="Addenda">
          {note.addenda.length === 0 && <p className="text-sm text-ink-500">No addenda. Signed notes cannot be modified — add an addendum to append information.</p>}
          <ul className="space-y-2">
            {note.addenda.map((a) => (
              <li key={a.id} className="rounded-lg border border-ink-200 p-3 text-sm">
                <p className="text-ink-700">{a.text}</p>
                <p className="mt-1 text-xs text-ink-400">
                  {lk.user(a.authorId)?.name} · {fmtDateTime(a.createdAt)}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <input className="input" placeholder="Add an addendum…" value={addendumText} onChange={(e) => setAddendumText(e.target.value)} />
            <button
              className="btn-primary text-sm"
              disabled={addendumText.trim().length < 3}
              onClick={() => {
                addAddendum(note.id, addendumText.trim());
                setAddendumText('');
              }}
            >
              Add Addendum
            </button>
          </div>
        </SectionCard>
      )}

      <PreSignScrubber
        open={scrubberOpen}
        onClose={() => setScrubberOpen(false)}
        note={note}
        onGoToField={(field) => setFocusField(field)}
        onSign={() => signNote(note.id)}
        onOverrideSign={(reason) => signNote(note.id, { reason })}
      />
    </div>
  );
}
