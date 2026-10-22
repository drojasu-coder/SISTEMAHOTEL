/**
 * Textos del módulo de búsqueda de disponibilidad y creación de reservas.
 * Redactados en trato de usted y adecuados al contexto de HOTEL HUNAHPÚ en Guatemala.
 */

export function formatGTQ(monto: number | string | null | undefined): string {
  if (monto === null || monto === undefined || monto === '') return 'Q0.00';
  const num = typeof monto === 'number' ? monto : parseFloat(String(monto));
  if (Number.isNaN(num)) return 'Q0.00';
  return `Q${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const textosCrearReserva = {
  tituloPagina: 'Reservar habitación',
  subtituloPagina:
    'Consulte la disponibilidad de habitaciones en nuestras sedes y realice su reserva en línea.',

  // Búsqueda
  seccionBusqueda: 'Criterios de estancia',
  sedeLabel: 'Sede del hotel',
  sedePlaceholder: 'Seleccione una sede',
  fechaEntradaLabel: 'Fecha de entrada (check-in)',
  fechaSalidaLabel: 'Fecha de salida (check-out)',
  huespedesLabel: 'Número de huéspedes',
  huespedesPlaceholder: 'Ej. 2',
  tipoHabitacionLabel: 'Tipo de habitación (opcional)',
  tipoHabitacionTodos: 'Todos los tipos disponibles',
  botonBuscar: 'Buscar disponibilidad',
  buscando: 'Consultando disponibilidad...',

  // Avisos de disponibilidad
  avisoDisponibilidadNoAparta:
    'Tenga en cuenta que consultar la disponibilidad no aparta ni bloquea la habitación. La disponibilidad se confirma en tiempo real únicamente al crear la reserva.',
  avisoCriteriosModificados:
    'Ha modificado los criterios en el formulario. Para ver las habitaciones correspondientes a estos nuevos datos, por favor pulse en "Buscar disponibilidad".',

  // Resultados
  seccionResultados: 'Habitaciones disponibles',
  resultadosEncontrados: (count: number) =>
    count === 1
      ? 'Se encontró 1 habitación disponible'
      : `Se encontraron ${count} habitaciones disponibles`,
  sinResultadosTitulo: 'No hay habitaciones disponibles',
  sinResultadosDesc:
    'No encontramos disponibilidad para las fechas, sede o cantidad de huéspedes indicadas. Le sugerimos probar con otras fechas o cambiar de sede.',
  botonSeleccionar: 'Seleccionar habitación',
  habitacionNumero: (num: string) => `Habitación ${num}`,
  capacidadPersonas: (cap: number) => `Capacidad hasta ${cap} personas`,
  tarifaPorNoche: (tarifa: string | number) => `${formatGTQ(tarifa)} por noche`,
  totalEstimado: (total: string | number) => `Total estimado: ${formatGTQ(total)}`,
  nochesCalculadas: (noches: number) =>
    noches === 1 ? '1 noche' : `${noches} noches`,

  // Resumen y confirmación
  resumenTitulo: 'Resumen de su reserva',
  resumenDesc:
    'Por favor verifique los datos de su estancia antes de confirmar la reserva.',
  resumenSede: 'Sede:',
  resumenHabitacion: 'Habitación:',
  resumenTipo: 'Tipo:',
  resumenFechas: 'Fechas de estancia:',
  resumenHuespedes: 'Huéspedes:',
  resumenNoches: 'Duración:',
  resumenTarifaNoche: 'Tarifa por noche:',
  resumenTotal: 'Total de la reserva:',
  botonConfirmarReserva: 'Confirmar y reservar',
  botonCancelar: 'Volver a los resultados',
  creandoReserva: 'Creando su reserva...',

  // Estados de éxito
  exitoTitulo: '¡Reserva creada exitosamente!',
  exitoDesc:
    'Su solicitud de reserva ha sido registrada en el sistema de HOTEL HUNAHPÚ.',
  exitoId: 'Código de reserva:',
  exitoEstado: 'Estado actual:',
  exitoTotal: 'Total persistido:',
  estadoPendienteAviso:
    'Su reserva se encuentra en estado "Pendiente". No se considera pagada ni confirmada definitivamente hasta que complete el proceso correspondiente.',
  botonMisReservas: 'Ir a Mis reservas',
  botonVerDetalle: 'Ver detalle de esta reserva',
  botonNuevaBusqueda: 'Hacer otra reserva',

  // Errores y excepciones
  error409Titulo: 'Habitación no disponible',
  error409Mensaje:
    'La habitación seleccionada ya fue reservada por otro huésped o se encuentra temporalmente en mantenimiento.',
  botonActualizarDisponibilidad: 'Actualizar disponibilidad',
  errorRedTitulo: 'Resultado incierto por problema de red',
  errorRedMensaje:
    'No fue posible confirmar la respuesta del servidor debido a un problema de conexión. Es posible que la reserva se haya registrado en el servidor. Por favor, no intente crearla nuevamente de inmediato; revise la sección de "Mis reservas" para verificar si su reserva ya fue procesada.',
  errorCatSedes:
    'No fue posible cargar el listado de sedes. Por favor, intente de nuevo.',
  errorCatTipos:
    'No fue posible cargar el listado de tipos de habitación.',
  botonReintentar: 'Reintentar',

  // Restricción de acceso
  accesoRestringidoTitulo: 'Acceso reservado para clientes',
  accesoRestringidoMensaje:
    'Esta sección está destinada exclusivamente para que los clientes realicen sus reservas de habitación. Si tiene una cuenta de cliente, por favor inicie sesión para continuar.',
  botonIniciarSesion: 'Iniciar sesión',
};
