/**
 * Textos y etiquetas en español (trato de usted) para el módulo de espacios de parqueo.
 * Siguen la guía de diseño de HOTEL HUNAHPÚ y el contexto de Guatemala.
 *
 * Se mantienen dentro del módulo porque el archivo global de traducciones
 * (`src/i18n/es.ts`) no está al alcance de este lote. La forma sigue la del
 * archivo global para facilitar su traslado cuando se cierre la solución de
 * internacionalización.
 */

export const textosParqueos = {
  modulo: "Gestión de parqueo",
  titulo: "Espacios de parqueo",
  subtitulo: "HOTEL HUNAHPÚ",
  descripcion:
    "Administre los espacios de parqueo del hotel, su asignación por sede y su estado físico actual.",

  nuevoParqueo: "Nuevo espacio de parqueo",
  editarParqueo: "Editar espacio de parqueo",

  // Filtros y búsqueda
  buscarLabel: "Buscar parqueo por número",
  buscarPlaceholder: "Buscar por número (ej. A-01)...",
  limpiarBusqueda: "Limpiar búsqueda",
  todasLasSedes: "Todas las sedes",
  todosLosEstados: "Todos los estados",
  filtroSedeLabel: "Filtrar por sede",
  filtroEstadoLabel: "Filtrar por estado",
  parqueosMostrados: (count: number) =>
    count === 1 ? "1 espacio mostrado" : `${count} espacios mostrados`,

  // Campos de formulario y tabla
  numero: "Número de parqueo",
  numeroAbrev: "Número",
  numeroPlaceholder: "Ej. A-01, B-12",
  sede: "Sede",
  sedePlaceholder: "Seleccione una sede",
  estado: "Estado del espacio",
  estadoAbrev: "Estado",
  estadoAyuda:
    "Estado físico actual del espacio. No indica disponibilidad para reservar en una fecha específica.",
  acciones: "Acciones",
  editar: "Editar",

  // Estados legibles
  estados: {
    disponible: "Disponible",
    ocupado: "Ocupado",
    mantenimiento: "Mantenimiento",
  },

  // Modales
  crearTitulo: "Registrar nuevo espacio de parqueo",
  crearDescripcion:
    "Ingrese los datos del espacio. El número debe ser único dentro de la sede seleccionada.",
  editarTitulo: "Editar espacio de parqueo",
  editarDescripcion:
    "Modifique los datos del espacio. Si cambia el número o la sede, se verificará que no exista duplicidad.",
  guardar: "Guardar espacio",
  guardando: "Guardando...",
  cancelar: "Cancelar",

  // Mensajes de éxito
  creadoExito: "El espacio de parqueo ha sido registrado correctamente.",
  actualizadoExito: "El espacio de parqueo ha sido actualizado correctamente.",

  // Estados de carga y listas vacías
  cargando: "Cargando espacios de parqueo...",
  errorCargar: "No fue posible cargar los espacios de parqueo",
  sinParqueosTitulo: "No hay espacios de parqueo registrados",
  sinParqueosDescAdmin:
    "Comience registrando el primer espacio de parqueo del hotel mediante el botón superior.",
  sinParqueosDescLectura:
    "No se encontraron espacios de parqueo registrados en este momento.",
  sinResultados:
    "No se encontraron espacios de parqueo con los criterios de búsqueda y filtros seleccionados.",
  limpiarFiltros: "Limpiar filtros",

  // Advertencias de catálogos
  sinSedesDisponibles: "No hay sedes registradas para asignar el espacio de parqueo.",
  sedeNoEspecificada: "Sede no especificada",
  errorCatalogoSedes:
    "No fue posible cargar el catálogo de sedes, por lo que el filtro por sede no está disponible.",
};
