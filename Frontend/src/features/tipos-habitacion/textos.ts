/**
 * Textos y etiquetas en español (trato de usted) para la gestión de tipos de habitación.
 * HOTEL HUNAHPÚ - Moneda GTQ (Quetzales).
 */

export const textosTiposHabitacion = {
  modulo: "Gestión de Habitaciones",
  titulo: "Tipos de habitación",
  subtitulo: "HOTEL HUNAHPÚ",
  descripcion:
    "Administre los tipos de estancia, sus capacidades máximas y las tarifas por noche aplicables en HOTEL HUNAHPÚ.",

  nuevoTipo: "Nuevo tipo de habitación",
  editarTipo: "Editar tipo de habitación",

  // Búsqueda y filtros
  buscarLabel: "Buscar tipo de habitación por nombre",
  buscarPlaceholder: "Buscar por nombre (ej. Suite Presidencial)...",
  limpiarBusqueda: "Limpiar búsqueda",
  tiposMostrados: (count: number) =>
    count === 1 ? "1 tipo mostrado" : `${count} tipos mostrados`,

  // Campos de formulario y tabla
  nombre: "Nombre del tipo de habitación",
  nombrePlaceholder: "Ej. Suite Presidencial, Doble Deluxe",
  capacidadMaxima: "Capacidad máxima",
  capacidadMaximaLabel: "Capacidad máxima (personas)",
  capacidadPlaceholder: "Ej. 2, 4",
  tarifaNoche: "Tarifa por noche",
  tarifaNocheLabel: "Tarifa por noche (GTQ)",
  tarifaPlaceholder: "Ej. 1250.00 (0 para cortesía o incluida)",
  descripcionLabel: "Descripción",
  descripcionPlaceholder: "Detalles sobre las amenidades, comodidades o vista...",
  acciones: "Acciones",
  editar: "Editar",

  // Modales
  crearTitulo: "Registrar nuevo tipo de habitación",
  crearDescripcion:
    "Ingrese los datos del tipo de habitación. La tarifa y capacidad máxima se aplicarán a las habitaciones asignadas.",
  editarTitulo: "Editar tipo de habitación",
  editarDescripcion:
    "Modifique los datos del tipo de habitación. Los cambios se reflejarán de inmediato en el catálogo de habitaciones.",
  guardar: "Guardar tipo de habitación",
  guardando: "Guardando...",
  cancelar: "Cancelar",

  // Confirmaciones y avisos
  creadoExito: "El tipo de habitación ha sido registrado correctamente.",
  actualizadoExito: "El tipo de habitación ha sido actualizado correctamente.",

  // Estados de carga y listas vacías
  cargando: "Cargando tipos de habitación...",
  errorCargar: "No fue posible cargar los tipos de habitación",
  sinTiposTitulo: "No hay tipos de habitación registrados",
  sinTiposDescAdmin:
    "Comience registrando el primer tipo de habitación del hotel mediante el botón superior.",
  sinTiposDescLectura:
    "No se encontraron tipos de habitación registrados en este momento.",
  sinResultados:
    "No se encontraron tipos de habitación con el criterio de búsqueda especificado.",
  limpiarFiltros: "Limpiar filtros",
};

export function formatGTQ(monto: number | string | null | undefined): string {
  if (monto === null || monto === undefined || monto === "") return "Q0.00";
  const num = typeof monto === "number" ? monto : parseFloat(monto);
  if (Number.isNaN(num)) return "Q0.00";
  return `Q${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
