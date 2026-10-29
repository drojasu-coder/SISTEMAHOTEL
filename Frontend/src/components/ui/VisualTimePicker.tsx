import { useId, useState } from 'react';

const MINUTES = ['00', '15', '30', '45'] as const;

export interface VisualTimePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** true si esa hora (HH:MM) ya se sabe ocupada: se muestra deshabilitada. */
  isBlocked?: (time: string) => boolean;
  /** Hora mínima elegible (HH:MM), p. ej. la de inicio al elegir la hora de fin. */
  min?: string;
  disabled?: boolean;
  error?: string;
  hourLabel: string;
  minuteLabel: string;
}

/**
 * Selector visual de hora (hora + minutos en cuartos). No presupone un horario de operación: ofrece las 24 horas y
 * solo deshabilita las que la consulta de disponibilidad ya informa como ocupadas. La validación definitiva es del servidor.
 */
export function VisualTimePicker({ label, value, onChange, isBlocked, min, disabled, error, hourLabel, minuteLabel }: VisualTimePickerProps) {
  const id = useId();
  const [hour, setHour] = useState(value ? value.slice(0, 2) : '');
  const current = value ? value.slice(0, 5) : '';
  const selectedHour = current ? current.slice(0, 2) : hour;
  const blocked = (time: string) => Boolean((min && time < min) || isBlocked?.(time));
  const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
  const base = 'min-h-10 rounded-md border px-1 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through';
  const on = 'border-bronce-600 bg-bronce-600 text-white';
  const off = 'border-neutro-300 bg-white text-neutro-800 hover:border-bronce-500';
  return <div className="space-y-2" role="group" aria-labelledby={`${id}-l`}>
    <p id={`${id}-l`} className="text-xs font-semibold text-neutro-700">{label}{current && <span className="ml-2 text-bronce-700">{current}</span>}</p>
    <div>
      <p className="sr-only">{hourLabel}</p>
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-12">
        {hours.map((item) => {
          const allBlocked = MINUTES.every((minute) => blocked(`${item}:${minute}`));
          return <button key={item} type="button" aria-pressed={selectedHour === item} disabled={disabled || allBlocked}
            className={`${base} ${selectedHour === item ? on : off}`}
            onClick={() => { setHour(item); const first = MINUTES.find((minute) => !blocked(`${item}:${minute}`)); const keep = current && current.slice(0, 2) === item ? current.slice(3) : first; if (keep) onChange(`${item}:${keep}`); }}>{item}</button>;
        })}
      </div>
    </div>
    <div>
      <p className="sr-only">{minuteLabel}</p>
      <div className="flex gap-1.5">
        {MINUTES.map((minute) => {
          const time = `${selectedHour || '00'}:${minute}`;
          return <button key={minute} type="button" aria-pressed={current === time} disabled={disabled || !selectedHour || blocked(time)}
            className={`${base} w-16 ${current === time ? on : off}`} onClick={() => onChange(time)}>:{minute}</button>;
        })}
      </div>
    </div>
    {error && <p role="alert" className="text-xs text-error-600">{error}</p>}
  </div>;
}
