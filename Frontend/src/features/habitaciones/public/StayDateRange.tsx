import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
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
export function StayDateRange({ value, onChange, disabled, arrivalError, departureError, inline = false }: {
  value: Range; onChange: (range: Range) => void; disabled?: boolean; arrivalError?: string; departureError?: string; inline?: boolean;
}) {
  const { p, locale, date } = usePublicInterface();
  const t = usePublicTexts('crearReserva');
  const id = useId();
  const [open, setOpen] = useState(false);
  const [modalDraft, setModalDraft] = useState(value);
  const draft = inline ? value : modalDraft;
  const setDraft = inline ? onChange : setModalDraft;
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
  // Mes visible controlado: navegar nunca altera la selección y la selección propia no mueve el calendario.
  const [shown, setShown] = useState<Date | undefined>(() => parseCalendarDate(draft.fecha_entrada) ?? parseCalendarDate(today));
  const ownChange = useRef(false);
  useEffect(() => {
    if (ownChange.current) { ownChange.current = false; return; }
    const arrival = parseCalendarDate(draft.fecha_entrada);
    if (arrival) setShown(arrival);
  }, [draft.fecha_entrada]);
  const nights = calendarNights(value.fecha_entrada, value.fecha_salida);
  const draftNights = calendarNights(draft.fecha_entrada, draft.fecha_salida);
  const valid = Boolean(draftNights && draft.fecha_entrada >= today);
  const summary = nights ? `${date(value.fecha_entrada)} — ${date(value.fecha_salida)} · ${t.nochesCalculadas(nights)}` : p('roomNoDates');
  const errors = [arrivalError, departureError].filter(Boolean);
  const firstDeparture = parseCalendarDate(draft.fecha_entrada);
  if (firstDeparture) firstDeparture.setUTCDate(firstDeparture.getUTCDate() + 1);
  const calendar = (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3" role="group" aria-label={p('stayEditDate')}>
          <Button variant={editing === 'arrival' ? 'primary' : 'secondary'} aria-pressed={editing === 'arrival'} disabled={disabled} data-stay-arrival onClick={() => setEditing('arrival')}>
            <span>{p('stayArrival')}<span className="mt-1 block text-xs">{parseCalendarDate(draft.fecha_entrada) ? date(draft.fecha_entrada) : p('stayChoose')}</span></span>
          </Button>
          <Button variant={editing === 'departure' ? 'primary' : 'secondary'} aria-pressed={editing === 'departure'} disabled={disabled || !parseCalendarDate(draft.fecha_entrada)} onClick={() => setEditing('departure')}>
            <span>{p('stayDeparture')}<span className="mt-1 block text-xs">{parseCalendarDate(draft.fecha_salida) ? date(draft.fecha_salida) : p('stayChoose')}</span></span>
          </Button>
        </div>
        <div className="room-calendar flex min-w-0 justify-center">
          <DayPicker mode="range" locale={locale === 'es' ? es : enUS} lang={locale} timeZone="UTC" noonSafe min={1}
            style={{ '--rdp-day-width': 'clamp(32px, calc((100vw - 96px) / 7), 44px)', '--rdp-day-height': '44px', '--rdp-day_button-width': 'var(--rdp-day-width)', '--rdp-day_button-height': '44px', '--rdp-months-gap': '1.5rem' } as CSSProperties}
            numberOfMonths={desktop ? 2 : 1} fixedWeeks={desktop} navLayout="around"
            startMonth={parseCalendarDate(today)}
            month={shown} onMonthChange={setShown} today={parseCalendarDate(today)}
            disabled={disabled ? true : { before: editing === 'departure' && firstDeparture && calendarDateKey(firstDeparture) > today ? firstDeparture : parseCalendarDate(today)! }}
            selected={{ from: parseCalendarDate(draft.fecha_entrada), to: parseCalendarDate(draft.fecha_salida) }}
            onSelect={(_range, selectedDay) => {
              const selected = calendarDateKey(selectedDay);
              if (disabled || selected < today) return;
              if (editing === 'arrival') {
                ownChange.current = selected !== draft.fecha_entrada;
                // Una nueva llegada reinicia la salida: no se arrastra una estancia anterior sin que el cliente la elija.
                setDraft({ fecha_entrada: selected, fecha_salida: '' });
                setEditing('departure');
              } else if (draft.fecha_entrada && selected > draft.fecha_entrada) {
                setDraft({ ...draft, fecha_salida: selected });
                if (inline) setEditing('arrival');
              }
            }}
          />
        </div>
        {!inline && <div className="rounded-lg border border-neutro-200 p-3">
          <Button variant="text" aria-expanded={manual} aria-controls={`${id}-manual`} onClick={() => setManual(!manual)}>{p('stayManualDates')}</Button>
          {manual && <div id={`${id}-manual`} className="grid gap-3 pt-3 sm:grid-cols-2">
            <DateField label={t.fechaEntradaLabel} value={draft.fecha_entrada} min={today} onChange={(event) => setDraft({ ...draft, fecha_entrada: event.target.value })} />
            <DateField label={t.fechaSalidaLabel} value={draft.fecha_salida} min={firstDeparture ? calendarDateKey(firstDeparture) : today} onChange={(event) => setDraft({ ...draft, fecha_salida: event.target.value })} />
          </div>}
          {!valid && <p className="mt-2 text-xs text-neutro-600">{p('stayValidRange')}</p>}
        </div>}
        <div className={inline ? "flex min-h-11 items-center justify-between gap-3 border-t border-bronce-100 pt-4" : "sticky -bottom-4 -mx-4 flex flex-col gap-3 border-t border-neutro-200 bg-white p-4 shadow-sm sm:-bottom-6 sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:p-5"}>
          <div><p role="status" aria-live="polite" className="text-center text-sm font-medium text-neutro-700">
          {valid ? (inline ? t.nochesCalculadas(draftNights!) : `${date(draft.fecha_entrada)} — ${date(draft.fecha_salida)} · ${t.nochesCalculadas(draftNights!)}`) : p(editing === 'arrival' ? 'stayChooseArrival' : 'roomDatesPending')}
        </p>{!inline && <p className="mt-2 text-xs text-neutro-600">{p('roomCalendarNoInventory')}</p>}</div>
          {!inline && <Button disabled={!valid} onClick={() => { onChange(draft); setOpen(false); }}>{p('roomUseRange')}</Button>}
        </div>
      </div>
  );
  return <div className="min-w-0 space-y-2">
    {!inline && <><span id={`${id}-label`} className="text-xs font-semibold text-neutro-700">{p('stayDates')}</span>
    <Button type="button" variant="secondary" className="min-h-14 w-full justify-start whitespace-normal text-left"
      aria-labelledby={`${id}-label ${id}-summary`} aria-haspopup="dialog" aria-expanded={open}
      aria-invalid={errors.length > 0} aria-describedby={errors.length ? `${id}-errors` : undefined} disabled={disabled}
      onClick={() => { setDraft(value); setManual(false); setEditing(value.fecha_entrada && !value.fecha_salida ? 'departure' : 'arrival'); setOpen(true); }}>
      <CalendarDays className="size-5 shrink-0 text-bronce-600" aria-hidden="true" />
      <span id={`${id}-summary`} className="text-sm">{summary}</span>
    </Button>
    </>}
    {errors.length > 0 && <div id={`${id}-errors`} className="text-xs text-error-600">{errors.map((error) => <p key={error} role="alert">{error}</p>)}</div>}
    {inline ? calendar : (
    <Modal open={open} title={p('roomRange')} description={p('stayCalendarHelp')} closeLabel={p('closeModal')}
      onClose={() => setOpen(false)} className="!max-w-4xl">
      {calendar}
    </Modal>)}
  </div>;
}
