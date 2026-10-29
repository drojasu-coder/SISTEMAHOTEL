import { useLocale } from '@/i18n/LocaleContext';

/** Textos de la administración de mesas y reservas de restaurante (ES/EN). */
const es = {
  mesas: 'Mesas', mesasResumen: (n: number, plazas: number) => `${n} ${n === 1 ? 'mesa' : 'mesas'} · ${plazas} plazas`,
  nueva: 'Nueva mesa', mesa: (id: number) => `Mesa #${id}`,
  buscar: 'Buscar mesa por número (ej. 12)', zona: 'Zona', todasZonas: 'Todas las zonas',
  capacidad: 'Capacidad', cualquierCapacidad: 'Cualquier capacidad', capacidadMin: (n: number) => `${n} o más personas`,
  estado: 'Estado físico', todosEstados: 'Todos', estadoNota: 'Condición actual de la mesa; la disponibilidad depende de la fecha y la hora.',
  personas: (n: number) => `${n} ${n === 1 ? 'persona' : 'personas'}`,
  col: { mesa: 'Mesa', zona: 'Zona', sede: 'Sede', capacidad: 'Capacidad', estado: 'Estado físico', proxima: 'Próxima reserva', acciones: 'Acciones' },
  sinProxima: '—', agenda: 'Agenda', agendaDe: (id: number) => `Ver agenda y reservas de la mesa #${id}`, editar: 'Editar', editarDe: (id: number) => `Editar mesa #${id}`,
  limpiar: 'Limpiar filtros', sinResultados: 'Ninguna mesa coincide con los filtros.', vacio: 'No hay mesas registradas en las sedes seleccionadas.',
  pagina: (from: number, to: number, total: number) => `${from}–${to} de ${total}`, paginaDe: (p: number, t: number) => `Página ${p} de ${t}`, anterior: 'Página anterior', siguiente: 'Página siguiente',
  // Agenda de una mesa
  agendaTitulo: (id: number) => `Agenda de la mesa #${id}`, fecha: 'Fecha', ocupacionDia: 'Ocupación del día',
  libre: 'Libre', ocupada: 'Reservada', pasada: 'Pasada', cargandoAgenda: 'Consultando la agenda…', errorAgenda: 'No fue posible consultar la agenda de la mesa.', reintentar: 'Reintentar',
  duracion: (min: number) => `Cada reserva ocupa la mesa ${min} minutos.`,
  reservasMesa: 'Reservas de la mesa', sinReservasMesa: 'Esta mesa no tiene reservas registradas.', verTodas: 'Ver en reservas', cerrar: 'Cerrar',
  // Reservas de restaurante
  reservasTitulo: 'Reservas de restaurante', reservasResumen: (n: number) => `${n} ${n === 1 ? 'reserva' : 'reservas'} en las sedes seleccionadas`, hoy: 'Hoy',
  vistas: { hoy: 'Hoy', proximas: 'Próximas', canceladas: 'Canceladas', todas: 'Todas' }, vistasLabel: 'Vista de reservas',
  buscarReserva: 'Buscar por número, cliente, correo o mesa', fechaFiltro: 'Fecha', estadoReserva: 'Estado', todosEstadosReserva: 'Todos los estados',
  colR: { reserva: 'Reserva', fechaHora: 'Fecha y hora', mesa: 'Mesa', cliente: 'Cliente', comensales: 'Comensales', estado: 'Estado', acciones: 'Acciones' },
  vacioR: { hoy: 'No hay reservas para hoy.', proximas: 'No hay reservas próximas.', canceladas: 'No hay reservas canceladas.', todas: 'No hay reservas registradas en las sedes seleccionadas.', filtros: 'Ninguna reserva coincide con los filtros.' },
  filtroMesa: (id: number) => `Mesa #${id}`, quitarMesa: 'Quitar filtro de mesa', verReserva: (id: number) => `Ver detalle de la reserva #${id}`,
};
const en: typeof es = {
  mesas: 'Tables', mesasResumen: (n: number, seats: number) => `${n} ${n === 1 ? 'table' : 'tables'} · ${seats} seats`,
  nueva: 'New table', mesa: (id: number) => `Table #${id}`,
  buscar: 'Search table by number (e.g. 12)', zona: 'Area', todasZonas: 'All areas',
  capacidad: 'Capacity', cualquierCapacidad: 'Any capacity', capacidadMin: (n: number) => `${n}+ people`,
  estado: 'Physical status', todosEstados: 'All', estadoNota: 'Current table condition; availability depends on date and time.',
  personas: (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`,
  col: { mesa: 'Table', zona: 'Area', sede: 'Site', capacidad: 'Capacity', estado: 'Physical status', proxima: 'Next reservation', acciones: 'Actions' },
  sinProxima: '—', agenda: 'Schedule', agendaDe: (id: number) => `View schedule and reservations for table #${id}`, editar: 'Edit', editarDe: (id: number) => `Edit table #${id}`,
  limpiar: 'Clear filters', sinResultados: 'No tables match the filters.', vacio: 'No tables recorded in the selected sites.',
  pagina: (from: number, to: number, total: number) => `${from}–${to} of ${total}`, paginaDe: (p: number, t: number) => `Page ${p} of ${t}`, anterior: 'Previous page', siguiente: 'Next page',
  agendaTitulo: (id: number) => `Table #${id} schedule`, fecha: 'Date', ocupacionDia: 'Occupancy for the day',
  libre: 'Free', ocupada: 'Booked', pasada: 'Past', cargandoAgenda: 'Loading the schedule…', errorAgenda: 'The table schedule could not be loaded.', reintentar: 'Retry',
  duracion: (min: number) => `Each reservation holds the table for ${min} minutes.`,
  reservasMesa: 'Table reservations', sinReservasMesa: 'This table has no reservations recorded.', verTodas: 'View in reservations', cerrar: 'Close',
  reservasTitulo: 'Restaurant reservations', reservasResumen: (n: number) => `${n} ${n === 1 ? 'reservation' : 'reservations'} in the selected sites`, hoy: 'Today',
  vistas: { hoy: 'Today', proximas: 'Upcoming', canceladas: 'Cancelled', todas: 'All' }, vistasLabel: 'Reservation view',
  buscarReserva: 'Search by number, customer, email or table', fechaFiltro: 'Date', estadoReserva: 'Status', todosEstadosReserva: 'All statuses',
  colR: { reserva: 'Reservation', fechaHora: 'Date and time', mesa: 'Table', cliente: 'Customer', comensales: 'Party', estado: 'Status', acciones: 'Actions' },
  vacioR: { hoy: 'No reservations for today.', proximas: 'No upcoming reservations.', canceladas: 'No cancelled reservations.', todas: 'No reservations recorded in the selected sites.', filtros: 'No reservations match the filters.' },
  filtroMesa: (id: number) => `Table #${id}`, quitarMesa: 'Remove table filter', verReserva: (id: number) => `View details of reservation #${id}`,
};
export type TextosGestionMesas = typeof es;
export function useTextosGestionMesas(): TextosGestionMesas { const { locale } = useLocale(); return locale === 'en' ? en : es; }
