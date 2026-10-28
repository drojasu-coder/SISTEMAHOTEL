import { useId } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { usePublicInterface } from '@/i18n/public';

export function GuestCount({ value, onChange, label, disabled, error }: {
  value: string; onChange: (value: string) => void; label: string; disabled?: boolean; error?: string;
}) {
  const id = useId();
  const { p } = usePublicInterface();
  const count = Number(value);
  const valid = Number.isSafeInteger(count) && count >= 1;
  return <div className="min-w-0 space-y-2">
    <label htmlFor={id} className="block text-xs font-semibold text-neutro-700">{label}</label>
    <div className="flex min-h-14 items-center gap-2 rounded-md border border-neutro-300 bg-white p-1">
      <Button variant="ghost" size="sm" aria-label={p('stayFewerGuests')} disabled={disabled || !valid || count <= 1} onClick={() => onChange(String(count - 1))}><Minus className="size-4" aria-hidden="true" /></Button>
      <input id={id} type="number" inputMode="numeric" min={1} step={1} value={value} disabled={disabled}
        aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}
        className="min-h-11 w-full min-w-0 border-0 bg-transparent text-center text-base font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-bronce-600"
        onChange={(event) => {
          const next = event.target.value;
          if (next === '' || (/^[1-9]\d*$/.test(next) && Number.isSafeInteger(Number(next)))) onChange(next);
        }} />
      <Button variant="ghost" size="sm" aria-label={p('stayMoreGuests')} disabled={disabled || (valid && count >= Number.MAX_SAFE_INTEGER)} onClick={() => onChange(String(valid ? count + 1 : 1))}><Plus className="size-4" aria-hidden="true" /></Button>
    </div>
    {error && <p id={`${id}-error`} role="alert" className="text-xs text-error-600">{error}</p>}
  </div>;
}
