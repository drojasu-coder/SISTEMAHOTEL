import { useCallback, useState } from 'react';
import { isValidCalendarDate } from '@/features/crear-reserva/schemas/busquedaReservaSchema';

export type ServiceKind = 'restaurante' | 'bienestar' | 'amenidades' | 'actividades' | 'eventos';
type Draft = Record<string, unknown>;
const date = (v: unknown) => typeof v === 'string' && (v === '' || isValidCalendarDate(v));
const time = (v: unknown) => typeof v === 'string' && (v === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(v));
const positive = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v > 0;
const optionalId = (v: unknown) => v === '' || (typeof v === 'string' && /^[1-9]\d*$/.test(v) && Number.isSafeInteger(Number(v)));
const rules: Record<ServiceKind, Record<string, (v: unknown) => boolean>> = {
  restaurante: { fecha: date, hora: time, comensales: positive },
  bienestar: { fecha: date, hora_inicio: time, terapeuta_id: positive },
  amenidades: { fecha: date, horaInicio: time, horaFin: time, mobiliario: (v) => typeof v === 'string' && v.length <= 30 && !/[\u0000-\u001f]/.test(v) },
  actividades: { fecha: date, horaInicio: time, horaFin: time, instructorId: optionalId, conEquipo: (v) => typeof v === 'boolean' },
  eventos: { fecha: date, hora_inicio: time, hora_fin: time, numero_invitados: positive, tipo_evento: (v) => typeof v === 'string' && ['boda', 'cumpleanos', 'ejecutivo', 'convivio'].includes(v) },
};
const key = (kind: ServiceKind, id: number) => `hunahpu.service-draft.v1.${kind}.${id}`;
export function readServiceDraft(kind: ServiceKind, id: number): Draft {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(key(kind, id)) ?? 'null');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const draft = value as Draft;
    if (Object.entries(draft).some(([field, v]) => !Object.hasOwn(rules[kind], field) || !rules[kind][field](v))) return {};
    return draft;
  } catch { return {}; }
}
export function saveServiceDraft(kind: ServiceKind, id: number, value: Draft) {
  try {
    // Solo elecciones de formulario; nunca identidad, precios, medios ni estados de reserva.
    const draft = Object.fromEntries(Object.entries(value).filter(([field, v]) => Object.hasOwn(rules[kind], field) && rules[kind][field](v)));
    sessionStorage.setItem(key(kind, id), JSON.stringify(draft));
  } catch { /* El formulario en memoria sigue operativo. */ }
}
export function useServiceDraft<T extends Draft>(kind: ServiceKind, id: number, defaults: T) {
  const [initial] = useState<T>(() => ({ ...defaults, ...readServiceDraft(kind, id) }));
  const save = useCallback((value: Draft) => saveServiceDraft(kind, id, value), [kind, id]);
  const clear = useCallback(() => { try { sessionStorage.removeItem(key(kind, id)); } catch { /* opcional */ } }, [kind, id]);
  return { initial, save, clear };
}
