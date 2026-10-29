import React, { useEffect, useState } from 'react';
import { CalendarDays, Moon, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { MoneyReference } from '@/components/ui/MoneyReference';
import { usePublicInterface, usePublicTexts } from '@/i18n/public';
import { StayDateRange } from '@/features/habitaciones/public/StayDateRange';
import { GuestCount } from '@/features/habitaciones/public/GuestCount';
import { roomCriteriaErrors, toRoomQuery } from '@/features/habitaciones/public/roomSearch';
import type { HabitacionDisponiblePublico, HabitacionPublico } from '@/features/habitaciones/types';
import type { DisponibilidadHabitacionQuery } from '../types';

export interface ReservaDirectaProps {
  room: HabitacionPublico | null;
  siteId: number | null;
  query: DisponibilidadHabitacionQuery | null;
  /** Habitación con precio y noches calculados por el servidor; null si no está libre. */
  available: HabitacionDisponiblePublico | null;
  checking: boolean;
  loadError: boolean;
  onApply: (query: DisponibilidadHabitacionQuery) => void;
  onConfirm: (room: HabitacionDisponiblePublico) => void;
  onChooseOther: () => void;
}

/** Resumen de la habitación ya elegida: solo pide fechas si faltan y evita repetir el buscador general. */
export const ReservaDirecta: React.FC<ReservaDirectaProps> = ({ room, siteId, query, available, checking, loadError, onApply, onConfirm, onChooseOther }) => {
  const { p, date } = usePublicInterface();
  const textos = usePublicTexts('crearReserva');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ fecha_entrada: query?.fecha_entrada ?? '', fecha_salida: query?.fecha_salida ?? '' });
  const [guests, setGuests] = useState(String(query?.numero_huespedes ?? 2));
  const [showErrors, setShowErrors] = useState(false);
  // Las fechas llegan de la URL de forma asíncrona (sede validada, sesión): el borrador sigue a la consulta vigente.
  useEffect(() => {
    if (!query) return;
    setDraft({ fecha_entrada: query.fecha_entrada, fecha_salida: query.fecha_salida });
    setGuests(String(query.numero_huespedes));
  }, [query?.fecha_entrada, query?.fecha_salida, query?.numero_huespedes]);

  const errors = roomCriteriaErrors({ ...draft, numero_huespedes: guests, tipo_habitacion_id: '' });
  const capacity = room?.tipo?.capacidad_maxima;
  const overCapacity = Boolean(capacity && Number(guests) > capacity);
  const formVisible = !query || editing || (!checking && !available);

  const apply = () => {
    setShowErrors(true);
    if (Object.keys(errors).length || overCapacity || !siteId) return;
    setEditing(false);
    setShowErrors(false);
    onApply(toRoomQuery({ ...draft, numero_huespedes: guests, tipo_habitacion_id: '' }, siteId));
  };

  const typeName = room?.tipo?.nombre ?? p('room');
  const siteName = room?.sucursal?.nombre;
  return (
    <section aria-labelledby="direct-title" className="overflow-hidden rounded-2xl border border-bronce-200 bg-white shadow-sm">
      <div className="space-y-5 p-4 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-bronce-700">{p('directTitle')}</p>
            <h2 id="direct-title" className="mt-1 font-serif text-2xl text-neutro-900"><span lang="es">{typeName}</span></h2>
            {siteName && <p className="mt-1 flex items-center gap-1.5 text-sm text-neutro-700"><MapPin className="size-4" aria-hidden="true" /><span lang="es">{siteName}</span></p>}
          </div>
          <Button variant="ghost" size="sm" onClick={onChooseOther}>{p('directOther')}</Button>
        </div>

        {loadError && <Alert tone="error">{p('directLoadError')}</Alert>}
        {query && checking && <LoadingNotice label={p('directChecking')} />}

        {query && !checking && !available && !editing && !loadError && (
          <Alert tone="warning"><strong>{p('directUnavailable')}</strong> {p('directUnavailableHint')}</Alert>
        )}

        {query && available && !checking && (
          <dl className="grid gap-3 rounded-xl border border-bronce-100 bg-bronce-50/60 p-4 text-sm sm:grid-cols-3">
            <div className="flex items-start gap-2"><CalendarDays className="mt-0.5 size-4 text-bronce-700" aria-hidden="true" />
              <div><dt className="text-xs text-neutro-600">{p('stayDates')}</dt><dd className="font-semibold text-neutro-900">{date(query.fecha_entrada)} — {date(query.fecha_salida)}</dd></div></div>
            <div className="flex items-start gap-2"><Moon className="mt-0.5 size-4 text-bronce-700" aria-hidden="true" />
              <div><dt className="text-xs text-neutro-600">{p('nightlyRate')}</dt><dd className="font-semibold text-neutro-900"><MoneyReference amount={available.tarifa_noche} /> · {textos.nochesCalculadas(available.noches)}</dd></div></div>
            <div className="flex items-start gap-2"><Users className="mt-0.5 size-4 text-bronce-700" aria-hidden="true" />
              <div><dt className="text-xs text-neutro-600">{p('guests')}</dt><dd className="font-semibold text-neutro-900">{query.numero_huespedes}</dd></div></div>
            <div className="border-t border-bronce-200 pt-3 sm:col-span-3 flex flex-wrap items-baseline justify-between gap-2">
              <dt className="font-semibold text-neutro-800">{p('directTotalFinal')}</dt>
              <dd className="text-xl font-semibold text-neutro-900"><MoneyReference amount={available.total_estimado} /></dd>
            </div>
          </dl>
        )}

        {!query && !loadError && <p className="text-sm text-neutro-700">{p('directPickDates')}</p>}

        {formVisible && (
          <div className="space-y-4">
            <StayDateRange inline value={draft} onChange={setDraft}
              arrivalError={showErrors && errors.fecha_entrada ? p(errors.fecha_entrada) : undefined}
              departureError={showErrors && errors.fecha_salida ? p(errors.fecha_salida) : undefined} />
            <div className="max-w-xs">
              <GuestCount value={guests} onChange={setGuests} label={p('guests')} max={capacity}
                error={showErrors && errors.numero_huespedes ? p(errors.numero_huespedes) : overCapacity && capacity ? textos.capacidadPersonas(capacity) : undefined} />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={apply} disabled={checking || !siteId}>{p('directApply')}</Button>
              {editing && <Button variant="ghost" onClick={() => setEditing(false)}>{p('directCancelEdit')}</Button>}
            </div>
          </div>
        )}

        {query && available && !checking && !editing && (
          <div className="space-y-3">
            <p className="text-xs text-neutro-600">{p('directNoCharge')}</p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => onConfirm(available)}>{p('directConfirm')}</Button>
              <Button variant="ghost" onClick={() => { setDraft({ fecha_entrada: query.fecha_entrada, fecha_salida: query.fecha_salida }); setGuests(String(query.numero_huespedes)); setEditing(true); }}>{p('directChangeDates')}</Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
