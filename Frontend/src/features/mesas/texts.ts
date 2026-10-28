import { es } from '@/i18n/es';
import { useLocale } from '@/i18n/LocaleContext';

/**
 * Textos del módulo de mesas delegados al diccionario global de traducciones (`src/i18n/es.ts`).
 */
export const textosMesas = {
  ...es.mesas,
  verReservas: 'Ver reservas de restaurante',
  modulo: es.modulos.restaurante,
  cerrar: es.comunes.cerrar,
  cargando: es.comunes.cargando,
  reintentar: es.comunes.reintentar,
  opcional: es.comunes.opcional,
  errorSedes:
    'No fue posible cargar el catálogo de sedes. Inténtelo de nuevo o contacte al administrador.',
};

type TextosMesas = typeof textosMesas;

const textosMesasEn: TextosMesas = {
  titulo: 'HOTEL HUNAHPÚ tables',
  descripcion: 'Restaurant table catalog by site and area, with capacity and status.',
  nuevaMesa: 'Register table',
  crearTitulo: 'Register new table',
  crearDescripcion: 'Enter the details to add a table to the restaurant catalog.',
  editarTitulo: 'Edit table',
  editarDescripcion: 'Update the area, capacity or status of the selected table. The site cannot be changed.',
  zonasTitulo: 'Area',
  zonasPlaceholder: 'E.g. Terrace',
  sede: 'Site',
  sedePlaceholder: 'Select the site',
  sedeNoModificable: 'The table site cannot be changed.',
  capacidad: 'Capacity',
  capacidadPlaceholder: 'E.g. 4',
  estado: 'Status',
  estadoPlaceholder: 'E.g. available',
  estadoAyuda:
    'Descriptive text of up to 20 characters. It describes the table condition, not its availability for booking.',
  estadoAyudaEdicion:
    'Descriptive text of up to 20 characters. Keep the current status or enter another value.',
  guardar: 'Save table',
  guardando: 'Saving…',
  cancelar: 'Cancel',
  editar: 'Edit',
  filtros: 'Filter tables',
  filtroSede: 'Filter by site',
  filtroZona: 'Filter by area',
  todasLasSedes: 'All sites',
  todasLasZonas: 'All areas',
  limpiarFiltros: 'Clear filters',
  tablasZona: 'Area',
  tablasSede: 'Site',
  tablasCapacidad: 'Capacity',
  tablasEstado: 'Status',
  tablasAcciones: 'Actions',
  comensales: 'guests',
  errorCargar: 'The tables could not be loaded. Check your connection and try again.',
  errorGuardar: 'The table could not be saved. Please try again.',
  sinMesas: 'There are no tables registered at the moment.',
  sinMesasAyuda: 'Start by registering the first restaurant table with the button above.',
  sinMesasAyudaLectura: 'No tables have been registered in the restaurant catalog yet.',
  sinResultados: 'No tables match the selected filters.',
  mesasMostradas: 'tables shown',
  sedeNoRegistrada: 'No site recorded',
  estadoNoRegistrado: 'No status',
  creadaExito: 'Table registered.',
  actualizadaExito: 'Table updated.',
  verReservas: 'View restaurant reservations',
  modulo: 'Restaurant',
  cerrar: 'Close',
  cargando: 'Loading...',
  reintentar: 'Try again',
  opcional: '(optional)',
  errorSedes: 'The site catalog could not be loaded. Please try again or contact the administrator.',
};

/** Textos de mesas según el idioma activo del panel. */
export function useTextosMesas(): TextosMesas {
  const { locale } = useLocale();
  return locale === 'en' ? textosMesasEn : textosMesas;
}
