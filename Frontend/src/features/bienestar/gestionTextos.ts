import { useLocale } from '@/i18n/LocaleContext';

/** Textos de la administración de Bienestar y spa (ES/EN). */
const es = {
  modulo: 'Bienestar y spa', nav: { servicios: 'Servicios', terapeutas: 'Terapeutas', citas: 'Citas' }, navLabel: 'Secciones de bienestar',
  general: 'General', cerrar: 'Cerrar', reintentar: 'Reintentar', cargando: 'Cargando…', limpiar: 'Limpiar filtros',
  activo: 'Activo', inactivo: 'Inactivo', estado: 'Estado', todosEstados: 'Todos los estados', activos: 'Activos', inactivos: 'Inactivos',
  minutos: (n: number) => `${n} min`, sinFoto: 'Sin fotografía',
  // Servicios
  serviciosResumen: (n: number, activos: number) => `${n} ${n === 1 ? 'servicio' : 'servicios'} · ${activos} ${activos === 1 ? 'activo' : 'activos'}`,
  nuevoServicio: 'Nuevo servicio', buscarServicio: 'Buscar servicio por nombre', duracion: 'Duración', todasDuraciones: 'Cualquier duración',
  colS: { servicio: 'Servicio', sede: 'Sede', duracion: 'Duración', tarifa: 'Tarifa', estado: 'Estado', terapeutas: 'Terapeutas disponibles', acciones: 'Acciones' },
  terapeutasN: (n: number) => n === 0 ? 'Ninguno' : `${n} ${n === 1 ? 'terapeuta' : 'terapeutas'}`,
  sinTerapeutas: 'Sin terapeutas activos en su sede: no se puede reservar.',
  citasDe: (n: string) => `Ver citas de ${n}`, editarDe: (n: string) => `Editar ${n}`, citas: 'Citas', editar: 'Editar',
  sinServicios: 'No hay servicios registrados en las sedes seleccionadas.', sinResultados: 'Ningún registro coincide con los filtros.',
  generalNota: 'Los servicios generales pertenecen al catálogo anterior y no están asociados a una sede.',
  // Terapeutas
  terapeutasResumen: (n: number, activos: number) => `${n} ${n === 1 ? 'terapeuta' : 'terapeutas'} · ${activos} ${activos === 1 ? 'activo' : 'activos'}`,
  nuevoTerapeuta: 'Nuevo terapeuta', buscarTerapeuta: 'Buscar terapeuta por nombre',
  terapeutasNota: 'Cada terapeuta atiende los servicios de su sede; entre dos citas suyas se reservan 15 minutos de descanso.',
  colT: { terapeuta: 'Terapeuta', sede: 'Sede', estado: 'Estado', servicios: 'Servicios que atiende', proximas: 'Próximas citas', acciones: 'Acciones' },
  serviciosN: (n: number) => `${n} ${n === 1 ? 'servicio' : 'servicios'}`, sinTerapeutasRegistrados: 'No hay terapeutas registrados en las sedes seleccionadas. Sin terapeutas activos no se pueden reservar citas.',
  // Citas
  citasResumen: (n: number) => `${n} ${n === 1 ? 'cita' : 'citas'} en las sedes seleccionadas`, hoy: 'Hoy',
  vistas: { hoy: 'Hoy', proximas: 'Próximas', historial: 'Historial' }, vistasLabel: 'Vista de citas',
  buscarCita: 'Buscar por número, cliente o correo', servicio: 'Servicio', todosServicios: 'Todos los servicios', terapeuta: 'Terapeuta', todosTerapeutas: 'Todos los terapeutas', fecha: 'Fecha',
  colC: { cita: 'Cita', fechaHora: 'Fecha y horario', servicio: 'Servicio', cliente: 'Cliente', terapeuta: 'Terapeuta', estado: 'Estado', acciones: 'Acciones' },
  cambiarEstado: 'Cambiar estado', cambiarEstadoDe: (id: number) => `Cambiar estado de la cita #${id}`, verCita: (id: number) => `Ver detalle de la cita #${id}`,
  vacioC: { hoy: 'No hay citas para hoy.', proximas: 'No hay citas próximas.', historial: 'No hay citas anteriores.', filtros: 'Ninguna cita coincide con los filtros.' },
  quitarFiltro: (v: string) => `Quitar filtro: ${v}`, errorCitas: 'No fue posible cargar las citas.',
};
const en: typeof es = {
  modulo: 'Wellness and spa', nav: { servicios: 'Services', terapeutas: 'Therapists', citas: 'Appointments' }, navLabel: 'Wellness sections',
  general: 'General', cerrar: 'Close', reintentar: 'Retry', cargando: 'Loading…', limpiar: 'Clear filters',
  activo: 'Active', inactivo: 'Inactive', estado: 'Status', todosEstados: 'All statuses', activos: 'Active', inactivos: 'Inactive',
  minutos: (n: number) => `${n} min`, sinFoto: 'No photo',
  serviciosResumen: (n: number, active: number) => `${n} ${n === 1 ? 'service' : 'services'} · ${active} active`,
  nuevoServicio: 'New service', buscarServicio: 'Search service by name', duracion: 'Duration', todasDuraciones: 'Any duration',
  colS: { servicio: 'Service', sede: 'Site', duracion: 'Duration', tarifa: 'Rate', estado: 'Status', terapeutas: 'Available therapists', acciones: 'Actions' },
  terapeutasN: (n: number) => n === 0 ? 'None' : `${n} ${n === 1 ? 'therapist' : 'therapists'}`,
  sinTerapeutas: 'No active therapists at its site: it cannot be booked.',
  citasDe: (n: string) => `View appointments for ${n}`, editarDe: (n: string) => `Edit ${n}`, citas: 'Appointments', editar: 'Edit',
  sinServicios: 'No services recorded in the selected sites.', sinResultados: 'No records match the filters.',
  generalNota: 'General services belong to the previous catalog and are not linked to a site.',
  terapeutasResumen: (n: number, active: number) => `${n} ${n === 1 ? 'therapist' : 'therapists'} · ${active} active`,
  nuevoTerapeuta: 'New therapist', buscarTerapeuta: 'Search therapist by name',
  terapeutasNota: 'Each therapist serves their site’s services; 15 minutes of rest are kept between two of their appointments.',
  colT: { terapeuta: 'Therapist', sede: 'Site', estado: 'Status', servicios: 'Services offered', proximas: 'Upcoming appointments', acciones: 'Actions' },
  serviciosN: (n: number) => `${n} ${n === 1 ? 'service' : 'services'}`, sinTerapeutasRegistrados: 'No therapists recorded in the selected sites. Appointments cannot be booked without active therapists.',
  citasResumen: (n: number) => `${n} ${n === 1 ? 'appointment' : 'appointments'} in the selected sites`, hoy: 'Today',
  vistas: { hoy: 'Today', proximas: 'Upcoming', historial: 'History' }, vistasLabel: 'Appointment view',
  buscarCita: 'Search by number, customer or email', servicio: 'Service', todosServicios: 'All services', terapeuta: 'Therapist', todosTerapeutas: 'All therapists', fecha: 'Date',
  colC: { cita: 'Appointment', fechaHora: 'Date and time', servicio: 'Service', cliente: 'Customer', terapeuta: 'Therapist', estado: 'Status', acciones: 'Actions' },
  cambiarEstado: 'Change status', cambiarEstadoDe: (id: number) => `Change status of appointment #${id}`, verCita: (id: number) => `View details of appointment #${id}`,
  vacioC: { hoy: 'No appointments today.', proximas: 'No upcoming appointments.', historial: 'No past appointments.', filtros: 'No appointments match the filters.' },
  quitarFiltro: (v: string) => `Remove filter: ${v}`, errorCitas: 'Appointments could not be loaded.',
};
export type TextosGestionBienestar = typeof es;
export function useTextosGestionBienestar(): TextosGestionBienestar { const { locale } = useLocale(); return locale === 'en' ? en : es; }
