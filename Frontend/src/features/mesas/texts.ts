/**
 * Textos del módulo de mesas (español, trato de usted).
 *
 * Se mantienen en un archivo local del módulo porque el archivo global de
 * traducciones (`src/i18n/es.ts`) está fuera del alcance de este lote. La forma
 * reproduce la del archivo global para que el coordinador pueda trasladarlos
 * a `es.ts` (y a `en.ts`) al cerrar la solución de internacionalización.
 */

export const textosMesas = {
  titulo: 'Mesas de HOTEL HUNAHPÚ',
  descripcion:
    'Catálogo de mesas del restaurante por sede y zona, con su capacidad y estado.',
  nuevaMesa: 'Registrar mesa',
  crearTitulo: 'Registrar nueva mesa',
  crearDescripcion:
    'Ingrese los datos para incorporar una mesa al catálogo del restaurante.',
  editarTitulo: 'Editar mesa',
  editarDescripcion:
    'Actualice la zona, la capacidad o el estado de la mesa seleccionada. La sede no se modifica.',
  zonasTitulo: 'Zona',
  zonasPlaceholder: 'Ej. Terraza',
  sede: 'Sede',
  sedePlaceholder: 'Seleccione la sede',
  sedeNoModificable: 'La sede de la mesa no se puede modificar.',
  capacidad: 'Capacidad',
  capacidadPlaceholder: 'Ej. 4',
  estado: 'Estado',
  estadoPlaceholder: 'Ej. disponible',
  estadoAyuda:
    'Texto descriptivo de hasta 20 caracteres. Indica la situación de la mesa, no su disponibilidad para reservar.',
  estadoAyudaEdicion:
    'Texto descriptivo de hasta 20 caracteres. Conserve el estado actual o ingrese otro valor.',
  guardar: 'Guardar mesa',
  guardando: 'Guardando…',
  cancelar: 'Cancelar',
  editar: 'Editar',
  filtros: 'Filtrar mesas',
  filtroSede: 'Filtrar por sede',
  filtroZona: 'Filtrar por zona',
  todasLasSedes: 'Todas las sedes',
  todasLasZonas: 'Todas las zonas',
  limpiarFiltros: 'Limpiar filtros',
  tablasZona: 'Zona',
  tablasSede: 'Sede',
  tablasCapacidad: 'Capacidad',
  tablasEstado: 'Estado',
  tablasAcciones: 'Acciones',
  comensales: 'comensales',
  errorCargar:
    'No fue posible cargar las mesas. Verifique su conexión e inténtelo de nuevo.',
  errorGuardar: 'No fue posible guardar la mesa. Inténtelo de nuevo.',
  sinMesas: 'No hay mesas registradas en este momento.',
  sinMesasAyuda:
    'Comience registrando la primera mesa del restaurante mediante el botón superior.',
  sinMesasAyudaLectura:
    'Todavía no se han registrado mesas en el catálogo del restaurante.',
  sinResultados: 'No se encontraron mesas que coincidan con los filtros seleccionados.',
  mesasMostradas: 'mesas mostradas',
  sedeNoRegistrada: 'Sin sede registrada',
  estadoNoRegistrado: 'Sin estado',
  creadaExito: 'Mesa registrada correctamente.',
  actualizadaExito: 'Mesa actualizada correctamente.',
} as const;
