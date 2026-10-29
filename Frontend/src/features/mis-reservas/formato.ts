import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import type { usePublicTexts } from '@/i18n/public';
import type { ReservaHabitacion } from '@/features/reservas';
import { textosMisReservas } from './textos';

const FECHA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const ID_POSITIVO = /^[1-9]\d*$/;
const MILISEGUNDOS_POR_DIA = 86_400_000;

interface FechaCalendario {
  anio: number;
  mes: number;
  dia: number;
}

/**
 * Lee AAAA-MM-DD como fecha de calendario, sin aplicar zonas horarias.
 * Devuelve null si el texto no representa una fecha real.
 */
function leerFechaCalendario(valor: unknown): FechaCalendario | null {
  if (typeof valor !== 'string') return null;

  const coincidencia = FECHA_ISO.exec(valor.trim());
  if (!coincidencia) return null;

  const anio = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const dia = Number(coincidencia[3]);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));

  if (
    fecha.getUTCFullYear() !== anio ||
    fecha.getUTCMonth() !== mes - 1 ||
    fecha.getUTCDate() !== dia
  ) {
    return null;
  }

  return { anio, mes, dia };
}

const formateadorFecha = new Intl.DateTimeFormat('es-GT', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * Presenta una fecha AAAA-MM-DD sin desplazar el día por conversiones horarias.
 * Si el valor no es una fecha válida, conserva el texto recibido.
 */
export function formatFechaCalendario(valor: string): string {
  const fecha = leerFechaCalendario(valor);
  if (!fecha) return valor;

  return formateadorFecha.format(
    new Date(Date.UTC(fecha.anio, fecha.mes - 1, fecha.dia)),
  );
}

/**
 * Diferencia en noches entre dos fechas de calendario.
 * Devuelve null cuando las fechas no son válidas o la salida no es posterior.
 */
export function calcularNoches(
  fechaEntrada: string,
  fechaSalida: string,
): number | null {
  const entrada = leerFechaCalendario(fechaEntrada);
  const salida = leerFechaCalendario(fechaSalida);
  if (!entrada || !salida) return null;

  const entradaMs = Date.UTC(entrada.anio, entrada.mes - 1, entrada.dia);
  const salidaMs = Date.UTC(salida.anio, salida.mes - 1, salida.dia);
  const noches = Math.round((salidaMs - entradaMs) / MILISEGUNDOS_POR_DIA);

  return noches > 0 ? noches : null;
}

/**
 * Formato de moneda GTQ: Q1,234.00.
 * No calcula importes: solo presenta el valor ya persistido por el backend.
 * Devuelve null cuando no existe un monto válido que mostrar.
 */
export function formatGTQ(
  monto: string | number | null | undefined,
): string | null {
  if (monto === null || monto === undefined || monto === '') return null;

  const valor = typeof monto === 'number' ? monto : Number(monto);
  if (!Number.isFinite(valor)) return null;

  return `Q${valor.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Valida el identificador de una reserva antes de consultar el backend.
 * Solo acepta enteros positivos seguros.
 */
export function parseReservaId(valor: string | undefined): number | null {
  if (typeof valor !== 'string') return null;

  const limpio = valor.trim();
  if (!ID_POSITIVO.test(limpio)) return null;

  const id = Number(limpio);
  return Number.isSafeInteger(id) ? id : null;
}

/** ¿La reserva requiere el catálogo de sedes para resolver el nombre de la sede? */
export function reservaNecesitaCatalogoSedes(
  reserva: ReservaHabitacion,
): boolean {
  const habitacion = reserva.Habitacion;
  return (
    !habitacion?.Sucursal?.nombre &&
    typeof habitacion?.sucursal_id === 'number'
  );
}

/**
 * Resuelve el nombre de la sede con la relación incluida y, si falta, con el
 * catálogo de sedes. Si el catálogo no está disponible, muestra el identificador
 * en lugar de inventar un nombre.
 */
export function resolverNombreSede(
  reserva: ReservaHabitacion,
  sedesPorId: ReadonlyMap<number, string>,
  textos: ReturnType<typeof usePublicTexts<'misReservas'>> = textosMisReservas,
): string {
  const nombreIncluido = reserva.Habitacion?.Sucursal?.nombre?.trim();
  if (nombreIncluido) return nombreIncluido;

  const sucursalId = reserva.Habitacion?.sucursal_id;
  if (typeof sucursalId !== 'number') {
    return textos.sinSede;
  }

  const nombreCatalogo = sedesPorId.get(sucursalId)?.trim();
  return (
    nombreCatalogo ||
    textos.sedePorIdentificador(sucursalId)
  );
}

/** La salida es hoy o ya pasó (fecha de Guatemala): no quedan noches por pagar. */
export const estanciaTerminada = (reserva: { fecha_salida: string }): boolean =>
  reserva.fecha_salida.slice(0, 10) <= getTodayInGuatemala();

export type VistaReservas = 'todas' | 'proximas' | 'pendientes' | 'historial';
export const vistaDeReserva = (reserva: { estado: string; fecha_salida: string }): Exclude<VistaReservas, 'todas'> => {
  const terminada = estanciaTerminada(reserva);
  if (['cancelada', 'expirada', 'finalizada'].includes(reserva.estado) || terminada) return 'historial';
  return reserva.estado === 'pendiente' ? 'pendientes' : 'proximas';
};
