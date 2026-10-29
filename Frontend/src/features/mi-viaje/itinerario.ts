import type { ReservaActividad } from '@/features/actividades/types';
import type { ReservaAmenidad } from '@/features/amenidades/types';
import type { CitaBienestar } from '@/features/bienestar/types';
import type { ReservaHabitacion } from '@/features/reservas/types';

/**
 * Modelo de «Mi viaje»: solo los planes confirmados y programados del cliente,
 * construidos con las reservas propias que ya devuelven los endpoints de cada
 * módulo. Pendientes, canceladas, expiradas y anteriores siguen en «Mis reservas».
 *
 * Elegibilidad (reglas reales del backend, sin estados nuevos):
 * - Habitación: solo `confirmada`. El backend la confirma cuando el pago
 *   aprobado cubre el total; `pendiente` significa pago sin completar.
 * - Actividad, experiencia, amenidad y bienestar: solo `confirmada`. El backend
 *   las crea confirmadas y el pago posterior no cambia su estado.
 * - Además, el plan no debe haber terminado según la fecha y hora de Guatemala.
 *
 * No se inventan horarios: si la reserva solo tiene fecha, el evento queda sin hora.
 */

export type TipoEvento = 'actividad' | 'experiencia' | 'amenidad' | 'bienestar';

export interface EventoServicio {
  clave: string;
  tipo: TipoEvento;
  id: number;
  /** AAAA-MM-DD, fecha de calendario de Guatemala tal como la guarda el backend. */
  fecha: string;
  /** HH:MM o null cuando la reserva no registra una hora válida. */
  horaInicio: string | null;
  horaFin: string | null;
  titulo: string;
  sedeId: number | null;
  sedeNombre: string | null;
  /** Dirección de la sede, solo cuando el endpoint la incluye. */
  sedeDireccion: string | null;
  duracionMinutos: number | null;
  participantes: number | null;
  persona: string | null;
  mobiliario: string | null;
  /** Solo actividades por hora: si la reserva incluye equipo. */
  conEquipo: boolean | null;
}

export interface Estancia {
  clave: string;
  id: number;
  fechaEntrada: string;
  fechaSalida: string;
  noches: number | null;
  huespedes: number | null;
  habitacion: string | null;
  tipoHabitacion: string | null;
  sedeId: number | null;
  sedeNombre: string | null;
}

export interface DiaItinerario {
  fecha: string;
  eventos: EventoServicio[];
}

export type BloqueItinerario =
  | { tipo: 'estancia'; clave: string; inicio: string; estancia: Estancia; dias: DiaItinerario[] }
  | { tipo: 'servicios'; clave: string; inicio: string; fecha: string; sedeId: number | null; sedeNombre: string | null; eventos: EventoServicio[] };

/** Momento de referencia en Guatemala. */
export interface Ahora {
  fecha: string;
  hora: string;
}

const FECHA = /^(\d{4})-(\d{2})-(\d{2})/;
const HORA = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/;
const FRANJA = /^\s*([01]?\d|2[0-3]):([0-5]\d)\s*-\s*([01]?\d|2[0-3]):([0-5]\d)\s*$/;

/** Fecha y hora actuales en la zona del hotel (America/Guatemala). */
export function ahoraEnGuatemala(instante = new Date()): Ahora {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Guatemala',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(instante).map((p) => [p.type, p.value]),
  );
  return { fecha: `${partes.year}-${partes.month}-${partes.day}`, hora: `${partes.hour}:${partes.minute}` };
}

/** Fecha AAAA-MM-DD válida o null; nunca convierte zonas horarias. */
export function fechaCalendario(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const m = FECHA.exec(valor.trim());
  if (!m) return null;
  const [anio, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia
    ? `${m[1]}-${m[2]}-${m[3]}`
    : null;
}

/** HH:MM a partir de HH:MM o HH:MM:SS; null si no hay una hora real. */
export function horaReloj(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const m = HORA.exec(valor.trim());
  return m ? `${m[1]}:${m[2]}` : null;
}

const pad = (n: string) => n.padStart(2, '0');

/** Franja de amenidad «HH:MM-HH:MM». Si el texto no es una franja, no se deduce hora. */
export function leerFranja(valor: unknown): { inicio: string; fin: string } | null {
  if (typeof valor !== 'string') return null;
  const m = FRANJA.exec(valor);
  return m ? { inicio: `${pad(m[1])}:${m[2]}`, fin: `${pad(m[3])}:${m[4]}` } : null;
}

const minutos = (hora: string) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));

function duracionEntre(inicio: string | null, fin: string | null): number | null {
  if (!inicio || !fin) return null;
  const diferencia = minutos(fin) - minutos(inicio);
  return diferencia > 0 ? diferencia : null;
}

function nochesEntre(entrada: string, salida: string): number | null {
  const diferencia = (Date.parse(`${salida}T00:00:00Z`) - Date.parse(`${entrada}T00:00:00Z`)) / 86_400_000;
  return diferencia > 0 ? Math.round(diferencia) : null;
}

const idPositivo = (valor: unknown): number | null =>
  typeof valor === 'number' && Number.isSafeInteger(valor) && valor > 0 ? valor : null;

