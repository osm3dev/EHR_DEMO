import { type ReactNode, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Props {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }: Props) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink-900/40" onClick={onClose} />
      <div
        className={cn(
          'relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl',
          size === 'sm' && 'max-w-md',
          size === 'md' && 'max-w-lg',
          size === 'lg' && 'max-w-2xl',
        )}
      >
        <div className="flex items-start justify-between border-b border-ink-200 px-6 py-4">
          <div>
            <div className="text-base font-semibold text-ink-900">{title}</div>
            {subtitle && <div className="mt-0.5 text-sm text-ink-500">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="btn-ghost -mr-2 p-2" aria-label="Close dialog">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-ink-200 bg-ink-50/60 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

interface ConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  tone?: 'primary' | 'danger';
  requireCheckbox?: string;
  requireReason?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  tone = 'primary',
  requireCheckbox,
  requireReason,
}: ConfirmProps) {
  const [checked, setChecked] = useState(false);
  const [reason, setReason] = useState('');
  useEffect(() => {
    if (open) {
      setChecked(false);
      setReason('');
    }
  }, [open]);

  const blocked = (requireCheckbox && !checked) || (requireReason && reason.trim().length < 4);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className={tone === 'danger' ? 'btn-danger' : 'btn-primary'}
            disabled={!!blocked}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="space-y-4 text-sm text-ink-600">
        <div>{message}</div>
        {requireReason && (
          <div>
            <label className="label" htmlFor="confirm-reason">
              Reason <span className="text-red-600">*</span>
            </label>
            <textarea
              id="confirm-reason"
              className="input min-h-[80px]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Document the clinical or operational reason for this action."
            />
          </div>
        )}
        {requireCheckbox && (
          <label className="flex items-start gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              className="mt-0.5 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <span>{requireCheckbox}</span>
          </label>
        )}
      </div>
    </Modal>
  );
}
