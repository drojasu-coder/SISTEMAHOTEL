import { useEffect, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { es, enUS } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import { Button } from '@/components/ui/Button';
import { DateField } from '@/components/ui/DateField';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Feedback';
import { usePublicInterface, usePublicTexts } from '@/i18n/public';
import { calendarDateKey, calendarNights, parseCalendarDate } from '@/lib/dates';
import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { roomCriteriaErrors, type RoomCriteria } from './roomSearch';

export function RoomSearchPanel({ criteria, onChange, onSearch, loading = false }: { criteria: RoomCriteria; onChange: (changes: Partial<RoomCriteria>) => void; onSearch: () => void; loading?: boolean }) {
  const { p, locale, date } = usePublicInterface();
  const t = usePublicTexts('crearReserva');
  const [open, setOpen] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const [attempted, setAttempted] = useState(Boolean(criteria.fecha_entrada || criteria.fecha_salida));
  const [changed, setChanged] = useState(false);
  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia('(min-width: 768px)');
    const update = () => setDesktop(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const today = getTodayInGuatemala();
  const errors = roomCriteriaErrors(criteria);
  const nights = calendarNights(criteria.fecha_entrada, criteria.fecha_salida);
  const update = (changes: Partial<RoomCriteria>) => { setChanged(true); onChange(changes); };
  const summary = nights ? `${date(criteria.fecha_entrada)} — ${date(criteria.fecha_salida)} · ${t.nochesCalculadas(nights)}` : p('roomNoDates');
  const proposedArrival = parseCalendarDate(criteria.fecha_entrada) && criteria.fecha_entrada >= today ? criteria.fecha_entrada : today;
  const proposedEnd = parseCalendarDate(proposedArrival)!; proposedEnd.setUTCDate(proposedEnd.getUTCDate() + 1);
  return <Card className="space-y-4">
    <form noValidate onSubmit={(event) => { event.preventDefault(); setAttempted(true); if (Object.keys(errors).length === 0) onSearch(); }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <DateField label={t.fechaEntradaLabel} value={criteria.fecha_entrada} min={today} required onChange={(event) => update({ fecha_entrada: event.target.value })} error={attempted && errors.fecha_entrada ? p(errors.fecha_entrada) : undefined} />
      <DateField label={t.fechaSalidaLabel} value={criteria.fecha_salida} min={criteria.fecha_entrada || today} required onChange={(event) => update({ fecha_salida: event.target.value })} error={attempted && errors.fecha_salida ? p(errors.fecha_salida) : undefined} />
      <Input type="number" min={1} step={1} required label={t.huespedesLabel} value={criteria.numero_huespedes} onChange={(event) => update({ numero_huespedes: event.target.value })} error={attempted && errors.numero_huespedes ? p(errors.numero_huespedes) : undefined} />
      <div className="flex items-end"><Button className="w-full" type="submit" isLoading={loading}>{p('roomSearch')}</Button></div>
    </form>
    <div className="flex flex-wrap items-center gap-3"><Button variant="ghost" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>{p('roomRange')}</Button><p role="status" className="text-sm text-neutro-600">{summary}</p></div>
    {changed && <p role="status" className="text-sm text-neutro-600">{p('roomDatesChanged')}</p>}
    {attempted && (errors.fecha_entrada || errors.fecha_salida) && <Alert tone="warning"><p>{p('roomArrivalProposed')}</p><p>{date(proposedArrival)} — {date(calendarDateKey(proposedEnd))}</p><Button variant="text" onClick={() => update({ fecha_entrada: proposedArrival, fecha_salida: calendarDateKey(proposedEnd) })}>{p('roomApplyDates')}</Button></Alert>}
    <Modal open={open} title={p('roomRange')} description={p('roomDateHelp')} closeLabel={p('closeModal')} onClose={() => setOpen(false)} className="!max-w-3xl">
      <div className="room-calendar flex flex-col items-center gap-4">
        <DayPicker mode="range" locale={locale === 'es' ? es : enUS} lang={locale} timeZone="UTC" noonSafe min={1} numberOfMonths={desktop ? 2 : 1} navLayout="after" defaultMonth={parseCalendarDate(criteria.fecha_entrada) ?? parseCalendarDate(today)} today={parseCalendarDate(today)} disabled={{ before: parseCalendarDate(today)! }} selected={{ from: parseCalendarDate(criteria.fecha_entrada), to: parseCalendarDate(criteria.fecha_salida) }} onSelect={(range) => update({ fecha_entrada: range?.from ? calendarDateKey(range.from) : '', fecha_salida: range?.to ? calendarDateKey(range.to) : '' })} footer={nights ? summary : p('roomDatesPending')} />
        <p className="text-sm text-neutro-600">{p('roomCalendarNoInventory')}</p><Button variant="secondary" onClick={() => setOpen(false)}>{p('roomUseRange')}</Button>
      </div>
    </Modal>
  </Card>;
}
