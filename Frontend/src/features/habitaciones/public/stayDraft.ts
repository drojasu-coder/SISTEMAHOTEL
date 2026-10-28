import { parseCalendarDate } from '@/lib/dates';

export type StayDraft = { fecha_entrada: string; fecha_salida: string; numero_huespedes: string };
const KEY = 'hunahpu.stay-criteria.v1';

/** Solo transfiere criterios entre pantallas. La URL y la sede global conservan su autoridad. */
export function readStayDraft(): Partial<StayDraft> {
  try {
    const record = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
    if (record?.version !== 1 || !record.criteria || typeof record.criteria !== 'object') return {};
    const value = record.criteria;
    return {
      ...(typeof value.fecha_entrada === 'string' && parseCalendarDate(value.fecha_entrada) ? { fecha_entrada: value.fecha_entrada } : {}),
      ...(typeof value.fecha_salida === 'string' && parseCalendarDate(value.fecha_salida) ? { fecha_salida: value.fecha_salida } : {}),
      ...(typeof value.numero_huespedes === 'string' && /^[1-9]\d*$/.test(value.numero_huespedes) && Number.isSafeInteger(Number(value.numero_huespedes)) ? { numero_huespedes: value.numero_huespedes } : {}),
    };
  } catch { return {}; }
}

export function saveStayDraft(criteria: StayDraft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ version: 1, criteria: {
      fecha_entrada: criteria.fecha_entrada,
      fecha_salida: criteria.fecha_salida,
      numero_huespedes: criteria.numero_huespedes,
    } }));
  } catch { /* Los controles y la URL siguen funcionando sin almacenamiento. */ }
}
