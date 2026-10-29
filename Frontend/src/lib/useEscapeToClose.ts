import { useEffect } from 'react';

/** Cierra un diálogo propio con Escape, salvo mientras hay una operación en curso. */
export function useEscapeToClose(onClose: () => void, busy = false, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, busy, enabled]);
}
