import { useLocale } from '@/i18n/LocaleContext';
import type { EstadoReservaEvento, TipoEvento } from './types';

/** Textos de la administración de eventos y salones (ES/EN). */
const es = {
  modulo: 'Eventos y salones', nav: { salones: 'Salones', reservas: 'Reservas', servicios: 'Servicios adicionales' }, navLabel: 'Secciones de eventos',
  cerrar: 'Cerrar', reintentar: 'Reintentar', cargando: 'Cargando…', limpiar: 'Limpiar filtros', sinFoto: 'Sin fotografía',
  // Salones
  salonesResumen: (n: number, plazas: number) => `${n} ${n === 1 ? 'salón' : 'salones'} · capacidad total ${plazas}`,
  nuevoSalon: 'Nuevo salón', buscar: 'Buscar salón por nombre', capacidad: 'Capacidad', cualquierCapacidad: 'Cualquier capacidad', capacidadMin: (n: number) => `${n} o más personas`,
  imagen: 'Fotografía', todasImagenes: 'Con y sin fotografía', conImagen: 'Con fotografía', sinImagen: 'Sin fotografía',
  col: { salon: 'Salón', sede: 'Sede', capacidad: 'Capacidad', tarifa: 'Tarifa base', proximos: 'Próximos eventos', acciones: 'Acciones' },
  personas: (n: number) => `${n} ${n === 1 ? 'persona' : 'personas'}`, reservas: 'Reservas', reservasDe: (n: string) => `Ver reservas de ${n}`,
  editar: 'Editar', editarDe: (n: string) => `Editar ${n}`, eliminar: 'Eliminar', eliminarDe: (n: string) => `Eliminar ${n}`,
  vacio: 'No hay salones registrados en las sedes seleccionadas.', sinResultados: 'Ningún salón coincide con los filtros.',
  eliminarTitulo: '¿Eliminar este salón?', eliminarDesc: (n: string) => `Se eliminará «${n}». Esta acción no se puede deshacer y el servidor la rechaza si el salón tiene reservas.`, eliminando: 'Eliminando…', cancelar: 'Cancelar',
  // Reservas
  reservasTitulo: 'Reservas de eventos', reservasResumen: (n: number) => `${n} ${n === 1 ? 'reserva' : 'reservas'} en las sedes seleccionadas`, hoy: 'Hoy',
  vistas: { hoy: 'Hoy', proximos: 'Próximos', historial: 'Historial' }, vistasLabel: 'Vista de eventos',
  buscarReserva: 'Buscar por número, cliente, correo o salón', salon: 'Salón', todosSalones: 'Todos los salones', fecha: 'Fecha', estado: 'Estado', todosEstados: 'Todos los estados',
  colR: { reserva: 'Reserva', fechaHora: 'Fecha y horario', evento: 'Evento y salón', cliente: 'Cliente', invitados: 'Invitados', total: 'Total', estado: 'Estado', acciones: 'Acciones' },
  anticipo: (v: string) => `Anticipo ${v}`, verReserva: (id: number) => `Ver detalle de la reserva #${id}`, cambiarEstado: 'Cambiar estado', cambiarEstadoDe: (id: number) => `Cambiar estado de la reserva #${id}`,
  vacioR: { hoy: 'No hay eventos para hoy.', proximos: 'No hay eventos próximos.', historial: 'No hay eventos anteriores.', filtros: 'Ninguna reserva coincide con los filtros.' },
  filtroSalon: (n: string) => `Salón: ${n}`, quitarSalon: 'Quitar filtro de salón', errorReservas: 'No fue posible cargar las reservas de eventos.',
  tipos: { boda: 'Boda', cumpleanos: 'Cumpleaños / celebración', ejecutivo: 'Corporativo / ejecutivo', convivio: 'Convivio / social' } satisfies Record<TipoEvento, string>,
  estados: { cotizacion: 'Cotización', confirmada: 'Confirmada', cancelada: 'Cancelada', finalizada: 'Finalizada', expirada: 'Expirada' } satisfies Record<EstadoReservaEvento | 'expirada', string>,
};
const en: typeof es = {
  modulo: 'Events and venues', nav: { salones: 'Venues', reservas: 'Reservations', servicios: 'Additional services' }, navLabel: 'Event sections',
  cerrar: 'Close', reintentar: 'Retry', cargando: 'Loading…', limpiar: 'Clear filters', sinFoto: 'No photo',
  salonesResumen: (n: number, seats: number) => `${n} ${n === 1 ? 'venue' : 'venues'} · total capacity ${seats}`,
  nuevoSalon: 'New venue', buscar: 'Search venue by name', capacidad: 'Capacity', cualquierCapacidad: 'Any capacity', capacidadMin: (n: number) => `${n}+ people`,
  imagen: 'Photo', todasImagenes: 'With and without photo', conImagen: 'With photo', sinImagen: 'Without photo',
  col: { salon: 'Venue', sede: 'Site', capacidad: 'Capacity', tarifa: 'Base rate', proximos: 'Upcoming events', acciones: 'Actions' },
  personas: (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`, reservas: 'Reservations', reservasDe: (n: string) => `View reservations for ${n}`,
  editar: 'Edit', editarDe: (n: string) => `Edit ${n}`, eliminar: 'Delete', eliminarDe: (n: string) => `Delete ${n}`,
  vacio: 'No venues recorded in the selected sites.', sinResultados: 'No venues match the filters.',
  eliminarTitulo: 'Delete this venue?', eliminarDesc: (n: string) => `“${n}” will be deleted. This cannot be undone, and the server rejects it if the venue has reservations.`, eliminando: 'Deleting…', cancelar: 'Cancel',
  reservasTitulo: 'Event reservations', reservasResumen: (n: number) => `${n} ${n === 1 ? 'reservation' : 'reservations'} in the selected sites`, hoy: 'Today',
  vistas: { hoy: 'Today', proximos: 'Upcoming', historial: 'History' }, vistasLabel: 'Event view',
  buscarReserva: 'Search by number, customer, email or venue', salon: 'Venue', todosSalones: 'All venues', fecha: 'Date', estado: 'Status', todosEstados: 'All statuses',
  colR: { reserva: 'Reservation', fechaHora: 'Date and time', evento: 'Event and venue', cliente: 'Customer', invitados: 'Guests', total: 'Total', estado: 'Status', acciones: 'Actions' },
  anticipo: (v: string) => `Deposit ${v}`, verReserva: (id: number) => `View details of reservation #${id}`, cambiarEstado: 'Change status', cambiarEstadoDe: (id: number) => `Change status of reservation #${id}`,
  vacioR: { hoy: 'No events today.', proximos: 'No upcoming events.', historial: 'No past events.', filtros: 'No reservations match the filters.' },
  filtroSalon: (n: string) => `Venue: ${n}`, quitarSalon: 'Remove venue filter', errorReservas: 'Event reservations could not be loaded.',
  tipos: { boda: 'Wedding', cumpleanos: 'Birthday / celebration', ejecutivo: 'Corporate / executive', convivio: 'Social gathering' },
  estados: { cotizacion: 'Quote', confirmada: 'Confirmed', cancelada: 'Cancelled', finalizada: 'Completed', expirada: 'Expired' },
};
export type TextosGestionEventos = typeof es;
export function useTextosGestionEventos(): TextosGestionEventos { const { locale } = useLocale(); return locale === 'en' ? en : es; }
