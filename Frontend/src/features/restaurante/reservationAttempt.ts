import { validMesaReservationFields, type MesaReservationFields } from './reservationValidation';

const key = (id: number) => `hunahpu.restaurant-attempt.v1.${id}`;
/** Solo elecciones enviadas. Sin tokens, identidad, precios ni confirmaciones inventadas. */
export function readMesaAttempt(id: number): MesaReservationFields | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(key(id)) ?? 'null');
    if (value && typeof value.fecha === 'string' && typeof value.hora === 'string' && validMesaReservationFields(value)) {
      return { fecha: value.fecha, hora: value.hora, numero_comensales: value.numero_comensales };
    }
  } catch { /* Almacenamiento opcional. */ }
  return null;
}
export function saveMesaAttempt(id: number, value: MesaReservationFields | null) {
  try {
    if (value) sessionStorage.setItem(key(id), JSON.stringify(value));
    else sessionStorage.removeItem(key(id));
  } catch { /* El bloqueo en memoria permanece activo. */ }
}
