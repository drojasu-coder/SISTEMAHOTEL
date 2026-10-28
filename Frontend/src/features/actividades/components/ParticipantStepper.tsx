import { useId } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/** Selector de cantidad con botones grandes; nunca sale del rango [min, max]. */
export function ParticipantStepper({ value, min = 1, max, onChange, label, decreaseLabel, increaseLabel, hint, disabled = false }: {
  value: number; min?: number; max: number; onChange: (value: number) => void;
  label: string; decreaseLabel: string; increaseLabel: string; hint?: string; disabled?: boolean;
}) {
  const id = useId();
  const clamp = (n: number) => Math.min(Math.max(n, min), Math.max(min, max));
  return <div className="space-y-1.5">
    <p id={`${id}-label`} className="text-sm font-medium text-neutro-800">{label}</p>
    <div role="group" aria-labelledby={`${id}-label`} className="flex items-center gap-3">
      <Button type="button" variant="secondary" size="sm" aria-label={decreaseLabel} disabled={disabled || value <= min} onClick={() => onChange(clamp(value - 1))} className="min-h-11 min-w-11">
        <Minus className="size-4" aria-hidden="true" />
      </Button>
      <output aria-live="polite" aria-labelledby={`${id}-label`} className="min-w-10 text-center text-lg font-semibold text-neutro-900">{value}</output>
      <Button type="button" variant="secondary" size="sm" aria-label={increaseLabel} disabled={disabled || value >= max} onClick={() => onChange(clamp(value + 1))} className="min-h-11 min-w-11">
        <Plus className="size-4" aria-hidden="true" />
      </Button>
    </div>
    {hint && <p className="text-xs text-neutro-600">{hint}</p>}
  </div>;
}
