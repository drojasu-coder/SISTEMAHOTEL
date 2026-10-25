export const textosActividades = {
  subtitulo: 'HOTEL HUNAHPÚ',
  catalogoTitulo: 'Actividades recreativas y deportivas',
  catalogoDescripcion:
    'Explore nuestras instalaciones deportivas y reserve sesiones recreativas en cualquiera de nuestras sedes.',

  // Filtros
  todasLasSedes: 'Todas las sedes',
  todosLosTipos: 'Todas las actividades',
  filtrarPorSede: 'Filtrar por sede',
  filtrarPorTipo: 'Filtrar por tipo',
  filtrarPorEstado: 'Filtrar por estado',
  buscarActividad: 'Buscar actividad...',

  // Pestañas Mis Reservas
  pestanaHabitaciones: 'Reservas de Habitación',
  pestanaRestaurante: 'Reservas de Mesa',
  pestanaAmenidades: 'Pases de Amenidades',
  pestanaActividades: 'Actividades Recreativas',

  // Mis Reservas
  misReservasSubtitulo: 'HOTEL HUNAHPÚ',
  misReservasTitulo: 'Mis actividades recreativas',
  misReservasDescripcion:
    'Consulte las reservas de canchas, equipamiento e instructores programadas para su estancia.',
  reservarActividad: 'Reservar actividad',
  sinReservasTitulo: 'No tiene reservas de actividades registradas',
  sinReservasDesc:
    'Cuando realice una reserva para alguna de nuestras actividades deportivas o recreativas, aparecerá aquí.',
  errorCargarReservas: 'No fue posible cargar sus reservas de actividades',

  // Detalle
  detalleSubtitulo: 'HOTEL HUNAHPÚ',
  detalleTitulo: (id: number | string) => `Reserva de actividad #${id}`,
  volverCatalogo: 'Volver al catálogo de actividades',
  volverMisReservas: 'Volver a mis actividades',
  informacionGeneral: 'Información de la actividad',
  fechaYHorario: 'Fecha y horario',
  sedeUbicacion: 'Sede y ubicación',
  recurso: 'Instalación o recurso',
  tipoActividad: 'Tipo de actividad',
  instructorAsignado: 'Instructor asignado',
  sinInstructor: 'Sin instructor (uso autónomo)',
  conEquipo: 'Incluye equipamiento deportivo',
  sinEquipo: 'Sin equipamiento adicional',
  totalCalculado: 'Total estimado',
  estadoReserva: 'Estado de la reserva',
  pagarAhora: 'Pagar ahora en carrito',

  // Reserva Modal / Form
  nuevaReservaTitulo: 'Reservar actividad recreativa',
  nuevaReservaDesc:
    'Seleccione la fecha, el horario deseado y configure los servicios adicionales como instructor o equipamiento.',
  campoFecha: 'Fecha de la actividad',
  campoHoraInicio: 'Hora de inicio',
  campoHoraFin: 'Hora de finalización',
  campoInstructor: 'Instructor (opcional)',
  seleccionarInstructor: 'Sin instructor asignado',
  campoEquipo: 'Requerir equipamiento deportivo',
  precioPorHora: 'Tarifa por hora de instalación:',
  precioEquipo: 'Tarifa de equipamiento:',
  precioInstructor: 'Tarifa por hora de instructor:',
  duracionRegla: 'La duración debe ser de entre 30 minutos y 2 horas.',
  confirmarReserva: 'Confirmar reserva',
  procesandoReserva: 'Confirmando su reserva...',
  reservaExitosaTitulo: '¡Reserva confirmada exitosamente!',
  reservaExitosaDesc:
    'Su actividad recreativa ha sido reservada en el sistema. Puede consultarla en cualquier momento desde Mis reservas o proceder al pago.',
  verEnMisReservas: 'Ver en mis reservas',
  irAlCarrito: 'Añadir al carrito',

  // Errores
  errorRecursoOcupado:
    'La instalación seleccionada ya se encuentra ocupada en ese horario. Por favor elija otro horario o fecha.',
  errorInstructorOcupado:
    'El instructor seleccionado ya tiene una sesión programada en ese horario. Elija otro horario o reserve sin instructor.',
  errorInstructorInactivo:
    'El instructor seleccionado no se encuentra disponible actualmente.',
  errorDuracionInvalida:
    'La actividad debe durar entre 30 minutos y 2 horas.',
  errorRangoInvalido:
    'La hora de inicio debe ser anterior a la hora de fin.',
  errorFechaPasada:
    'La fecha y hora de la actividad no pueden estar en el pasado.',
  errorGenericoCreacion:
    'No se pudo completar la reserva. Por favor verifique los datos e intente de nuevo.',
  errorInciertoRed:
    'Ocurrió un problema de red al procesar su solicitud. Por favor revise su listado de Mis Reservas antes de intentar reservar nuevamente.',

  // Administración
  adminSubtitulo: 'HOTEL HUNAHPÚ · ADMINISTRACIÓN',
  adminTitulo: 'Gestión de reservas de actividades',
  adminDescripcion:
    'Supervisión y control del estado de todas las reservas recreativas y deportivas en las sedes del hotel.',
  sinReservasAdminTitulo: 'No hay reservas registradas',
  sinReservasAdminDesc: 'No se encontraron reservas con los filtros aplicados.',
  cambiarEstado: 'Cambiar estado',
  confirmarCambioEstado: 'Confirmar cambio de estado',
  estadoActual: 'Estado actual',
  nuevoEstado: 'Nuevo estado',
  completarActividad: 'Marcar como completada',
  cancelarActividad: 'Cancelar reserva',
  reactivarActividad: 'Reactivar a confirmada',
  advertenciaCompletar:
    'Solo es posible marcar la actividad como completada una vez transcurrida su hora de finalización.',
  advertenciaReactivar:
    'Al reactivar una reserva, el sistema comprobará nuevamente la disponibilidad del recurso y del instructor.',
  errorNoFinalizada:
    'No es posible completar la actividad porque aún no ha finalizado su horario programado.',
  actualizandoEstado: 'Actualizando estado...',
  estadoActualizadoExito: 'El estado de la reserva ha sido actualizado correctamente.',

  // Estados
  estados: {
    confirmada: 'Confirmada',
    cancelada: 'Cancelada',
    completada: 'Completada',
  },

  // Generales
  reintentar: 'Reintentar',
  cargando: 'Cargando información...',
  limpiarFiltros: 'Limpiar filtros',
  noDisponible: 'No disponible',
  sinResultados: 'No se encontraron actividades disponibles con los criterios seleccionados.',
} as const;

export function formatearGTQ(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') {
    return 'Q0.00';
  }
  const numero = typeof valor === 'number' ? valor : Number(valor);
  if (!Number.isFinite(numero)) {
    return 'Q0.00';
  }
  return `Q${numero.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
