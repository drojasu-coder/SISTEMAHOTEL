import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, MapPin, Users } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { useLocale } from '@/i18n/LocaleContext';
import { formatAdminCalendarDate, formatAdminTimeOfDay } from '@/features/admin-core/adminDates';
import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { useDisponibilidadMesaQuery } from '@/features/restaurante/hooks/useReservasMesa';
import { estadoReservaMesa } from '@/features/restaurante/estadoReservaMesa';
import { useTextosAdminRestaurante } from '@/features/restaurante/adminTextos';
import { RESTAURANTE_ROUTES } from '@/features/restaurante/constants/routes';
import type { ReservaMesa } from '@/features/restaurante/types';
import { cn } from '@/lib/cn';
import { useTextosGestionMesas } from '../gestionTextos';
import type { Mesa } from '../types';

/**
 * Agenda de una mesa: ocupación por franjas de una fecha (calculada por el
 * servidor, sin lógica propia de disponibilidad) y sus reservas registradas.
 */
export const MesaAgendaModal: React.FC<{ mesa: Mesa | null; sede?: string; reservas: ReservaMesa[]; onClose: () => void }> = ({ mesa, sede, reservas, onClose }) => {
  const t = useTextosGestionMesas();
  const ta = useTextosAdminRestaurante();
  const { locale } = useLocale();
  const [fecha, setFecha] = useState(getTodayInGuatemala());
  const agenda = useDisponibilidadMesaQuery(mesa?.id, fecha, { enabled: Boolean(mesa) });
  if (!mesa) return null;
  const propias = reservas.filter((r) => r.mesa_id === mesa.id).sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`));
  const time = (value: string) => formatAdminTimeOfDay(value, locale);

  return <Modal open onClose={onClose} title={t.agendaTitulo(mesa.id)} closeLabel={t.cerrar}>
    <div className="flex flex-col gap-5">
      <div>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutro-600">
          <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-bronce-600" aria-hidden="true" /><span lang="es">{mesa.zona}</span>{sede && <> · <span lang="es">{sede}</span></>}</span>
          <span className="inline-flex items-center gap-1.5"><Users className="size-4 text-bronce-600" aria-hidden="true" />{t.personas(mesa.capacidad)}</span>
        </p>
      </div>

      <section aria-labelledby="agenda-dia" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 id="agenda-dia" className="text-sm font-semibold text-neutro-900">{t.ocupacionDia}</h3>
          <label className="flex items-center gap-2 text-xs text-neutro-600">{t.fecha}
            <input type="date" value={fecha} onChange={(event) => event.target.value && setFecha(event.target.value)} className="field-control !w-auto" /></label>
        </div>
        {agenda.isLoading && <LoadingNotice label={t.cargandoAgenda} />}
        {agenda.isError && <Alert tone="error">{t.errorAgenda}<Button className="mt-2" size="sm" variant="secondary" onClick={() => void agenda.refetch()}>{t.reintentar}</Button></Alert>}
        {agenda.data && <>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutro-600">
            <li className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-bronce-600" aria-hidden="true" />{t.ocupada}</li>
            <li className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm border border-neutro-300 bg-white" aria-hidden="true" />{t.libre}</li>
            <li className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-neutro-200" aria-hidden="true" />{t.pasada}</li>
          </ul>
          <ul className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
            {agenda.data.slots.map((slot) => {
              const state = slot.ocupada ? t.ocupada : slot.pasada ? t.pasada : t.libre;
              return <li key={slot.hora} title={`${time(slot.hora)} · ${state}`} aria-label={`${time(slot.hora)}: ${state}`}
                className={cn('rounded-md border px-1 py-1.5 text-center text-xs tabular-nums', slot.ocupada ? 'border-bronce-600 bg-bronce-600 font-semibold text-white' : slot.pasada ? 'border-neutro-200 bg-neutro-100 text-neutro-400' : 'border-neutro-300 bg-white text-neutro-700')}>
                {time(slot.hora)}
              </li>;
            })}
          </ul>
          <p className="text-xs text-neutro-500">{t.duracion(agenda.data.configuracion.duracion_minutos)}</p>
        </>}
      </section>

      <section aria-labelledby="agenda-reservas" className="space-y-2 border-t border-neutro-200 pt-4">
        <div className="flex items-center justify-between gap-3">
          <h3 id="agenda-reservas" className="text-sm font-semibold text-neutro-900">{t.reservasMesa} <span className="font-normal text-neutro-500">({propias.length})</span></h3>
          {propias.length > 0 && <Link to={`${RESTAURANTE_ROUTES.ADMIN_RESERVAS}?vista=todas&mesa=${mesa.id}`} className="text-xs font-semibold text-bronce-700 hover:underline">{t.verTodas}</Link>}
        </div>
        {propias.length === 0 ? <p className="py-3 text-sm text-neutro-600">{t.sinReservasMesa}</p> :
          <ul className="divide-y divide-neutro-100">{propias.slice(0, 8).map((r) => {
            const estado = estadoReservaMesa(r.estado, ta.estados);
            return <li key={r.id}><Link to={RESTAURANTE_ROUTES.ADMIN_DETALLE_RESERVA(r.id)} aria-label={t.verReserva(r.id)} className="flex items-center justify-between gap-3 rounded-md px-1 py-2.5 hover:bg-bronce-50/50">
              <span className="min-w-0"><span className="block text-sm font-medium text-neutro-900">{formatAdminCalendarDate(r.fecha, locale)} · {time(r.hora)}</span>
                <span className="block truncate text-xs text-neutro-600">#{r.id} · {r.Usuario?.nombre ?? '—'} · {ta.personas(r.numero_comensales)}</span></span>
              <span className="flex shrink-0 items-center gap-2"><span className={cn('rounded-full border px-2 py-0.5 text-xs font-semibold', estado.className)}>{estado.label}</span><ChevronRight className="size-4 text-neutro-400" aria-hidden="true" /></span>
            </Link></li>;
          })}</ul>}
      </section>
    </div>
  </Modal>;
};
