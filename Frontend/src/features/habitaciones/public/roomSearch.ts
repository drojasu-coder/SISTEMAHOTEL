import { isValidCalendarDate, getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import type { ExtraKey } from '@/i18n/publicExtra';
import type { DisponibilidadHabitacionQuery, HabitacionDisponible } from '@/features/reservas/types';
import { reservasApi } from '@/features/reservas/api/reservasApi';
import { readStayDraft } from './stayDraft';

export type RoomCriteria = { fecha_entrada: string; fecha_salida: string; numero_huespedes: string; tipo_habitacion_id: string };
export const criteriaKeys = ['fecha_entrada', 'fecha_salida', 'numero_huespedes', 'tipo_habitacion_id'] as const;
export function readRoomCriteria(params: URLSearchParams): RoomCriteria {
  return { fecha_entrada: params.get('fecha_entrada') ?? '', fecha_salida: params.get('fecha_salida') ?? '', numero_huespedes: params.get('numero_huespedes') ?? '2', tipo_habitacion_id: params.get('tipo_habitacion_id') ?? '' };
}
/** Un solo destino de reserva; lleva contexto público, nunca importes ni estado financiero. */
export function roomReservationHref(params: URLSearchParams, site?: number, room?: { id: number; tipo: { id: number } | null }) {
  const next = new URLSearchParams();
  const siteId = site ?? Number(params.get('sucursal_id') ?? params.get('sede'));
  if (Number.isSafeInteger(siteId) && siteId > 0) next.set('sucursal_id', String(siteId));
  if (room) next.set('habitacion_id', String(room.id));
  const saved = readStayDraft();
  for (const key of criteriaKeys) {
    const value = params.has(key) ? params.get(key) : key === 'tipo_habitacion_id' ? undefined : saved[key];
    if (value) next.set(key, value);
  }
  if (room?.tipo) next.set('tipo_habitacion_id', String(room.tipo.id));
  return `/reservar${next.size ? `?${next}` : ''}`;
}
/** No cambia la intención del rango: las correcciones requieren una acción explícita. */
export function roomCriteriaErrors(criteria: RoomCriteria): Partial<Record<keyof RoomCriteria, ExtraKey>> {
  const errors: Partial<Record<keyof RoomCriteria, ExtraKey>> = {};
  if (!isValidCalendarDate(criteria.fecha_entrada)) errors.fecha_entrada = criteria.fecha_entrada ? 'validArrival' : 'requiredArrival';
  else if (criteria.fecha_entrada < getTodayInGuatemala()) errors.fecha_entrada = 'arrivalPast';
  if (!isValidCalendarDate(criteria.fecha_salida)) errors.fecha_salida = criteria.fecha_salida ? 'validDeparture' : 'requiredDeparture';
  else if (isValidCalendarDate(criteria.fecha_entrada) && criteria.fecha_salida <= criteria.fecha_entrada) errors.fecha_salida = 'departureAfter';
  if (!/^\d+$/.test(criteria.numero_huespedes) || !Number.isSafeInteger(Number(criteria.numero_huespedes)) || Number(criteria.numero_huespedes) < 1) errors.numero_huespedes = 'validGuests';
  if (criteria.tipo_habitacion_id && (!/^\d+$/.test(criteria.tipo_habitacion_id) || !Number.isSafeInteger(Number(criteria.tipo_habitacion_id)) || Number(criteria.tipo_habitacion_id) < 1)) errors.tipo_habitacion_id = 'invalidField';
  return errors;
}
export function toRoomQuery(criteria: RoomCriteria, site: number): DisponibilidadHabitacionQuery {
  return { sucursal_id: site, fecha_entrada: criteria.fecha_entrada, fecha_salida: criteria.fecha_salida, numero_huespedes: Number(criteria.numero_huespedes), ...(criteria.tipo_habitacion_id ? { tipo_habitacion_id: Number(criteria.tipo_habitacion_id) } : {}) };
}
export async function fetchRoomAvailability(criteria: RoomCriteria, sites: number[], isCancelled: () => boolean = () => false) {
  const rooms: HabitacionDisponible[] = [];
  const failures: number[] = [];
  // Dos consultas simultáneas; no se inicia el siguiente lote si la búsqueda ya fue cancelada.
  for (let index = 0; index < sites.length; index += 2) {
    if (isCancelled()) throw new DOMException('Search cancelled', 'AbortError');
    const batch = sites.slice(index, index + 2);
    const results = await Promise.allSettled(batch.map((site) => reservasApi.getDisponibilidad(toRoomQuery(criteria, site))));
    results.forEach((result, position) => {
      if (result.status === 'fulfilled') rooms.push(...result.value.filter((room) => room.sucursal_id === batch[position]));
      else failures.push(batch[position]);
    });
  }
  return { rooms, failures };
}

export { roomLoginState, saveRoomDraft } from '@/features/auth/reservationDraft';
