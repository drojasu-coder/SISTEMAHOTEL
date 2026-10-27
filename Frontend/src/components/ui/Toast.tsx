import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/cn';
import { X } from 'lucide-react';
import { usePublicInterface } from '@/i18n/public';
import { useLocale } from '@/i18n/LocaleContext';

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
  /** null conserva el aviso; errores y advertencias son persistentes por defecto. */
  duration?: number | null;
}

/**
 * Notificación flotante. Los errores se anuncian como `role="alert"`, el
 * resto como `role="status"`. Se cierra con el botón de cerrar o mediante el
 * autodescarte gestionado por `ToastProvider`.
 */
export const Toast: React.FC<ToastProps> = ({ title, description, tone = 'success', onClose, duration }) => {
  const { t } = useLocale();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const timeout = duration === undefined ? (tone === 'success' || tone === 'info' ? 7000 : null) : duration;
  useEffect(() => {
    if (!onClose || timeout === null || hovered || focused) return;
    const timer = setTimeout(onClose, Math.max(7000, timeout));
    return () => clearTimeout(timer);
  }, [onClose, timeout, hovered, focused]);
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
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
          aria-label={t('close')}
          className="-my-3 -mr-3 flex size-11 shrink-0 items-center justify-center"
        >
          <span className="sr-only">{t('close')}</span>
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

type ToastMessage = Omit<ToastProps, 'onClose'> & { id: number };
type NotifyFn = (message: Omit<ToastMessage, 'id'>) => void;
type ToastContextValue = NotifyFn & { notify: NotifyFn };
const ToastContext = createContext<ToastContextValue | undefined>(undefined);
let nextToastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const { p } = usePublicInterface();
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const notify = useCallback((message: Omit<ToastMessage, 'id'>) => {
    setMessages((previous) => [...previous, { ...message, id: ++nextToastId }]);
  }, []);
  const value = Object.assign(notify, { notify });
  return <ToastContext.Provider value={value}>
    {children}
    <div className="fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100%-2rem)] flex-col gap-2" aria-label={p('notifications')}>
      {messages.slice(0, 3).map((item) => <Toast key={item.id} {...item} onClose={() => setMessages((previous) => previous.filter((message) => message.id !== item.id))} />)}
    </div>
  </ToastContext.Provider>;
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de un ToastProvider');
  }
  return ctx;
};
