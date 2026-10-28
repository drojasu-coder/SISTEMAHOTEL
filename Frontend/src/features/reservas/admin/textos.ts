import type { EstadoReservaHabitacion } from '../types';
import { useLocale } from '@/i18n/LocaleContext';

export const textosAdminReservas = {
  titulo: 'Consulta de reservas de habitación',
  subtitulo: 'Gestión hotelera',
  descripcion:
    'Consulte el registro general de reservas de habitación, verifique los datos de huéspedes, sedes, fechas e importes registrados.',
  volverAlPanel: 'Volver al panel',
  volverAListado: 'Volver a reservas',
  irAHabitaciones: 'Gestión de habitaciones',

  filtros: {
    titulo: 'Filtros de búsqueda',
    buscarLabel: 'Buscar por cliente, habitación o ID',
    buscarPlaceholder: 'Ej. Juan Pérez, 101, o ID de reserva...',
    sedeLabel: 'Sede hotelera',
    todasLasSedes: 'Todas las sedes',
    estadoLabel: 'Estado de reserva',
    todosLosEstados: 'Todos los estados',
    limpiar: 'Limpiar filtros',
    limpiarBusqueda: 'Limpiar búsqueda',
  },

  tarjetas: {
    total: 'Total',
    pendientes: 'Pendientes',
    confirmadas: 'Confirmadas',
    finalizadas: 'Finalizadas',
    canceladas: 'Canceladas',
  },

  paginacion: {
    anterior: 'Anterior',
    siguiente: 'Siguiente',
    pagina: (pagina: number, total: number) => `Página ${pagina} de ${total}`,
  },

  acciones: {
    confirmar: 'Confirmar reserva',
    finalizar: 'Finalizar estancia',
    cancelar: 'Cancelar reserva',
    cerrar: 'Cerrar',
    preguntaCancelar: '¿Está seguro de que desea cancelar esta reserva de habitación?',
    canceladaOk: 'Reserva cancelada correctamente.',
    estadoActualizado: (estado: string) => `Estado de la reserva actualizado a «${estado}».`,
    errorActualizar: 'Error al actualizar el estado de la reserva',
    errorCancelar: 'Error al cancelar la reserva',
    etiquetaFinalizada: 'Finalizada (check-out)',
  },

  estados: {
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    cancelada: 'Cancelada',
    finalizada: 'Finalizada',
    expirada: 'Expirada',
  } satisfies Record<EstadoReservaHabitacion, string>,

  listado: {
    cargando: 'Cargando reservas de habitación...',
    errorTitulo: 'No fue posible cargar las reservas',
    errorDescripcion:
      'Ocurrió un error al obtener las reservas de habitación desde el servidor. Por favor, intente de nuevo.',
    reintentar: 'Reintentar consulta',
    vacioTitulo: 'No hay reservas registradas',
    vacioDescripcion:
      'En este momento no existen reservas de habitación registradas en el sistema.',
    sinResultadosTitulo: 'No se encontraron reservas coincidentes',
    sinResultadosDescripcion:
      'Ninguna reserva coincide con los filtros aplicados. Intente modificando el término de búsqueda o cambiando el estado o la sede.',
    totalMostradas: (visibles: number, total: number) =>
      visibles === total
        ? `Mostrando ${total} ${total === 1 ? 'reserva' : 'reservas'}`
        : `Mostrando ${visibles} de ${total} ${total === 1 ? 'reserva' : 'reservas'}`,
  },

  columnas: {
    id: 'Identificador',
    cliente: 'Cliente / Huésped',
    sede: 'Sede',
    habitacion: 'Habitación',
    fechas: 'Fechas de estancia',
    huespedes: 'Huéspedes',
    estado: 'Estado',
    importe: 'Importe registrado',
    acciones: 'Acciones',
    verDetalle: 'Ver detalle',
  },

  detalle: {
    titulo: 'Detalle de la reserva',
    subtitulo: 'Información completa registrada en el sistema',
    cargando: 'Cargando detalle de la reserva...',
    errorTitulo: 'No fue posible cargar la reserva',
    errorDescripcion:
      'No se encontró la reserva solicitada o no se cuenta con autorización para ver su detalle.',
    reintentar: 'Reintentar consulta',
    noEncontrada: 'Reserva no encontrada',
    noEncontradaDescripcion:
      'El identificador solicitado no corresponde a una reserva de habitación existente en el sistema.',
    reservaId: (id: number) => `Reserva #${id}`,

    secciones: {
      estancia: 'Datos de la estancia',
      cliente: 'Datos del cliente',
      financiero: 'Registro financiero',
    },

    campos: {
      id: 'Identificador de reserva',
      fechaRegistro: 'Fecha de registro',
      estado: 'Estado actual',
      clienteNombre: 'Nombre completo',
      clienteEmail: 'Correo electrónico',
      clienteTelefono: 'Teléfono',
      sede: 'Sede hotelera',
      habitacionNumero: 'Número de habitación',
      habitacionTipo: 'Tipo de habitación',
      tarifaBase: 'Tarifa base por noche',
      fechaEntrada: 'Fecha de llegada',
      fechaSalida: 'Fecha de salida',
      noches: 'Duración de la estancia',
      huespedes: 'Cantidad de huéspedes',
      importeTotal: 'Monto total registrado',
      importeNota:
        'Importe guardado en la reserva, en quetzales (GTQ), calculado con la tarifa vigente al crearla o al cambiar por última vez sus fechas o habitación. No se recalcula si después cambia la tarifa. No incluye cargos adicionales ni reembolsos manuales.',
      importeNoDisponible: 'No disponible',
      tarifaActual: 'Tarifa actual del tipo de habitación',
      tarifaActualNota:
        'Referencia del catálogo vigente hoy. Puede diferir de la tarifa con la que se registró esta reserva.',
    },

    valores: {
      sinTelefono: 'No registrado',
      sinHabitacion: 'Habitación sin asignar',
      sinTipo: 'Tipo no especificado',
      sinSede: 'Sede no especificada',
      clienteNoRegistrado: 'Cliente no registrado',
      habitacion: (numero: string) => `Hab. ${numero}`,
      formatoNoches: (noches: number) =>
        `${noches} ${noches === 1 ? 'noche' : 'noches'}`,
      formatoHuespedes: (cantidad: number) =>
        `${cantidad} ${cantidad === 1 ? 'huésped' : 'huéspedes'}`,
    },
  },
};

