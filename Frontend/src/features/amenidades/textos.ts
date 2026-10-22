/**
 * Textos y etiquetas en español (trato de usted) para la gestión de amenidades.
 * HOTEL HUNAHPÚ.
 */

export const textosAmenidades = {
  modulo: "Servicios e Instalaciones",
  titulo: "Amenidades",
  subtitulo: "HOTEL HUNAHPÚ",
  descripcion:
    "Administre el catálogo de amenidades e instalaciones del hotel, su asignación por sede y el aforo máximo permitido.",

  nuevaAmenidad: "Nueva amenidad",
  editarAmenidad: "Editar amenidad",

  // Búsqueda y filtros
  buscarLabel: "Buscar amenidad por nombre",
  buscarPlaceholder: "Buscar por nombre (ej. Piscina Climatizada)...",
  limpiarBusqueda: "Limpiar búsqueda",
  todasLasSedes: "Todas las sedes",
  filtroSedeLabel: "Filtrar por sede",
  amenidadesMostradas: (count: number) =>
    count === 1 ? "1 amenidad mostrada" : `${count} amenidades mostradas`,

  // Campos de formulario y tabla
  nombre: "Nombre de la amenidad",
  nombrePlaceholder: "Ej. Piscina Climatizada, Gimnasio, Sauna",
  sede: "Sede",
  sedePlaceholder: "Seleccione una sede",
  aforoMaximo: "Aforo máximo",
  aforoMaximoLabel: "Aforo máximo (personas)",
  aforoPlaceholder: "Ej. 25",
  aforoPersonas: (n: number) => `${n} ${n === 1 ? "persona" : "personas"}`,
  acciones: "Acciones",
  editar: "Editar",

  // Modales
  crearTitulo: "Registrar nueva amenidad",
  crearDescripcion:
    "Ingrese los datos de la amenidad y seleccione la sede correspondiente donde se encuentra disponible.",
  editarTitulo: "Editar amenidad",
  editarDescripcion:
    "Modifique el nombre o aforo máximo de la amenidad. La sede asignada no se modifica tras su creación.",
  guardar: "Guardar amenidad",
  guardando: "Guardando...",
  cancelar: "Cancelar",

  // Confirmaciones y avisos
  creadaExito: "La amenidad ha sido registrada correctamente.",
  actualizadaExito: "La amenidad ha sido actualizada correctamente.",

  // Estados de carga y listas vacías
  cargando: "Cargando amenidades...",
  errorCargar: "No fue posible cargar las amenidades",
  sinAmenidadesTitulo: "No hay amenidades registradas",
  sinAmenidadesDescAdmin:
    "Comience registrando la primera amenidad del hotel mediante el botón superior.",
  sinAmenidadesDescLectura:
    "No se encontraron amenidades registradas en este momento.",
  sinResultados:
    "No se encontraron amenidades con los criterios de búsqueda y filtros seleccionados.",
  limpiarFiltros: "Limpiar filtros",

  sedeNoEspecificada: "Sede no especificada",
};
