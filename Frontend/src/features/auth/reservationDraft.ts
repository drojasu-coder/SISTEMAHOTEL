import { isValidCalendarDate } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { safeReturnPath } from './secureReturn';
const DRAFT_KEY = 'hunahpu.room-search.v1';
const positive = (value: string) => /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));

/** El almacenamiento es entrada no confiable. No basta con JSON.parse o la versión. */
export function validatedRoomDraft(value: unknown): string | null {
  const path = safeReturnPath(value);
  if (!path || !/^\/habitaciones(?:\/[1-9]\d*)?(?:\?|$)/.test(path)) return null;
  const params = new URLSearchParams(path.split('?')[1]);
  const arrival = params.get('fecha_entrada'); const departure = params.get('fecha_salida');
  if (!arrival || !departure || !isValidCalendarDate(arrival) || !isValidCalendarDate(departure) || departure <= arrival) return null;
  for (const key of ['numero_huespedes', 'tipo_habitacion_id', 'sucursal_id']) if (params.has(key) && !positive(params.get(key)!)) return null;
  if (params.has('sede') && params.get('sede') !== 'all' && !positive(params.get('sede')!)) return null;
  if (params.has('buscar') && !['0', '1'].includes(params.get('buscar')!)) return null;
  if (params.has('pagina') && !positive(params.get('pagina')!)) return null;
  if (params.has('orden') && !['precio_asc', 'precio_desc', 'capacidad'].includes(params.get('orden')!)) return null;
  for (const key of ['min', 'max']) if (params.has(key) && !/^\d+(?:\.\d{1,2})?$/.test(params.get(key)!)) return null;
  // Las fechas pasadas se conservan para corrección explícita; 3A las revalida antes de consultar.
  return path;
}
export function saveRoomDraft(path: string) {
  try {
    const safe = validatedRoomDraft(path);
    if (safe) sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ version: 1, path: safe }));
    else sessionStorage.removeItem(DRAFT_KEY);
  } catch { /* Retorno en memoria/historial disponible aunque el almacenamiento esté bloqueado. */ }
}
export function restoreRoomDraft(): string | null {
  try {
    const data: unknown = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? 'null');
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    const record = data as Record<string, unknown>;
    if (record.version !== 1 || Object.keys(record).some((key) => !['version', 'path'].includes(key))) return null;
    return validatedRoomDraft(record.path);
  } catch { return null; }
}
export function roomLoginState(path: string) {
  const safe = safeReturnPath(path);
  const from = safe && /^\/habitaciones(?:\/[1-9]\d*)?(?:\?|$)/.test(safe) ? safe : '/habitaciones';
  saveRoomDraft(from);
  return { from };
}
