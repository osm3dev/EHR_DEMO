import { useEffect } from 'react';
import { CheckCircle2, Info, TriangleAlert, XCircle, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/utils/cn';

const ICONS = {
  success: CheckCircle2,
  info: Info,
  warning: TriangleAlert,
  error: XCircle,
};
const TONES = {
  success: 'border-green-200 bg-green-50 text-green-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  warning: 'border-orange-200 bg-orange-50 text-orange-800',
  error: 'border-red-200 bg-red-50 text-red-800',
};

export function Toaster() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} id={t.id} onDismiss={() => dismiss(t.id)}>
          <div className={cn('pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg', TONES[t.tone])}>
            {(() => {
              const Icon = ICONS[t.tone];
              return <Icon className="mt-0.5 h-5 w-5 shrink-0" />;
            })()}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.body && <p className="mt-0.5 text-sm opacity-80">{t.body}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        </ToastItem>
      ))}
    </div>
  );
}

function ToastItem({ id, onDismiss, children }: { id: string; onDismiss: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [id, onDismiss]);
  return <>{children}</>;
}
