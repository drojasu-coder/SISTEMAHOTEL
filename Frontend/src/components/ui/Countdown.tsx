import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { es } from '@/i18n/es';

export interface CountdownProps {
  /** Fecha de expiración entregada por el servidor (ISO 8601). */
  expiresAt: number | string;
  /** Callback opcional cuando el temporizador llega a cero. */
  onExpire?: () => void;
  className?: string;
  onResume?: () => void;
  label?: string;
  warningText?: string;
  expiredText?: string;
}

/**
 * Temporizador de retención (p. ej. carrito).
 * - Calcula el tiempo restante a partir de `expiresAt` (fecha del servidor),
 *   no con un contador fijo.
 * - Limpia el intervalo al desmontar.
 * - No desborda ni baja de cero.
 * - Avisa con `aria-live` cuando quedan menos de 2 minutos.
 * - Al llegar a cero llama a `onExpire` y no decide nada por su cuenta.
 */
export function Countdown({
  expiresAt,
  onExpire,
  className,
  onResume,
  label = es.componentes.contador,
  warningText = es.componentes.avisoTiempo,
  expiredText = es.componentes.expirado,
}: CountdownProps) {
  const deadline = new Date(expiresAt).getTime();
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.ceil((deadline - Date.now()) / 1000)),
  );
  const notifiedDeadline = useRef<number | null>(null);
  const onResumeRef = useRef(onResume);
  onResumeRef.current = onResume;
  const lastResume = useRef(0);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const tick = useCallback(() => {
    const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    setRemaining(seconds);
    if (seconds === 0 && notifiedDeadline.current !== deadline) {
      notifiedDeadline.current = deadline;
      onExpireRef.current?.();
      return true;
    }
    return false;
  }, [deadline]);

  useEffect(() => {
    tick();
    const timer = setInterval(tick, 1000);
    const onFocus = () => {
      if (document.visibilityState === 'hidden' || Date.now() - lastResume.current < 1000) return;
      lastResume.current = Date.now();
      if (!tick()) onResumeRef.current?.();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [tick]);

  const warning = remaining > 0 && remaining <= 120;
  const expired = remaining === 0;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-2 text-sm font-medium',
          expired ? 'text-error-600' : warning ? 'text-advertencia-700' : 'text-neutro-600',
        )}
      >
        <svg
          aria-hidden="true"
          className="size-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          viewBox="0 0 24 24"
        >
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span
          role="timer"
          aria-label={label}
          className="tabular-nums"
          aria-live="off"
        >
          {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
        </span>
      </span>
      <span
        role="status"
        className={cn('text-xs', expired ? 'text-error-600' : warning ? 'text-advertencia-700' : 'text-neutro-600')}
        aria-live="polite"
      >
        {expired ? expiredText : warning ? warningText : ''}
      </span>
    </div>
  );
}
