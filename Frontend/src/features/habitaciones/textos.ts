/**
 * Textos y etiquetas en español (trato de usted) para el módulo de habitaciones.
 * Sigue la guía de diseño de HOTEL HUNAHPÚ y contexto de Guatemala.
 */

export const textosHabitaciones = {
  modulo: "Gestión de Habitaciones",
  titulo: "Habitaciones",
  subtitulo: "HOTEL HUNAHPÚ",
  descripcion:
    "Administre el inventario de habitaciones, su asignación por sede, tipo de estancia y estado operativo actual.",

  nuevaHabitacion: "Nueva habitación",
  editarHabitacion: "Editar habitación",

  // Filtros y búsqueda
  buscarLabel: "Buscar habitación por número",
  buscarPlaceholder: "Buscar por número (ej. 101)...",
  limpiarBusqueda: "Limpiar búsqueda",
  todasLasSedes: "Todas las sedes",
  todosLosEstados: "Todos los estados",
  filtroSedeLabel: "Filtrar por sede",
  filtroEstadoLabel: "Filtrar por estado",
  habitacionesMostradas: (count: number) =>
    count === 1 ? "1 habitación mostrada" : `${count} habitaciones mostradas`,

  // Campos de formulario y tabla
  numero: "Número de habitación",
  numeroAbrev: "Número",
  numeroPlaceholder: "Ej. 101, 204B",
  sede: "Sede",
  sedePlaceholder: "Seleccione una sede",
  tipo: "Tipo de habitación",
  tipoPlaceholder: "Seleccione el tipo de habitación",
  estado: "Estado de la habitación",
  estadoAbrev: "Estado",
  tarifaNoche: "Tarifa por noche",
  capacidad: "Capacidad",
  capacidadPersonas: (n: number) => `${n} ${n === 1 ? "persona" : "personas"}`,
  acciones: "Acciones",
  editar: "Editar",

  // Estados legibles
  estados: {
    disponible: "Disponible",
    ocupada: "Ocupada",
    mantenimiento: "Mantenimiento",
    limpieza: "Limpieza",
  },

  // Modales
  crearTitulo: "Registrar nueva habitación",
  crearDescripcion:
    "Ingrese los datos de la nueva habitación. El número debe ser único dentro de la sede seleccionada.",
  editarTitulo: "Editar habitación",
  editarDescripcion:
    "Modifique los datos de la habitación. Si cambia el número o la sede, se verificará que no exista duplicidad.",
  guardar: "Guardar habitación",
  guardando: "Guardando...",
  cancelar: "Cancelar",

  // Mensajes de éxito
  creadaExito: "La habitación ha sido registrada correctamente.",
  actualizadaExito: "La habitación ha sido actualizada correctamente.",

  // Estados de carga y listas vacías
  cargando: "Cargando habitaciones...",
  errorCargar: "No fue posible cargar las habitaciones",
  sinHabitacionesTitulo: "No hay habitaciones registradas",
  sinHabitacionesDescAdmin:
    "Comience registrando la primera habitación del hotel mediante el botón superior.",
  sinHabitacionesDescLectura:
    "No se encontraron habitaciones registradas en este momento.",
  sinResultados: "No se encontraron habitaciones con los criterios de búsqueda y filtros seleccionados.",
  limpiarFiltros: "Limpiar filtros",

  // Advertencias de catálogos
  sinSedesDisponibles: "No hay sedes registradas para asignar a la habitación.",
  sinTiposDisponibles: "No hay tipos de habitación registrados para asignar.",
  sedeNoEspecificada: "Sede no especificada",
  tipoNoEspecificado: "Tipo no especificado",
};

/**
 * Formato de moneda GTQ con símbolo de Quetzal: Q1,234.00
 */
export function formatGTQ(monto: number | string | null | undefined): string {
  if (monto === null || monto === undefined || monto === "") return "Q0.00";
  const num = typeof monto === "number" ? monto : parseFloat(monto);
  if (Number.isNaN(num)) return "Q0.00";
  return `Q${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
