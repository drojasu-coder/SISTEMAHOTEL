import type { EstadoReservaHabitacion } from '@/features/reservas';

/**
 * Textos del área de reservas propias del cliente.
 *
 * Se mantienen dentro del módulo para no alterar las traducciones globales ni
 * compartir mensajes con las pantallas administrativas.
 */
export const textosMisReservas = {
  subtitulo: 'HOTEL HUNAHPÚ',
  tabs: { habitaciones: 'Reservas de Habitación', restaurante: 'Reservas de Mesa', amenidades: 'Pases de Amenidades', actividades: 'Actividades Recreativas', bienestar: 'Bienestar y Spa', eventos: 'Eventos y Salones' },
  titulo: 'Mis reservas',
  descripcion:
    'Consulte el estado y los detalles de sus reservas de habitación.',

  reservar: 'Reservar habitación',
  reservasMostradas: (cantidad: number) =>
    cantidad === 1 ? '1 reserva' : `${cantidad} reservas`,

  cargandoListado: 'Cargando sus reservas…',
  errorListadoTitulo: 'No fue posible cargar sus reservas',
  vacioTitulo: 'Todavía no tiene reservas de habitación',
  vacioDescripcion:
    'Cuando realice una reserva, aparecerá aquí con su estado y su importe.',

  reservaNumero: (id: number | string) => `Reserva #${id}`,
  verDetalle: 'Ver detalle',
  verDetalleReserva: (id: number | string) =>
    `Ver detalle de la reserva ${id}`,

  detalleEtiqueta: 'Detalle de la reserva',
  volverListado: 'Volver a mis reservas',
  cargandoDetalle: 'Cargando el detalle de la reserva…',
  errorDetalleTitulo: 'No fue posible cargar la reserva',
  errorConexionTitulo: 'No fue posible conectar con el servidor',
  errorConexionDescripcion:
    'Verifique su conexión e inténtelo de nuevo.',

  idInvalidoTitulo: 'Identificador de reserva no válido',
  idInvalidoDescripcion:
    'El enlace no contiene un identificador de reserva válido. Vuelva a su listado para elegir una reserva.',
  noEncontradaTitulo: 'No encontramos esta reserva',
  noEncontradaDescripcion:
    'La reserva no existe o ya no se encuentra disponible.',
  sinAccesoTitulo: 'No tiene acceso a esta reserva',
  sinAccesoDescripcion:
    'Esta reserva pertenece a otra cuenta. Solo puede consultar sus propias reservas.',

  estanciaTitulo: 'Estancia',
  campos: {
    habitacion: 'Habitación',
    tipo: 'Tipo de habitación',
    sede: 'Sede',
    entrada: 'Entrada',
    salida: 'Salida',
    noches: 'Noches',
    huespedes: 'Huéspedes',
    estado: 'Estado',
    importe: 'Importe de la reserva',
  },
  noches: (cantidad: number) =>
    cantidad === 1 ? '1 noche' : `${cantidad} noches`,
  huespedes: (cantidad: number) =>
    cantidad === 1 ? '1 huésped' : `${cantidad} huéspedes`,
  habitacionNumero: (numero: string) => `Habitación ${numero}`,
  sinHabitacion: 'Habitación no disponible',
  sinTipo: 'Tipo de habitación no disponible',
  sinSede: 'Sede no disponible',
  sedePorIdentificador: (id: number) => `Sede #${id}`,
  noDisponible: 'No disponible',
  avisoSedes:
    'No fue posible cargar los nombres de las sedes; se muestra su identificador.',

  importeNota:
    'Importe registrado por el hotel para esta reserva. Este detalle no incluye información de pagos.',

  estados: {
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    cancelada: 'Cancelada',
    finalizada: 'Finalizada',
    expirada: 'Expirada',
  } satisfies Record<EstadoReservaHabitacion, string>,

  acceso: {
    verificandoSesion: 'Verificando su sesión…',
    errorSesionTitulo: 'No fue posible verificar su sesión',
    errorSesionDescripcion: 'Revise su conexión e inténtelo de nuevo.',
    sinSesionTitulo: 'Inicie sesión para ver sus reservas',
    sinSesionDescripcion:
      'Para consultar sus reservas de habitación, ingrese con su cuenta de cliente.',
    iniciarSesion: 'Iniciar sesión',
    rolTitulo: 'Esta sección es para clientes',
    rolDescripcion:
      'Su cuenta no tiene el rol de cliente, por lo que no puede consultar reservas propias en esta sección.',
    irMiEspacio: 'Ir a mi espacio',
    irInicio: 'Ir al inicio',
    reintentar: 'Reintentar',
    volver: 'Volver',
  },
} as const;


