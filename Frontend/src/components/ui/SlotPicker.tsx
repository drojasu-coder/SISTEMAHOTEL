import { useId, useRef, type KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';
import { formatearHoraFranja, sumarMinutos, useTextosFranjas } from '@/i18n/franjas';

export interface SlotPickerProps {
  label: string;
  /** Inicios disponibles (HH:MM) calculados por el backend; el componente no inventa horarios. */
  slots: string[];
  value: string;
  onChange: (value: string) => void;
  /** Duración de la reserva, para mostrar la hora de fin del inicio elegido. */
  durationMinutes?: number;
  disabled?: boolean;
  error?: string;
}

/** A partir de este número de opciones se usa una lista desplegable en lugar de botones. */
const MAX_BOTONES = 12;

/**
 * Selector compacto de franjas disponibles: un grupo de opciones (radio) con
 * navegación por flechas. Solo muestra los inicios que el servidor ofrece.
 */
export function SlotPicker({ label, slots, value, onChange, durationMinutes, disabled, error }: SlotPickerProps) {
  const { t, locale } = useTextosFranjas();
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const actual = value ? value.slice(0, 5) : '';
  const enfocable = slots.includes(actual) ? actual : slots[0];

  const mover = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (delta === undefined && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const siguiente = event.key === 'Home' ? 0 : event.key === 'End' ? slots.length - 1 : (index + (delta ?? 0) + slots.length) % slots.length;
    refs.current[siguiente]?.focus();
    onChange(slots[siguiente]);
  };

  const resumen = actual && durationMinutes && slots.includes(actual) && (
    <p className="text-xs text-neutro-700" aria-live="polite">
      {t.seleccionado(formatearHoraFranja(actual, locale), formatearHoraFranja(sumarMinutos(actual, durationMinutes), locale))}
    </p>
  );

  // Con muchas opciones, una lista desplegable nativa evita un formulario demasiado largo.
  if (slots.length > MAX_BOTONES) {
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-select`} className="text-xs font-semibold text-neutro-700">{label}</label>
        <select
          id={`${id}-select`}
          value={slots.includes(actual) ? actual : ''}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          aria-describedby={error ? `${id}-error` : undefined}
          className="min-h-11 w-full rounded-md border border-neutro-300 bg-white px-3 text-sm tabular-nums text-neutro-900 focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500 disabled:opacity-50"
        >
          <option value="" disabled>{t.elegirHora}</option>
          {slots.map((slot) => <option key={slot} value={slot}>{formatearHoraFranja(slot, locale)}</option>)}
        </select>
        {resumen}
        {error && <p id={`${id}-error`} role="alert" className="text-xs text-rojo-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p id={`${id}-label`} className="text-xs font-semibold text-neutro-700">{label}</p>
      <div role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={error ? `${id}-error` : undefined} className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots.map((slot, index) => {
          const elegido = slot === actual;
          return (
            <button
              key={slot}
              ref={(el) => { refs.current[index] = el; }}
              type="button"
              role="radio"
              aria-checked={elegido}
              tabIndex={slot === enfocable ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(slot)}
              onKeyDown={(event) => mover(event, index)}
              className={cn(
                'min-h-11 rounded-md border px-2 text-sm font-medium tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronce-600 disabled:cursor-not-allowed disabled:opacity-50',
                elegido ? 'border-bronce-600 bg-bronce-600 text-white' : 'border-neutro-300 bg-white text-neutro-800 hover:border-bronce-500',
              )}
            >
              {formatearHoraFranja(slot, locale)}
            </button>
          );
        })}
      </div>
      {resumen}
      {error && <p id={`${id}-error`} role="alert" className="text-xs text-rojo-600">{error}</p>}
    </div>
  );
}
