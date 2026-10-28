import { reservaCitaSchema } from './schemas/bienestar.schemas';
import type { CreateCitaBienestarInput, CitaBienestar } from './types';

export type CitaBookingRecord = { phase: 'pending'; request: CreateCitaBienestarInput } | { phase: 'created'; id: number };
const key = (userId: number, serviceId: number) => `hunahpu.wellness-booking.v1.${userId}.${serviceId}`;
const positive = (id: unknown): id is number => typeof id === 'number' && Number.isSafeInteger(id) && id > 0;

/** Un puntero local nunca acredita una reserva: se recupera por su lectura autorizada. */
export function readCitaBooking(userId: number | undefined, serviceId: number): CitaBookingRecord | null {
  if (!userId) return null;
  try {
    const record = JSON.parse(sessionStorage.getItem(key(userId, serviceId)) ?? 'null');
    if (record?.phase === 'created' && positive(record.id)) return { phase: 'created', id: record.id };
    if (record?.phase === 'pending') {
      const parsed = reservaCitaSchema.safeParse(record.request);
      if (parsed.success && parsed.data.servicio_bienestar_id === serviceId) return { phase: 'pending', request: parsed.data };
    }
  } catch { /* Almacenamiento opcional; nunca guardar credenciales, precios ni URLs de medios. */ }
  return null;
}
export function saveCitaBooking(userId: number, serviceId: number, record: CitaBookingRecord | null) {
  try {
    if (record) sessionStorage.setItem(key(userId, serviceId), JSON.stringify(record));
    else sessionStorage.removeItem(key(userId, serviceId));
  } catch { /* El flujo en memoria conserva el identificador. */ }
}
export function isCitaForService(cita: CitaBienestar | undefined, serviceId: number): cita is CitaBienestar & { id: number } {
  return Boolean(cita && positive(cita.id) && cita.servicio_bienestar_id === serviceId &&
    typeof cita.fecha === 'string' && typeof cita.hora_inicio === 'string' && typeof cita.hora_fin === 'string' &&
    ['confirmada', 'cancelada', 'completada'].includes(cita.estado ?? ''));
}
export const normalizeCitaTime = (time: string) => time.length === 5 ? `${time}:00` : time;