const texto = (valor: unknown): string | null =>
  typeof valor === 'string' && valor.trim() ? valor.trim() : null;

const confirmada = (estado: unknown) => estado === 'confirmada';

// ---------------------------------------------------------------------------
// Normalización por módulo: devuelve null si la reserva no es elegible.
// ---------------------------------------------------------------------------

export function estanciaDesdeReserva(reserva: ReservaHabitacion): Estancia | null {
  const entrada = fechaCalendario(reserva.fecha_entrada);
  const salida = fechaCalendario(reserva.fecha_salida);
  if (!confirmada(reserva.estado) || !entrada || !salida) return null;
  const habitacion = reserva.Habitacion;
  return {
    clave: `habitacion-${reserva.id}`,
    id: reserva.id,
    fechaEntrada: entrada,
    fechaSalida: salida,
    noches: nochesEntre(entrada, salida),
    huespedes: idPositivo(reserva.numero_huespedes),
    habitacion: texto(habitacion?.numero),
    tipoHabitacion: texto(habitacion?.TipoHabitacion?.nombre),
    sedeId: idPositivo(habitacion?.Sucursal?.id) ?? idPositivo(habitacion?.sucursal_id),
    sedeNombre: texto(habitacion?.Sucursal?.nombre),
  };
}

export function eventoDesdeActividad(reserva: ReservaActividad): EventoServicio | null {
  const fecha = fechaCalendario(reserva.fecha);
  if (!confirmada(reserva.estado) || !fecha || typeof reserva.id !== 'number') return null;
  const recurso = reserva.RecursoActividad;
  const horaInicio = horaReloj(reserva.hora_inicio);
  const horaFin = horaReloj(reserva.hora_fin);
  return {
    clave: `actividad-${reserva.id}`,
    tipo: recurso?.modalidad === 'experiencia' ? 'experiencia' : 'actividad',
    id: reserva.id,
    fecha,
    horaInicio,
    horaFin,
    titulo: texto(recurso?.nombre) ?? '',
    sedeId: idPositivo(recurso?.Sucursal?.id) ?? idPositivo(recurso?.sucursal_id),
    sedeNombre: texto(recurso?.Sucursal?.nombre),
    sedeDireccion: texto(recurso?.Sucursal?.direccion),
    duracionMinutos: duracionEntre(horaInicio, horaFin) ?? idPositivo(recurso?.duracion_minutos),
    participantes: idPositivo(reserva.numero_participantes),
    persona: texto(reserva.Instructor?.nombre),
    mobiliario: null,
    conEquipo: recurso?.modalidad === 'experiencia' || typeof reserva.con_equipo !== 'boolean' ? null : reserva.con_equipo,
  };
}

export function eventoDesdeAmenidad(reserva: ReservaAmenidad): EventoServicio | null {
  const fecha = fechaCalendario(reserva.fecha);
  if (!confirmada(reserva.estado) || !fecha) return null;
  const amenidad = reserva.Amenidad;
  const franja = leerFranja(reserva.franja_horaria);
  return {
    clave: `amenidad-${reserva.id}`,
    tipo: 'amenidad',
    id: reserva.id,
    fecha,
    horaInicio: franja?.inicio ?? null,
    horaFin: franja?.fin ?? null,
    titulo: texto(amenidad?.nombre) ?? '',
    sedeId: idPositivo(amenidad?.Sucursal?.id) ?? idPositivo(amenidad?.sucursal_id),
    sedeNombre: texto(amenidad?.Sucursal?.nombre),
    sedeDireccion: null,
    duracionMinutos: franja ? duracionEntre(franja.inicio, franja.fin) : null,
    participantes: null,
    persona: null,
    // El backend guarda «ninguno» cuando no se solicitó mobiliario.
    mobiliario: reserva.mobiliario?.trim().toLowerCase() === 'ninguno' ? null : texto(reserva.mobiliario),
    conEquipo: null,
  };
}

export function eventoDesdeCita(cita: CitaBienestar): EventoServicio | null {
  const fecha = fechaCalendario(cita.fecha);
  if (!confirmada(cita.estado) || !fecha || typeof cita.id !== 'number') return null;
  const horaInicio = horaReloj(cita.hora_inicio);
  const horaFin = horaReloj(cita.hora_fin);
  return {
    clave: `bienestar-${cita.id}`,
    tipo: 'bienestar',
    id: cita.id,
    fecha,
    horaInicio,
    horaFin,
    titulo: texto(cita.ServicioBienestar?.nombre) ?? '',
    // La sede de la cita es la del servicio; la del terapeuta solo se usa si el servicio no la indica.
    sedeId: idPositivo(cita.ServicioBienestar?.sucursal_id) ?? idPositivo(cita.Terapeuta?.sucursal_id),
    sedeNombre: null,
    sedeDireccion: null,
    duracionMinutos: duracionEntre(horaInicio, horaFin) ?? idPositivo(cita.ServicioBienestar?.duracion_minutos),
    participantes: null,
    persona: texto(cita.Terapeuta?.nombre),
    mobiliario: null,
    conEquipo: null,
  };
}

