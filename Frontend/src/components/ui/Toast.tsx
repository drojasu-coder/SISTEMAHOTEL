import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/cn';
import { X } from 'lucide-react';
import { es } from '@/i18n/es';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

const toneClasses: Record<ToastTone, string> = {
  success: 'border-exito-600/20 bg-exito-50 text-exito-700',
  error: 'border-error-600/20 bg-error-50 text-error-700',
  info: 'border-info-600/20 bg-info-50 text-info-700',
  warning: 'border-advertencia-600/20 bg-advertencia-50 text-advertencia-700',
};

export interface ToastProps {
  title: string;
  description?: string;
  tone?: ToastTone;
  onClose?: () => void;
}

/**
 * Notificación flotante. Los errores se anuncian como `role="alert"`, el
 * resto como `role="status"`. Se cierra con el botón de cerrar o mediante el
 * autodescarte gestionado por `ToastProvider`.
 */
export const Toast: React.FC<ToastProps> = ({ title, description, tone = 'success', onClose }) => {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-lg border p-4 shadow-soft', toneClasses[tone])}
    >
      <div className="flex-1">
        <p className="font-semibold">{title}</p>
        {description && <p className="mt-1 text-xs opacity-90">{description}</p>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={es.comunes.cerrar}
          className="-my-3 -mr-3 flex size-11 shrink-0 items-center justify-center"
        >
          <span className="sr-only">{es.comunes.cerrar}</span>
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

type ToastMessage = { id: number; title: string; description?: string; tone?: ToastTone };
type NotifyFn = (message: Omit<ToastMessage, 'id'>) => void;
type ToastContextValue = NotifyFn & { notify: NotifyFn };

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const nextId = useRef(0);

  const notify = useCallback((message: Omit<ToastMessage, 'id'>) => {
    const id = ++nextId.current;
    setMessages((prev) => [...prev.slice(-3), { ...message, id }]);
    timers.current.push(
      setTimeout(() => setMessages((prev) => prev.filter((item) => item.id !== id)), 7000)
    );
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const value = Object.assign(notify, { notify });

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100%-2rem)] flex-col gap-2"
        aria-label={es.componentes.notificaciones}
      >
        {messages.map((item) => (
          <Toast
            key={item.id}
            {...item}
            onClose={() => setMessages((prev) => prev.filter((m) => m.id !== item.id))}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de un ToastProvider');
  }
  return ctx;
};
