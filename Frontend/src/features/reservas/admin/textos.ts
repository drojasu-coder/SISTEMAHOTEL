import type { EstadoReservaHabitacion } from '../types';

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
        'Importe calculado por el sistema en quetzales (GTQ). No incluye cargos adicionales ni reembolsos manuales.',
    },

    valores: {
      sinTelefono: 'No registrado',
      sinHabitacion: 'Habitación sin asignar',
      sinTipo: 'Tipo no especificado',
      sinSede: 'Sede no especificada',
      formatoNoches: (noches: number) =>
        `${noches} ${noches === 1 ? 'noche' : 'noches'}`,
      formatoHuespedes: (cantidad: number) =>
        `${cantidad} ${cantidad === 1 ? 'huésped' : 'huéspedes'}`,
    },
  },
};
