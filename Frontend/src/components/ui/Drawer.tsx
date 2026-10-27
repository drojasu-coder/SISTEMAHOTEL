import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { es } from '@/i18n/es';

const FOCUSABLE =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** Nombre accesible del diálogo. */
  title: string;
  /** Texto del botón de cierre. */
  closeLabel?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Panel lateral modal accesible: foco inicial dentro, foco atrapado, cierre con Escape
 * y devolución del foco al elemento que lo abrió.
 */
export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  title,
  closeLabel = es.comunes.cerrar,
  className,
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex 2xl:hidden">
      <div className="fixed inset-0 bg-neutro-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn('relative z-50 flex w-full max-w-xs flex-col bg-white shadow-soft', className)}
      >
        <div className="flex items-center justify-end border-b p-2">
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="flex size-11 items-center justify-center rounded-md text-neutro-600 hover:bg-neutro-100 hover:text-neutro-900"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
};
