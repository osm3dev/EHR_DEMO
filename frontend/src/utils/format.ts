import { differenceInMinutes, format, formatDistanceToNowStrict, parseISO } from 'date-fns';

export function fmtDate(iso?: string): string {
  if (!iso) return '—';
  return format(parseISO(iso), 'MMM d, yyyy');
}

export function fmtDateTime(iso?: string): string {
  if (!iso) return '—';
  return format(parseISO(iso), 'MMM d, yyyy — h:mm a');
}

export function fmtTime(iso?: string): string {
  if (!iso) return '—';
  return format(parseISO(iso), 'h:mm a');
}

export function fromNow(iso?: string): string {
  if (!iso) return '—';
  return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true });
}

/** Human "3h 12m" style duration between now and a due date. Negative = overdue. */
export function overdueLabel(dueIso: string, nowIso: string): { overdue: boolean; label: string } {
  const mins = differenceInMinutes(parseISO(nowIso), parseISO(dueIso));
  const abs = Math.abs(mins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const parts = [h ? `${h}h` : '', m ? `${m}m` : ''].filter(Boolean).join(' ') || '0m';
  return { overdue: mins > 0, label: mins > 0 ? `Overdue ${parts}` : `Due in ${parts}` };
}

export function age(dob: string): number {
  const d = parseISO(dob);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const mo = now.getMonth() - d.getMonth();
  if (mo < 0 || (mo === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter((p) => /[A-Za-z]/.test(p[0]))
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

export function pct(n: number): string {
  return `${Math.round(n)}%`;
}
