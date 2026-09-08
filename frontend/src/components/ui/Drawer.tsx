import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Props {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: 'md' | 'lg' | 'xl';
}

export function Drawer({ open, onClose, title, subtitle, children, footer, width = 'lg' }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink-900/30 backdrop-blur-[1px]" onClick={onClose} />
      <div
        className={cn(
          'relative flex h-full w-full flex-col bg-white shadow-drawer',
          width === 'md' && 'max-w-md',
          width === 'lg' && 'max-w-2xl',
          width === 'xl' && 'max-w-3xl',
        )}
      >
        <div className="flex items-start justify-between border-b border-ink-200 px-6 py-4">
          <div className="min-w-0">
            <div className="text-base font-semibold text-ink-900">{title}</div>
            {subtitle && <div className="mt-0.5 text-sm text-ink-500">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="btn-ghost -mr-2 p-2" aria-label="Close panel">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-ink-200 bg-ink-50/60 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
