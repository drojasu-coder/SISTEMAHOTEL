import { useEffect, useId, useState, type CSSProperties } from 'react';
import { CalendarDays } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { es, enUS } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import { Button } from '@/components/ui/Button';
import { DateField } from '@/components/ui/DateField';
import { Modal } from '@/components/ui/Modal';
import { usePublicInterface, usePublicTexts } from '@/i18n/public';
import { calendarDateKey, calendarNights, parseCalendarDate } from '@/lib/dates';
import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';

type Range = { fecha_entrada: string; fecha_salida: string };
export function StayDateRange({ value, onChange, disabled, arrivalError, departureError }: {
  value: Range; onChange: (range: Range) => void; disabled?: boolean; arrivalError?: string; departureError?: string;
}) {
  const { p, locale, date } = usePublicInterface();
  const t = usePublicTexts('crearReserva');
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState<'arrival' | 'departure'>('arrival');
  const [desktop, setDesktop] = useState(false);
  const [manual, setManual] = useState(false);
  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia('(min-width: 768px)');
    const update = () => setDesktop(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const today = getTodayInGuatemala();
  const nights = calendarNights(value.fecha_entrada, value.fecha_salida);
  const draftNights = calendarNights(draft.fecha_entrada, draft.fecha_salida);
  const valid = Boolean(draftNights && draft.fecha_entrada >= today);
  const summary = nights ? `${date(value.fecha_entrada)} — ${date(value.fecha_salida)} · ${t.nochesCalculadas(nights)}` : p('roomNoDates');
  const errors = [arrivalError, departureError].filter(Boolean);
  const firstDeparture = parseCalendarDate(draft.fecha_entrada);
  if (firstDeparture) firstDeparture.setUTCDate(firstDeparture.getUTCDate() + 1);
  return <div className="min-w-0 space-y-2">
    <span id={`${id}-label`} className="text-xs font-semibold text-neutro-700">{p('stayDates')}</span>
    <Button type="button" variant="secondary" className="min-h-14 w-full justify-start whitespace-normal text-left"
      aria-labelledby={`${id}-label ${id}-summary`} aria-haspopup="dialog" aria-expanded={open}
      aria-invalid={errors.length > 0} aria-describedby={errors.length ? `${id}-errors` : undefined} disabled={disabled}
      onClick={() => { setDraft(value); setManual(false); setEditing(value.fecha_entrada && !value.fecha_salida ? 'departure' : 'arrival'); setOpen(true); }}>
      <CalendarDays className="size-5 shrink-0 text-bronce-600" aria-hidden="true" />
      <span id={`${id}-summary`} className="text-sm">{summary}</span>
    </Button>
    {errors.length > 0 && <div id={`${id}-errors`} className="text-xs text-error-600">{errors.map((error) => <p key={error} role="alert">{error}</p>)}</div>}
    <Modal open={open} title={p('roomRange')} description={p('stayCalendarHelp')} closeLabel={p('closeModal')}
      onClose={() => setOpen(false)} className="!max-w-4xl">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3" role="group" aria-label={p('stayEditDate')}>
          <Button variant={editing === 'arrival' ? 'primary' : 'secondary'} aria-pressed={editing === 'arrival'} onClick={() => setEditing('arrival')}>
            <span>{p('stayArrival')}<span className="mt-1 block text-xs">{parseCalendarDate(draft.fecha_entrada) ? date(draft.fecha_entrada) : p('stayChoose')}</span></span>
          </Button>
          <Button variant={editing === 'departure' ? 'primary' : 'secondary'} aria-pressed={editing === 'departure'} disabled={!parseCalendarDate(draft.fecha_entrada)} onClick={() => setEditing('departure')}>
            <span>{p('stayDeparture')}<span className="mt-1 block text-xs">{parseCalendarDate(draft.fecha_salida) ? date(draft.fecha_salida) : p('stayChoose')}</span></span>
          </Button>
        </div>
        <div className="room-calendar flex justify-center">
          <DayPicker mode="range" locale={locale === 'es' ? es : enUS} lang={locale} timeZone="UTC" noonSafe min={1}
            style={{ '--rdp-day-width': 'clamp(36px, calc((100vw - 72px) / 7), 44px)', '--rdp-day-height': '44px', '--rdp-day_button-width': 'var(--rdp-day-width)', '--rdp-day_button-height': '44px', '--rdp-months-gap': '1.5rem' } as CSSProperties}
            numberOfMonths={desktop ? 2 : 1} navLayout="after"
            startMonth={parseCalendarDate(today)}
            defaultMonth={parseCalendarDate(draft.fecha_entrada) ?? parseCalendarDate(today)} today={parseCalendarDate(today)}
            disabled={{ before: editing === 'departure' && firstDeparture && calendarDateKey(firstDeparture) > today ? firstDeparture : parseCalendarDate(today)! }}
            selected={{ from: parseCalendarDate(draft.fecha_entrada), to: parseCalendarDate(draft.fecha_salida) }}
            onSelect={(_range, selectedDay) => {
              const selected = calendarDateKey(selectedDay);
              if (selected < today) return;
              if (editing === 'arrival') {
                setDraft({ fecha_entrada: selected, fecha_salida: draft.fecha_salida > selected ? draft.fecha_salida : '' });
                setEditing('departure');
              } else if (draft.fecha_entrada && selected > draft.fecha_entrada) {
                setDraft({ ...draft, fecha_salida: selected });
              }
            }}
          />
        </div>
        <div className="rounded-lg border border-neutro-200 p-3">
          <Button variant="text" aria-expanded={manual} aria-controls={`${id}-manual`} onClick={() => setManual(!manual)}>{p('stayManualDates')}</Button>
          {manual && <div id={`${id}-manual`} className="grid gap-3 pt-3 sm:grid-cols-2">
            <DateField label={t.fechaEntradaLabel} value={draft.fecha_entrada} min={today} onChange={(event) => setDraft({ ...draft, fecha_entrada: event.target.value })} />
            <DateField label={t.fechaSalidaLabel} value={draft.fecha_salida} min={firstDeparture ? calendarDateKey(firstDeparture) : today} onChange={(event) => setDraft({ ...draft, fecha_salida: event.target.value })} />
          </div>}
          {!valid && <p className="mt-2 text-xs text-neutro-600">{p('stayValidRange')}</p>}
        </div>
        <div className="sticky -bottom-4 -mx-4 flex flex-col gap-3 border-t border-neutro-200 bg-white p-4 shadow-sm sm:-bottom-6 sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div><p role="status" aria-live="polite" className="text-center text-sm font-medium text-neutro-700">
          {valid ? `${date(draft.fecha_entrada)} — ${date(draft.fecha_salida)} · ${t.nochesCalculadas(draftNights!)}` : p(editing === 'arrival' ? 'stayChooseArrival' : 'roomDatesPending')}
        </p><p className="mt-2 text-xs text-neutro-600">{p('roomCalendarNoInventory')}</p></div>
          <Button disabled={!valid} onClick={() => { onChange(draft); setOpen(false); }}>{p('roomUseRange')}</Button>
        </div>
      </div>
    </Modal>
  </div>;
}
