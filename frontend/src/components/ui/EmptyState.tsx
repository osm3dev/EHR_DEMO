import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface Props {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-300 bg-white px-6 py-14 text-center">
      <div className="mb-3 rounded-full bg-ink-100 p-3 text-ink-500">{icon ?? <Inbox className="h-6 w-6" />}</div>
      <p className="text-sm font-semibold text-ink-800">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