type TextosAdminReservas = typeof textosAdminReservas;

const textosAdminReservasEn: TextosAdminReservas = {
  titulo: 'Room reservations',
  subtitulo: 'Hotel management',
  descripcion:
    'Review the general register of room reservations and check the guest, site, date and recorded amount details.',
  volverAlPanel: 'Back to dashboard',
  volverAListado: 'Back to reservations',
  irAHabitaciones: 'Room management',

  filtros: {
    titulo: 'Search filters',
    buscarLabel: 'Search by guest, room or ID',
    buscarPlaceholder: 'E.g. Juan Pérez, 101, or reservation ID...',
    sedeLabel: 'Hotel site',
    todasLasSedes: 'All sites',
    estadoLabel: 'Reservation status',
    todosLosEstados: 'All statuses',
    limpiar: 'Clear filters',
    limpiarBusqueda: 'Clear search',
  },

  tarjetas: {
    total: 'Total',
    pendientes: 'Pending',
    confirmadas: 'Confirmed',
    finalizadas: 'Completed',
    canceladas: 'Cancelled',
  },

  paginacion: {
    anterior: 'Previous',
    siguiente: 'Next',
    pagina: (pagina: number, total: number) => `Page ${pagina} of ${total}`,
  },

  acciones: {
    confirmar: 'Confirm reservation',
    finalizar: 'Complete stay',
    cancelar: 'Cancel reservation',
    cerrar: 'Close',
    preguntaCancelar: 'Are you sure you want to cancel this room reservation?',
    canceladaOk: 'Reservation cancelled.',
    estadoActualizado: (estado: string) => `Reservation status updated to “${estado}”.`,
    errorActualizar: 'The reservation status could not be updated',
    errorCancelar: 'The reservation could not be cancelled',
    etiquetaFinalizada: 'Completed (check-out)',
  },

  estados: {
    pendiente: 'Pending',
    confirmada: 'Confirmed',
    cancelada: 'Cancelled',
    finalizada: 'Completed',
    expirada: 'Expired',
  },

  listado: {
    cargando: 'Loading room reservations...',
    errorTitulo: 'Reservations could not be loaded',
    errorDescripcion:
      'An error occurred while retrieving room reservations from the server. Please try again.',
    reintentar: 'Try again',
    vacioTitulo: 'No reservations registered',
    vacioDescripcion: 'There are currently no room reservations registered in the system.',
    sinResultadosTitulo: 'No matching reservations',
    sinResultadosDescripcion:
      'No reservation matches the applied filters. Try another search term, status or site.',
    totalMostradas: (visibles: number, total: number) =>
      visibles === total
        ? `Showing ${total} ${total === 1 ? 'reservation' : 'reservations'}`
        : `Showing ${visibles} of ${total} ${total === 1 ? 'reservation' : 'reservations'}`,
  },

  columnas: {
    id: 'Identifier',
    cliente: 'Customer / Guest',
    sede: 'Site',
    habitacion: 'Room',
    fechas: 'Stay dates',
    huespedes: 'Guests',
    estado: 'Status',
    importe: 'Recorded amount',
    acciones: 'Actions',
    verDetalle: 'View details',
  },

  detalle: {
    titulo: 'Reservation details',
    subtitulo: 'Complete information recorded in the system',
    cargando: 'Loading reservation details...',
    errorTitulo: 'The reservation could not be loaded',
    errorDescripcion:
      'The requested reservation was not found or you are not authorized to view its details.',
    reintentar: 'Try again',
    noEncontrada: 'Reservation not found',
    noEncontradaDescripcion:
      'The requested identifier does not match an existing room reservation.',
    reservaId: (id: number) => `Reservation #${id}`,

    secciones: {
      estancia: 'Stay details',
      cliente: 'Customer details',
      financiero: 'Financial record',
    },

    campos: {
      id: 'Reservation identifier',
      fechaRegistro: 'Registered on',
      estado: 'Current status',
      clienteNombre: 'Full name',
      clienteEmail: 'Email',
      clienteTelefono: 'Phone',
      sede: 'Hotel site',
      habitacionNumero: 'Room number',
      habitacionTipo: 'Room type',
      tarifaBase: 'Base nightly rate',
      fechaEntrada: 'Arrival date',
      fechaSalida: 'Departure date',
      noches: 'Length of stay',
      huespedes: 'Number of guests',
      importeTotal: 'Recorded total amount',
      importeNota:
        'Amount stored on the reservation, in quetzales (GTQ), calculated with the rate in force when it was created or when its dates or room were last changed. It is not recalculated if the rate changes later. It does not include additional charges or manual refunds.',
      importeNoDisponible: 'Not available',
      tarifaActual: 'Current room type rate',
      tarifaActualNota:
        'Reference from today’s catalog. It may differ from the rate used when this reservation was recorded.',
    },

    valores: {
      sinTelefono: 'Not recorded',
      sinHabitacion: 'Room not assigned',
      sinTipo: 'Type not specified',
      sinSede: 'Site not specified',
      clienteNoRegistrado: 'Unregistered customer',
      habitacion: (numero: string) => `Room ${numero}`,
      formatoNoches: (noches: number) => `${noches} ${noches === 1 ? 'night' : 'nights'}`,
      formatoHuespedes: (cantidad: number) => `${cantidad} ${cantidad === 1 ? 'guest' : 'guests'}`,
    },
  },
};

/** Textos de las pantallas administrativas de reservas según el idioma activo. */
export function useTextosAdminReservas(): TextosAdminReservas {
  const { locale } = useLocale();
  return locale === 'en' ? textosAdminReservasEn : textosAdminReservas;
}
