import { useLocale } from '@/i18n/LocaleContext';
import type { EstadoHabitacion } from './types';

/** Textos del inventario de habitaciones y de tipos (ES/EN). */
const es = {
  titulo: 'Habitaciones', resumen: (n: number) => `${n} ${n === 1 ? 'habitación' : 'habitaciones'}`,
  nueva: 'Nueva habitación',
  estadoFisico: 'Estado físico', estadoFisicoNota: 'Condición actual de la habitación; no indica reservas por fecha.',
  todos: 'Todas',
  estados: { disponible: 'Disponible', ocupada: 'Ocupada', limpieza: 'Limpieza', mantenimiento: 'Mantenimiento' } satisfies Record<EstadoHabitacion, string>,
  estadoDesconocido: 'Estado desconocido',
  buscar: 'Buscar por número', tipo: 'Tipo de habitación', todosTipos: 'Todos los tipos',
  capacidad: 'Capacidad', cualquierCapacidad: 'Cualquier capacidad', capacidadMin: (n: number) => `${n} o más personas`,
  limpiar: 'Limpiar filtros', reintentar: 'Reintentar',
  col: { habitacion: 'Habitación', tipo: 'Tipo', sede: 'Sede', tarifa: 'Tarifa por noche', estado: 'Estado físico', acciones: 'Acciones' },
  habitacion: (n: string) => `Habitación ${n}`, personas: (n: number) => `${n} ${n === 1 ? 'persona' : 'personas'}`,
  editar: 'Editar', cambiarEstado: 'Cambiar estado', reservas: 'Reservas',
  editarDe: (n: string) => `Editar habitación ${n}`, estadoDe: (n: string) => `Cambiar estado de la habitación ${n}`, reservasDe: (n: string) => `Ver reservas de la habitación ${n}`,
  sinTipo: 'Tipo no especificado', sinSede: 'Sede no especificada', sinTarifa: 'No disponible',
  sinResultados: 'Ninguna habitación coincide con los filtros.', vacio: 'No hay habitaciones registradas en las sedes seleccionadas.',
  pagina: (from: number, to: number, total: number) => `${from}–${to} de ${total}`, paginaDe: (p: number, t: number) => `Página ${p} de ${t}`,
  anterior: 'Página anterior', siguiente: 'Página siguiente',
  // Tipos de habitación
  tiposTitulo: 'Tipos de habitación', tiposResumen: (n: number) => `${n} ${n === 1 ? 'tipo' : 'tipos'}`, nuevoTipo: 'Nuevo tipo',
  buscarTipo: 'Buscar tipo por nombre', general: 'General (todas las sedes)', habitacionesTipo: 'Habitaciones',
  colTipo: { nombre: 'Tipo', sede: 'Sede', capacidad: 'Capacidad', tarifa: 'Tarifa por noche', habitaciones: 'Habitaciones', descripcion: 'Descripción', acciones: 'Acciones' },
  verHabitaciones: (n: string) => `Ver habitaciones del tipo ${n}`, editarTipo: (n: string) => `Editar tipo ${n}`, eliminarTipo: (n: string) => `Eliminar tipo ${n}`,
  sinTipos: 'Ningún tipo coincide con la búsqueda.',
};
const en: typeof es = {
  titulo: 'Rooms', resumen: (n: number) => `${n} ${n === 1 ? 'room' : 'rooms'}`,
  nueva: 'New room',
  estadoFisico: 'Physical status', estadoFisicoNota: 'Current room condition; it does not reflect reservations by date.',
  todos: 'All',
  estados: { disponible: 'Available', ocupada: 'Occupied', limpieza: 'Cleaning', mantenimiento: 'Maintenance' },
  estadoDesconocido: 'Unknown status',
  buscar: 'Search by number', tipo: 'Room type', todosTipos: 'All types',
  capacidad: 'Capacity', cualquierCapacidad: 'Any capacity', capacidadMin: (n: number) => `${n}+ people`,
  limpiar: 'Clear filters', reintentar: 'Retry',
  col: { habitacion: 'Room', tipo: 'Type', sede: 'Site', tarifa: 'Nightly rate', estado: 'Physical status', acciones: 'Actions' },
  habitacion: (n: string) => `Room ${n}`, personas: (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`,
  editar: 'Edit', cambiarEstado: 'Change status', reservas: 'Reservations',
  editarDe: (n: string) => `Edit room ${n}`, estadoDe: (n: string) => `Change status of room ${n}`, reservasDe: (n: string) => `View reservations for room ${n}`,
  sinTipo: 'Type not specified', sinSede: 'Site not specified', sinTarifa: 'Not available',
  sinResultados: 'No rooms match the filters.', vacio: 'No rooms recorded in the selected sites.',
  pagina: (from: number, to: number, total: number) => `${from}–${to} of ${total}`, paginaDe: (p: number, t: number) => `Page ${p} of ${t}`,
  anterior: 'Previous page', siguiente: 'Next page',
  tiposTitulo: 'Room types', tiposResumen: (n: number) => `${n} ${n === 1 ? 'type' : 'types'}`, nuevoTipo: 'New type',
  buscarTipo: 'Search type by name', general: 'General (all sites)', habitacionesTipo: 'Rooms',
  colTipo: { nombre: 'Type', sede: 'Site', capacidad: 'Capacity', tarifa: 'Nightly rate', habitaciones: 'Rooms', descripcion: 'Description', acciones: 'Actions' },
  verHabitaciones: (n: string) => `View rooms of type ${n}`, editarTipo: (n: string) => `Edit type ${n}`, eliminarTipo: (n: string) => `Delete type ${n}`,
  sinTipos: 'No types match the search.',
};
export type TextosInventario = typeof es;
export function useTextosInventario(): TextosInventario { const { locale } = useLocale(); return locale === 'en' ? en : es; }
