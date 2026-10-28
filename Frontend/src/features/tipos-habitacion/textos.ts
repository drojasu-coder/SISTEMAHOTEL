import { es } from "@/i18n/es";
import { useLocale } from "@/i18n/LocaleContext";

/**
 * Textos del módulo de tipos de habitación delegados al diccionario global de traducciones (`src/i18n/es.ts`).
 */
export const textosTiposHabitacion = {
  ...es.tiposHabitacion,
  tiposMostrados: (count: number) =>
    count === 1 ? "1 tipo mostrado" : `${count} tipos mostrados`,
};

const english: Record<keyof typeof es.tiposHabitacion, string> = {
  modulo: 'Room management', titulo: 'Room types', subtitulo: 'HOTEL HUNAHPÚ',
  descripcion: 'Manage room categories, maximum capacities and nightly rates for each authorized site.',
  nuevoTipo: 'New room type', editarTipo: 'Edit room type', buscarLabel: 'Search room types by name', buscarPlaceholder: 'Search by name...', limpiarBusqueda: 'Clear search',
  nombre: 'Room type name', nombrePlaceholder: 'Example: Deluxe Double', capacidadMaxima: 'Maximum capacity', capacidadMaximaLabel: 'Maximum capacity (people)', capacidadPlaceholder: 'Example: 2, 4',
  capacidadAyuda: 'Maximum capacity applies to every room linked to this category.', tarifaNoche: 'Nightly rate', tarifaNocheLabel: 'Nightly rate (GTQ)', tarifaPlaceholder: 'Example: 1250.00 (0 when complimentary or included)',
  descripcionLabel: 'Description', descripcionPlaceholder: 'Amenities, features or views...', acciones: 'Actions', editar: 'Edit', crearTitulo: 'Register a new room type',
  crearDescripcion: 'Select the site and enter the category details. The rate and capacity apply to linked rooms.', editarTitulo: 'Edit room type',
  editarDescripcion: 'Update the category details. The server validates capacity, site changes and existing reservations.', guardar: 'Save room type', guardando: 'Saving...', cancelar: 'Cancel',
  creadoExito: 'Room type registered successfully.', actualizadoExito: 'Room type updated successfully.', cargando: 'Loading room types...', errorCargar: 'Unable to load room types',
  sinTiposTitulo: 'No room types recorded', sinTiposDescAdmin: 'Register the first room type using the button above.', sinTiposDescLectura: 'No room types are currently available.',
  sinResultados: 'No room types match the selected site and search.', limpiarFiltros: 'Clear filters',
};
export function useTiposHabitacionTexts() {
  const { locale } = useLocale();
  const en = locale === 'en';
  return {
    ...(en ? english : es.tiposHabitacion),
    tiposMostrados: (count: number) => en ? `${count} room types shown` : count === 1 ? '1 tipo mostrado' : `${count} tipos mostrados`,
    sede: en ? 'Room type site' : 'Sede del tipo de habitación',
    selectSede: en ? 'Select a site' : 'Seleccione una sede', general: en ? 'General category (general administrator only)' : 'Categoría general (solo administrador general)',
    generalShort: en ? 'General' : 'General', sedeDesconocida: en ? 'Site not identified' : 'Sede no identificada',
    scopeError: en ? 'Unable to verify your authorized sites. Retry before saving.' : 'No fue posible verificar sus sedes autorizadas. Reintente antes de guardar.',
    retry: en ? 'Retry' : 'Reintentar', readonly: en ? 'Only the general administrator can edit general categories.' : 'Solo el administrador general puede editar las categorías generales.',
    siteNote: en ? 'The site filter also includes clearly identified general categories.' : 'El filtro de sede incluye también las categorías generales, identificadas en el listado.',
    allSites: en ? 'All authorized sites' : 'Todas las sedes autorizadas', opcional: en ? 'optional' : 'opcional',
    personas: (count: number) => en ? `${count} ${count === 1 ? 'person' : 'people'}` : `${count} ${count === 1 ? 'persona' : 'personas'}`,
    editarNombre: (name: string) => (en ? 'Edit ' : 'Editar ') + name,
    fotografia: en ? 'Representative room type photograph' : 'Fotografía representativa del tipo de habitación',
    fotoAyuda: en ? 'JPEG, PNG or WebP files up to 5 MiB' : 'Archivos JPEG, PNG o WebP de hasta 5 MiB',
    fotoActual: en ? 'Room type photograph' : 'Fotografía del tipo de habitación',
    fotoError: en ? 'The details were saved, but the photograph could not be updated. You may retry.' : 'Los datos se guardaron, pero no se pudo actualizar la fotografía. Puede reintentar.',
    cerrar: en ? 'Close' : 'Cerrar', habitaciones: en ? 'Rooms' : 'Habitaciones',
  };
}

export function formatGTQ(monto: number | string | null | undefined): string {
  if (monto === null || monto === undefined || monto === "") return "—";
  const num = typeof monto === "number" ? monto : parseFloat(monto);
  if (!Number.isFinite(num)) return "—";
  return `Q${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
