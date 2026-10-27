import type { EstadoReservaHabitacion } from '@/features/reservas';

/**
 * Textos del área de reservas propias del cliente.
 *
 * Se mantienen dentro del módulo para no alterar las traducciones globales ni
 * compartir mensajes con las pantallas administrativas.
 */
export const textosMisReservas = {
  subtitulo: 'HOTEL HUNAHPÚ',
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