export const myReservationsEn = {
  subtitulo: 'HOTEL HUNAHPÚ', titulo: 'My reservations', descripcion: 'View the status and details of your room reservations.',
  tabs: { habitaciones: 'Room reservations', restaurante: 'Table reservations', amenidades: 'Amenity passes', actividades: 'Recreational activities', bienestar: 'Wellness and spa', eventos: 'Events and venues' },
  reservar: 'Reserve a room', reservasMostradas: (n: number) => `${n} ${n === 1 ? 'reservation' : 'reservations'}`,
  cargandoListado: 'Loading your reservations…', errorListadoTitulo: 'Unable to load your reservations',
  vacioTitulo: 'You have no room reservations yet', vacioDescripcion: 'Your reservations will appear here with their status and amount.',
  reservaNumero: (id: number | string) => `Reservation #${id}`, verDetalle: 'View details', verDetalleReserva: (id: number | string) => `View reservation ${id} details`,
  detalleEtiqueta: 'Reservation details', volverListado: 'Back to my reservations', cargandoDetalle: 'Loading reservation details…',
  errorDetalleTitulo: 'Unable to load the reservation', errorConexionTitulo: 'Unable to connect to the server', errorConexionDescripcion: 'Check your connection and try again.',
  idInvalidoTitulo: 'Invalid reservation identifier', idInvalidoDescripcion: 'This link does not contain a valid reservation identifier. Choose a reservation from your list.',
  noEncontradaTitulo: 'Reservation not found', noEncontradaDescripcion: 'This reservation does not exist or is no longer available.',
  sinAccesoTitulo: 'You cannot access this reservation', sinAccesoDescripcion: 'This reservation belongs to another account. You can only view your own reservations.',
  estanciaTitulo: 'Stay', campos: { habitacion: 'Room', tipo: 'Room category', sede: 'Location', entrada: 'Arrival', salida: 'Departure', noches: 'Nights', huespedes: 'Guests', estado: 'Status', importe: 'Reservation amount' },
  noches: (n: number) => `${n} ${n === 1 ? 'night' : 'nights'}`, huespedes: (n: number) => `${n} ${n === 1 ? 'guest' : 'guests'}`,
  habitacionNumero: (n: string) => `Room ${n}`, sinHabitacion: 'Room unavailable', sinTipo: 'Room category unavailable', sinSede: 'Location unavailable',
  sedePorIdentificador: (id: number) => `Location #${id}`, noDisponible: 'Unavailable', avisoSedes: 'Location names could not be loaded; their identifiers are shown.',
  importeNota: 'Amount recorded by the hotel for this reservation. Payment information is shown separately.',
  estados: { pendiente: 'Pending', confirmada: 'Confirmed', cancelada: 'Cancelled', finalizada: 'Finished', expirada: 'Expired' },
  acceso: { verificandoSesion: 'Checking your session…', errorSesionTitulo: 'Unable to verify your session', errorSesionDescripcion: 'Check your connection and try again.',
    sinSesionTitulo: 'Sign in to view your reservations', sinSesionDescripcion: 'Sign in with your customer account to view your room reservations.', iniciarSesion: 'Sign in',
    rolTitulo: 'This section is for customers', rolDescripcion: 'Your account does not have the customer role required to view personal reservations here.',
    irMiEspacio: 'Go to my area', irInicio: 'Go to home', reintentar: 'Retry', volver: 'Back' },
};
