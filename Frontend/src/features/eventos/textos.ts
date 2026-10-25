import type { EstadoReservaEvento, TipoEvento } from './types';

export const formatearGTQ = (monto: number | string | null | undefined): string => {
  const num = Number(monto);
  if (!Number.isFinite(num)) return 'Q0.00';
  return `Q${num.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const textosEventos = {
  // Catálogo público
  catalogoEyebrow: 'Espacios y Salones Exclusivos',
  catalogoTitulo: 'Salones para Eventos',
  catalogoDescripcion:
    'Descubra nuestros elegantes salones acondicionados para bodas, celebraciones familiares y reuniones corporativas en un ambiente inigualable.',
  filtroSucursal: 'Sede del hotel',
  todasLasSedes: 'Todas las sedes',
  buscarSalon: 'Buscar salón por nombre o descripción...',
  capacidadPersonas: (capacidad: number) => `Hasta ${capacidad} personas`,
  tarifaBaseDesde: 'Tarifa base de salón',
  solicitarCotizacion: 'Cotizar evento',
  verDetalleSalon: 'Ver salón',
  sinSalonesTitulo: 'No se encontraron salones disponibles',
  sinSalonesMensaje:
    'No hay salones que coincidan con sus criterios de búsqueda en este momento.',

  // Detalle de salón
  detalleEyebrow: 'Espacio para Eventos',
  volverAlCatalogo: 'Volver a salones',
  caracteristicasSalon: 'Características del salón',
  capacidadMaximaLabel: 'Capacidad máxima de invitados',
  tarifaBaseLabel: 'Tarifa base de alquiler',
  condicionesAlquiler: 'Condiciones de reserva y contratación',
  condicionesTexto:
    'La solicitud inicial se registra como una cotización formal. No aparta el salón ni genera cargos inmediatos. El anticipo requerido se calcula automáticamente según la tarifa base y los servicios adicionales solicitados.',

  // Modal / Formulario de cotización de evento
  modalReservaTitulo: 'Solicitud de Cotización de Evento',
  modalReservaSubtitulo:
    'Indique los detalles de su evento. Su solicitud será evaluada y podrá agregar servicios de catering, mobiliario y tecnología.',
  campoTipoEvento: 'Tipo de evento',
  campoFecha: 'Fecha del evento',
  campoHoraInicio: 'Hora de inicio',
  campoHoraFin: 'Hora de finalización',
  campoInvitados: 'Número estimado de invitados',
  avisoDisponibilidad:
    'Nota importante: La consulta y solicitud inicial genera una cotización sujeta a confirmación y disponibilidad del salón.',
  botonCrearCotizacion: 'Crear cotización',
  creandoCotizacion: 'Registrando cotización...',
  exitoCotizacion: 'Su cotización ha sido registrada con éxito.',

  // Mis reservas de eventos (Cliente)
  misReservasEyebrow: 'HOTEL HUNAHPÚ',
  misReservasTitulo: 'Mis Reservas de Eventos',
  misReservasDescripcion:
    'Consulte el estado de sus cotizaciones y eventos contratados, gestione servicios adicionales o realice el pago de anticipo.',
  nuevaCotizacion: 'Cotizar nuevo evento',
  sinReservasTitulo: 'No tiene eventos registrados',
  sinReservasMensaje:
    'Aún no ha solicitado cotizaciones ni reservas de salones. Explore nuestros espacios disponibles.',
  columnaId: 'ID',
  columnaSalon: 'Salón y Sede',
  columnaFechaHorario: 'Fecha y Horario',
  columnaInvitados: 'Invitados',
  columnaEstado: 'Estado',
  columnaTotal: 'Total',
  columnaAnticipo: 'Anticipo',
  columnaAcciones: 'Acciones',
  verDetalle: 'Ver detalles',
  cancelarCotizacion: 'Cancelar cotización',
  confirmarCancelacion: '¿Está seguro de que desea cancelar esta cotización de evento?',
  cancelando: 'Cancelando...',

  // Detalle de reserva (Cliente)
  detalleReservaEyebrow: 'Gestión de Evento',
  volverAMisReservas: 'Volver a mis reservas',
  reservaNoEncontrada: 'No se encontró la reserva solicitada o no tiene permisos para consultarla.',
  informacionGeneral: 'Información general del evento',
  serviciosAdicionalesTitulo: 'Servicios adicionales contratados',
  serviciosAdicionalesDesc:
    'Puede añadir o retirar servicios de banquete, mobiliario o equipo audiovisual mientras su reserva se encuentre en cotización.',
  agregarServicioBoton: 'Agregar servicio adicional',
  sinServiciosAgregados: 'No se han agregado servicios adicionales a esta cotización.',
  eliminarServicio: 'Quitar servicio',
  resumenFinanciero: 'Resumen financiero',
  tarifaSalon: 'Tarifa base del salón',
  totalServicios: 'Servicios adicionales',
  totalEstimado: 'Total presupuestado',
  anticipoRequerido: 'Anticipo mínimo requerido',
  pagarConStripe: 'Pagar con tarjeta (Stripe)',
  anadirAlCarrito: 'Añadir al carrito para pagar',
  anadidoAlCarrito: 'Evento añadido a su carrito de compras.',
  anadiendoAlCarrito: 'Añadiendo al carrito...',
  tipoPagoPregunta: 'Seleccione la modalidad de pago para el carrito:',
  pagoAnticipoOpcion: 'Pagar anticipo requerido',
  pagoTotalOpcion: 'Pagar importe total',

  // Pestañas Mis Reservas
  pestanaHabitaciones: 'Habitaciones',
  pestanaRestaurante: 'Restaurante',
  pestanaAmenidades: 'Amenidades',
  pestanaActividades: 'Actividades',
  pestanaBienestar: 'Bienestar y Spa',
  pestanaEventos: 'Eventos y Salones',

  // Modal Agregar Servicio Adicional
  modalAgregarServicioTitulo: 'Añadir Servicio a la Cotización',
  modalAgregarServicioDesc:
    'Seleccione el servicio adicional que desea incorporar a su evento y la cantidad requerida.',
  campoServicio: 'Servicio disponible',
  campoCantidad: 'Cantidad requerida',
  botonAgregarServicio: 'Añadir servicio',
  agregandoServicio: 'Añadiendo...',

  // Administración - Salones
  adminSalonesEyebrow: 'Administración de Instalaciones',
  adminSalonesTitulo: 'Gestión de Salones para Eventos',
  adminSalonesDesc:
    'Controle los espacios, capacidades y tarifas base para contratación de eventos en el hotel.',
  nuevoSalonBoton: 'Nuevo salón',
  editarSalon: 'Editar salón',
  eliminarSalon: 'Eliminar salón',
  confirmarEliminarSalon:
    '¿Está seguro de que desea eliminar este salón? La operación solo procederá si no tiene reservas vinculadas.',

  // Administración - Servicios de Evento
  adminServiciosEyebrow: 'Administración de Catálogos',
  adminServiciosTitulo: 'Catálogo de Servicios para Eventos',
  adminServiciosDesc:
    'Configure las opciones de banquetes, tecnología, iluminación y mobiliario disponibles para cotizaciones de eventos.',
  nuevoServicioBoton: 'Nuevo servicio',
  editarServicio: 'Editar servicio',
  eliminarServicioCatalogo: 'Eliminar del catálogo',

  // Administración - Reservas de Eventos
  adminReservasEyebrow: 'Supervisión Operativa',
  adminReservasTitulo: 'Reservas y Cotizaciones de Eventos',
  adminReservasDesc:
    'Supervise las solicitudes de eventos en todas las sedes, revise invitados y actualice el estado operativo.',
  filtroEstado: 'Filtrar por estado',
  todosLosEstados: 'Todos los estados',
  buscarPorCliente: 'Buscar por cliente, salón o evento...',
  cambiarEstadoBoton: 'Actualizar estado',
  modalCambiarEstadoTitulo: 'Actualizar Estado de la Reserva',
  modalCambiarEstadoDesc:
    'Seleccione el nuevo estado operativo de la reserva de evento. Al confirmar, se verificará la disponibilidad del salón.',
  nuevoEstadoLabel: 'Nuevo estado operativo',
  botonActualizarEstado: 'Confirmar cambio de estado',
  actualizandoEstado: 'Actualizando estado...',
};

export const etiquetasTipoEvento: Record<TipoEvento, string> = {
  boda: 'Boda',
  cumpleanos: 'Cumpleaños / Celebración',
  ejecutivo: 'Corporativo / Ejecutivo',
  convivio: 'Convivio / Social',
};

export const etiquetasEstadoReserva: Record<EstadoReservaEvento, { label: string; tone: 'neutral' | 'success' | 'warning' | 'error' | 'info' }> = {
  cotizacion: {
    label: 'Cotización',
    tone: 'warning',
  },
  confirmada: {
    label: 'Confirmada',
    tone: 'success',
  },
  cancelada: {
    label: 'Cancelada',
    tone: 'error',
  },
  finalizada: {
    label: 'Finalizada',
    tone: 'neutral',
  },
};
