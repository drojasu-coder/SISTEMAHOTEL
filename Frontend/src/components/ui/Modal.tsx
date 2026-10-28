import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { es } from '@/i18n/es';

const FOCUSABLE =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  closeLabel?: string;
  busy?: boolean;
  busyLabel?: string;
  initialFocusRef?: React.RefObject<HTMLElement>;
  presentation?: 'dialog' | 'service';
}

/**
 * Diálogo modal accesible para escritorio y móvil:
 * - Atrapa el foco dentro del diálogo mientras esté abierto.
 * - Cierre con tecla Escape y clic en telón.
 * - Devuelve el foco al elemento que lo abrió al cerrarse.
 * - Anuncia título y descripción mediante atributos ARIA.
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  className,
  closeLabel = es.comunes.cerrar,
  busy = false,
  busyLabel,
  initialFocusRef,
  presentation = 'dialog',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = () => { if (!busy) onClose(); };

  const titleId = React.useId();
  const descId = React.useId();

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;

    const timer = setTimeout(() => {
      (initialFocusRef?.current ?? dialog?.querySelector<HTMLElement>(FOCUSABLE))?.focus();
    }, 10);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;

      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open, initialFocusRef]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  if (!open) return null;

  return (
    <div className={cn('fixed inset-0 z-50 flex items-center justify-center', presentation === 'service' ? 'sm:p-6' : 'p-4 sm:p-6')}>
      <div
        className="fixed inset-0 bg-neutro-900/50 backdrop-blur-sm transition-opacity"
        onClick={() => onCloseRef.current()}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-busy={busy || undefined}
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={cn(
          'relative z-50 flex w-full flex-col overflow-hidden border border-neutro-200 bg-white shadow-soft',
          presentation === 'service' ? 'h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[90dvh] sm:max-w-5xl sm:rounded-xl' : 'max-h-[90vh] max-w-lg rounded-xl',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-neutro-200 p-4 sm:p-6">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id={titleId} className="font-serif text-xl font-semibold text-neutro-900 sm:text-2xl">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-xs text-neutro-600 sm:text-sm">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onCloseRef.current()}
            disabled={busy}
            aria-label={closeLabel}
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-neutro-600 hover:bg-neutro-100 hover:text-neutro-900 disabled:opacity-45"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{busy && busyLabel && <p role="status" className="mb-4 text-sm text-neutro-700">{busyLabel}</p>}{children}</div>
      </div>
    </div>
  );
};