// ---------------------------------------------------------------------------
// Vigencia y agrupación cronológica
// ---------------------------------------------------------------------------

/** Un servicio sigue vigente hasta su hora de fin; sin hora, hasta el final del día. */
function servicioVigente(evento: EventoServicio, ahora: Ahora): boolean {
  if (evento.fecha !== ahora.fecha) return evento.fecha > ahora.fecha;
  const fin = evento.horaFin ?? evento.horaInicio;
  return fin === null || fin > ahora.hora;
}

/** Una estancia sigue vigente hasta su día de salida, inclusive. */
const estanciaVigente = (estancia: Estancia, ahora: Ahora) => estancia.fechaSalida >= ahora.fecha;

/** Orden dentro de un día: primero lo que solo tiene fecha, después por hora. */
export function compararEventos(a: EventoServicio, b: EventoServicio): number {
  if (a.horaInicio === b.horaInicio) return a.clave.localeCompare(b.clave);
  if (a.horaInicio === null) return -1;
  if (b.horaInicio === null) return 1;
  return a.horaInicio.localeCompare(b.horaInicio);
}

function agruparPorDia(eventos: EventoServicio[]): DiaItinerario[] {
  const dias = new Map<string, EventoServicio[]>();
  for (const evento of eventos) dias.set(evento.fecha, [...(dias.get(evento.fecha) ?? []), evento]);
  return [...dias.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, lista]) => ({ fecha, eventos: lista.sort(compararEventos) }));
}

/**
 * Un servicio pertenece a una estancia solo si ambos tienen sede conocida, es
 * la misma sede y la fecha cae entre la llegada y la salida. Si coincide con
 * más de una estancia, no se elige ninguna: se muestra como servicio suelto.
 */
function estanciaDelServicio(evento: EventoServicio, estancias: Estancia[]): Estancia | null {
  if (evento.sedeId === null) return null;
  const candidatas = estancias.filter((estancia) =>
    estancia.sedeId === evento.sedeId &&
    estancia.fechaEntrada <= evento.fecha &&
    evento.fecha <= estancia.fechaSalida,
  );
  return candidatas.length === 1 ? candidatas[0] : null;
}

export interface FuentesItinerario {
  habitaciones?: ReservaHabitacion[];
  actividades?: ReservaActividad[];
  amenidades?: ReservaAmenidad[];
  citas?: CitaBienestar[];
}

/** Planes confirmados vigentes y próximos, en orden cronológico. */
export function construirItinerario(fuentes: FuentesItinerario, ahora: Ahora): BloqueItinerario[] {
  const estancias = (fuentes.habitaciones ?? [])
    .map(estanciaDesdeReserva)
    .filter((e): e is Estancia => e !== null && estanciaVigente(e, ahora));
  const eventos = [
    ...(fuentes.actividades ?? []).map(eventoDesdeActividad),
    ...(fuentes.amenidades ?? []).map(eventoDesdeAmenidad),
    ...(fuentes.citas ?? []).map(eventoDesdeCita),
  ].filter((e): e is EventoServicio => e !== null && servicioVigente(e, ahora));

  const asignados = new Map<string, EventoServicio[]>();
  const sueltos = new Map<string, EventoServicio[]>();
  for (const evento of eventos) {
    const estancia = estanciaDelServicio(evento, estancias);
    if (estancia) {
      asignados.set(estancia.clave, [...(asignados.get(estancia.clave) ?? []), evento]);
    } else {
      const clave = `${evento.fecha}|${evento.sedeId ?? 'sin-sede'}`;
      sueltos.set(clave, [...(sueltos.get(clave) ?? []), evento]);
    }
  }

  const bloques: BloqueItinerario[] = estancias.map((estancia) => ({
    tipo: 'estancia',
    clave: estancia.clave,
    // Una estancia en curso se ordena por hoy, no por su llegada ya pasada.
    inicio: estancia.fechaEntrada > ahora.fecha ? estancia.fechaEntrada : ahora.fecha,
    estancia,
    dias: agruparPorDia(asignados.get(estancia.clave) ?? []),
  }));

  for (const [clave, lista] of sueltos) {
    const [primero] = lista;
    bloques.push({
      tipo: 'servicios',
      clave: `servicios-${clave}`,
      inicio: primero.fecha,
      fecha: primero.fecha,
      sedeId: primero.sedeId,
      sedeNombre: lista.find((e) => e.sedeNombre)?.sedeNombre ?? null,
      eventos: lista.sort(compararEventos),
    });
  }

  // A igual fecha, la estancia va primero; los grupos sueltos, por su primera hora.
  const primeraHora = (b: BloqueItinerario) => (b.tipo === 'servicios' ? b.eventos[0].horaInicio ?? '' : '');
  return bloques.sort((a, b) =>
    a.inicio.localeCompare(b.inicio) ||
    (a.tipo === b.tipo ? 0 : a.tipo === 'estancia' ? -1 : 1) ||
    primeraHora(a).localeCompare(primeraHora(b)) ||
    a.clave.localeCompare(b.clave),
  );
}
