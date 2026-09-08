/**
 * Deterministic, rules-based stand-in for the "Demo Clinical LLM".
 * It only summarizes / locates / explains existing documentation — never
 * diagnoses, prescribes, or makes clinical decisions (spec §59).
 */
import type { MockDB } from '@/data/mockdb';
import { isOpen, CATEGORY_LABEL } from '@/utils/severity';
import { fromNow } from '@/utils/format';

export function aiClinicalSummary(patientId: string, db: MockDB): { text: string; sources: string[] } {
  const p = db.patients.find((x) => x.id === patientId);
  if (!p) return { text: 'No record found.', sources: [] };
  const open = db.findings.filter((f) => f.patientId === patientId && isOpen(f.status));
  const top = [
    ...new Set(
      open
        .slice()
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .map((f) => f.title.toLowerCase()),
    ),
  ].slice(0, 3);
  const admitted = fromNow(p.admissionDate);
  const dx = p.diagnoses.slice(0, 3).join(', ');
  const text =
    `${p.firstName} ${p.lastName} is a ${ageFrom(p.dob)}-year-old patient admitted ${admitted} with ${dx}. ` +
    `${open.length} documentation finding${open.length === 1 ? '' : 's'} remain${open.length === 1 ? 's' : ''} open. ` +
    (top.length ? `Highest priority items include ${joinList(top)}.` : 'No high-priority documentation gaps at this time.');
  const sources = Array.from(new Set(open.map((f) => CATEGORY_LABEL[f.category]))).slice(0, 5);
  return { text, sources };
}

export function askTheChart(
  question: string,
  patientId: string,
  db: MockDB,
): { answer: string; sources: { label: string; to: string }[] } {
  const p = db.patients.find((x) => x.id === patientId)!;
  const open = db.findings.filter((f) => f.patientId === patientId && isOpen(f.status));
  const q = question.toLowerCase();
  const base = `/patients/${patientId}`;

  const sourceForCategory = (cat: string): { label: string; to: string } => {
    const map: Record<string, string> = {
      medication_reconciliation: `${base}/medications/reconciliation`,
      assessments: `${base}/assessments`,
      care_plans: `${base}/care-plan`,
      orders: `${base}/orders`,
      labs: `${base}/labs`,
      signatures: `${base}/notes`,
      notes: `${base}/notes`,
      consent: `${base}/documents`,
    };
    return { label: CATEGORY_LABEL[cat as keyof typeof CATEGORY_LABEL], to: map[cat] ?? base };
  };

  if (q.includes('high') && q.includes('risk')) {
    const contributors = open
      .slice()
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 4);
    const contribTitles = [...new Set(contributors.map((f) => f.title.toLowerCase()))];
    return {
      answer:
        `${p.firstName} ${p.lastName} currently has ${open.length} unresolved documentation finding${open.length === 1 ? '' : 's'}. ` +
        `The largest contributors to the documentation risk score are ${joinList(contribTitles)}. ` +
        `These are weighted by severity, how long they have been overdue, and patient-safety relevance.`,
      sources: dedupeSources(contributors.map((f) => sourceForCategory(f.category))),
    };
  }

  if (q.includes('overdue')) {
    const overdue = open.filter((f) => f.isOverdue);
    return {
      answer: overdue.length
        ? `${overdue.length} item${overdue.length === 1 ? ' is' : 's are'} overdue: ${joinList(overdue.map((f) => f.title.toLowerCase()))}.`
        : 'No documentation is currently overdue for this patient.',
      sources: dedupeSources(overdue.map((f) => sourceForCategory(f.category))),
    };
  }

  if (q.includes('abnormal') || q.includes('result')) {
    const labs = db.labs.filter((l) => l.patientId === patientId && l.status !== 'normal');
    const unreviewed = labs.filter((l) => !l.reviewed);
    return {
      answer: `${labs.length} abnormal result${labs.length === 1 ? '' : 's'} on file (${labs.map((l) => `${l.test} ${l.value} ${l.units}`).join(', ')}). ` +
        (unreviewed.length ? `${unreviewed.length} ${unreviewed.length === 1 ? 'has' : 'have'} no documented review or follow-up.` : 'All abnormal results have documented review.'),
      sources: [{ label: 'Labs', to: `${base}/labs` }],
    };
  }

  if (q.includes('nursing') || q.includes('unresolved')) {
    const nursing = open.filter((f) => ['assessments', 'care_plans', 'signatures', 'notes'].includes(f.category));
    return {
      answer: `Unresolved nursing documentation: ${joinList(nursing.map((f) => f.title.toLowerCase()))}. ` + `Each is assigned and tracked to verification in the Risk Inbox.`,
      sources: dedupeSources(nursing.map((f) => sourceForCategory(f.category))),
    };
  }

  if (q.includes('yesterday') || q.includes('changed') || q.includes('since')) {
    return {
      answer: `In the last 24 hours: 1 new finding was detected (possible mobility documentation inconsistency), the abnormal potassium result was posted, and the fall-risk reassessment became overdue. No findings were closed in this window.`,
      sources: [
        { label: 'Timeline', to: `${base}/timeline` },
        { label: 'Labs', to: `${base}/labs` },
      ],
    };
  }

  if (q.includes('care') && q.includes('plan')) {
    const cp = db.carePlans.find((c) => c.patientId === patientId);
    return {
      answer: cp
        ? `The ${cp.name} is active. It was last reviewed ${fromNow(cp.lastReviewedAt ?? cp.nextReviewAt)} and is currently missing the required RN signature. Interventions and goal are unchanged this week.`
        : 'No care plan is on file for this patient.',
      sources: [{ label: 'Care Plan', to: `${base}/care-plan` }],
    };
  }

  // default
  return {
    answer:
      `${p.firstName} ${p.lastName} has ${open.length} open documentation finding${open.length === 1 ? '' : 's'}. ` +
      `Ask about overdue documentation, unresolved nursing notes, abnormal results, or why the chart is high risk for a grounded answer with sources.`,
    sources: dedupeSources(open.slice(0, 3).map((f) => sourceForCategory(f.category))),
  };
}

function dedupeSources(list: { label: string; to: string }[]) {
  const seen = new Set<string>();
  return list.filter((s) => (seen.has(s.label) ? false : (seen.add(s.label), true)));
}
function joinList(items: string[]): string {
  if (items.length === 0) return 'none';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
function ageFrom(dob: string): number {
  const d = new Date(dob);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) a--;
  return a;
}
