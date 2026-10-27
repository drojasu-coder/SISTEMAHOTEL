export const textosBienestar = {
  // Encabezados y navegación cliente
  subtitulo: 'HOTEL HUNAHPÚ · EXPERIENCIAS DE BIENESTAR',
  titulo: 'Bienestar y Spa',
  descripcion:
    'Disfrute de tratamientos relajantes, masajes y terapias corporales diseñadas para renovar su energía en un entorno de serenidad absoluta.',
  catalogoTitulo: 'Catálogo de Servicios de Bienestar',
  catalogoDescripcion:
    'Seleccione el tratamiento de su preferencia y reserve su cita con nuestros terapeutas certificados.',
  pestanaHabitaciones: 'Reservas de Habitación',
  pestanaRestaurante: 'Reservas de Mesa',
  pestanaAmenidades: 'Pases de Amenidades',
  pestanaActividades: 'Actividades Recreativas',
  pestanaBienestar: 'Bienestar y Spa',

  // Mis Citas Cliente
  misReservasSubtitulo: 'HOTEL HUNAHPÚ · CLIENTE',
  misReservasTitulo: 'Mis Citas de Bienestar',
  misReservasDescripcion:
    'Consulte el estado de sus citas de spa, terapeutas asignados y opciones para añadirlas al carrito de pagos.',
  reservarCita: 'Reservar cita de spa',
  sinCitasTitulo: 'No tiene citas de spa reservadas',
  sinCitasDesc:
    'Aún no ha programado citas de bienestar. Explore nuestro catálogo para consentirse durante su estancia.',
  explorarCatalogo: 'Explorar catálogo de bienestar',
  errorCargarReservas: 'Error al consultar sus citas de spa',
  errorCargarDetalle: 'Error al cargar el detalle de su cita',
  citaNoEncontrada: 'Cita no encontrada',
  citaNoEncontradaDesc:
    'La cita solicitada no existe o no tiene los permisos necesarios para consultarla.',
  volverAMisCitas: 'Volver a mis citas',

  // Detalle Cita
  detalleSubtitulo: 'HOTEL HUNAHPÚ · DETALLE DE CITA',
  detalleTitulo: 'Detalle de la Cita de Spa',
  citaNumero: (id: number | string) => `Cita #${id}`,
  estadoCita: 'Estado de la cita:',
  fechaCita: 'Fecha programada:',
  horarioCita: 'Horario:',
  terapeutaAsignado: 'Terapeuta asignado:',
  servicioContratado: 'Servicio:',
  duracionServicio: 'Duración estimada:',
  tarifaServicio: 'Tarifa:',
  minutos: 'minutos',

  // Modal / Formulario de Reserva
  modalReservaTitulo: 'Reservar Cita de Spa',
  modalReservaDesc:
    'Indique la fecha y hora de inicio deseada. La duración y la hora de fin se determinan automáticamente según el servicio seleccionado.',
  seleccionarTerapeuta: 'Seleccionar terapeuta',
  seleccioneTerapeutaOpcion: 'Seleccione un terapeuta disponible...',
  fecha: 'Fecha de la cita',
  horaInicio: 'Hora de inicio (formato 24h, ej. 10:00)',
  duracionCalculada: 'Duración del servicio:',
  tarifaAutorizada: 'Tarifa del servicio:',
  notaDisponibilidad:
    'La disponibilidad de horarios y el descanso reglamentario de 15 minutos entre sesiones del terapeuta se verifican de forma segura al confirmar.',
  confirmarCita: 'Confirmar reserva de cita',
  procesandoCita: 'Confirmando cita...',
  citaExitosaTitulo: '¡Cita reservada exitosamente!',
  citaExitosaDesc:
    'Su cita de bienestar ha sido registrada en el sistema. Puede consultarla en cualquier momento desde Mis reservas o añadirla a su carrito para proceder al pago.',
  iniciarSesionParaReservar: 'Debe iniciar sesión como cliente para reservar una cita de spa.',
  irAlLogin: 'Iniciar sesión',

  // Errores de negocio
  errorTerapeutaOcupado:
    'El terapeuta seleccionado no está disponible en este horario. Se requiere un tiempo de descanso de 15 minutos entre citas. Por favor elija otro horario o terapeuta.',
  errorTerapeutaInactivo:
    'El terapeuta seleccionado se encuentra inactivo actualmente. Por favor seleccione otro terapeuta.',
  errorServicioNoEncontrado:
    'El servicio de bienestar solicitado no existe o ya no está disponible.',
  errorFechaPasada:
    'La fecha y hora de la cita no pueden ser anteriores a la fecha y hora actual.',
  errorGenericoCreacion:
    'No se pudo completar la reserva de la cita. Por favor verifique los datos e intente de nuevo.',
  errorInciertoRed:
    'Ocurrió una interrupción de red al procesar su solicitud. Por favor verifique su listado de Mis Reservas antes de intentar reservar nuevamente.',

  // Administración de Citas
  adminCitasSubtitulo: 'HOTEL HUNAHPÚ · ADMINISTRACIÓN',
  adminCitasTitulo: 'Gestión de Citas de Spa',
  adminCitasDesc:
    'Supervisión y control del estado operativo de las citas de bienestar y spa de los huéspedes.',
  sinCitasAdminTitulo: 'No hay citas registradas',
  sinCitasAdminDesc: 'No se encontraron citas con los filtros aplicados.',
  cambiarEstado: 'Cambiar estado',
  confirmarCambioEstado: 'Confirmar cambio de estado',
  estadoActual: 'Estado actual',
  nuevoEstado: 'Nuevo estado',
  cancelarCita: 'Cancelar cita',
  completarCita: 'Marcar como completada',
  reactivarCita: 'Reactivar a confirmada',
  advertenciaReactivar:
    'Al reactivar una cita a confirmada, el servidor comprobará nuevamente la disponibilidad del terapeuta y el intervalo de 15 minutos de descanso.',
  actualizandoEstado: 'Actualizando estado...',
  estadoActualizadoExito: 'El estado de la cita ha sido actualizado correctamente.',

  // Administración de Servicios de Spa
  adminServiciosTitulo: 'Servicios de Bienestar y Spa',
  adminServiciosDesc:
    'Administración del catálogo de masajes, terapias y tratamientos de spa con sus duraciones y tarifas.',
  nuevoServicio: 'Nuevo servicio',
  editarServicio: 'Editar servicio',
  crearServicioTitulo: 'Registrar nuevo servicio de bienestar',
  editarServicioTitulo: 'Editar servicio de bienestar',
  servicioGuardadoExito: 'El servicio de bienestar se ha guardado correctamente.',
  campoNombreServicio: 'Nombre del tratamiento o servicio',
  campoDuracionMinutos: 'Duración (minutos)',
  campoPrecio: 'Precio (GTQ)',
  sinServiciosTitulo: 'No hay servicios registrados',
  sinServiciosDesc: 'No se encontraron servicios de spa en el sistema.',

  // Administración de Terapeutas
  adminTerapeutasTitulo: 'Terapeutas y Profesionales',
  adminTerapeutasDesc:
    'Control del equipo de terapeutas certificados, disponibilidad y estado activo para asignación de citas.',
  nuevoTerapeuta: 'Nuevo terapeuta',
  editarTerapeuta: 'Editar terapeuta',
  crearTerapeutaTitulo: 'Registrar nuevo terapeuta',
  editarTerapeutaTitulo: 'Editar terapeuta',
  terapeutaGuardadoExito: 'El terapeuta se ha guardado correctamente.',
  campoNombreTerapeuta: 'Nombre completo del terapeuta',
  campoActivo: 'Terapeuta activo y disponible para recibir citas',
  activarTerapeuta: 'Activar',
  desactivarTerapeuta: 'Desactivar',
  terapeutaActivo: 'Activo',
  terapeutaInactivo: 'Inactivo',
  sinTerapeutasTitulo: 'No hay terapeutas registrados',
  sinTerapeutasDesc: 'No se encontraron terapeutas registrados.',

  // Estados de cita
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
  buscar: 'Buscar...',
  guardar: 'Guardar',
  cancelar: 'Cancelar',
} as const;

export function formatearGTQ(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") {
    return "Q0.00";
  }
  const numero = typeof valor === "number" ? valor : Number(valor);
  if (!Number.isFinite(numero)) {
    return "Q0.00";
  }
  return `Q${numero.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
