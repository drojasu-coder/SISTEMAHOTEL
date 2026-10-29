import { useLocale } from '@/i18n/LocaleContext';

/** Textos de la administración de sedes (ES/EN) que no estaban en i18n/es.ts. */
const es = {
  categoria: 'Configuración', titulo: 'Sedes', resumen: (n: number, a: number) => `${n} sedes · ${a} activas`,
  nueva: 'Registrar sede', buscar: 'Buscar por nombre, ciudad o dirección', limpiar: 'Limpiar búsqueda', mostradas: (n: number) => n === 1 ? '1 sede mostrada' : `${n} sedes mostradas`,
  cargando: 'Cargando sedes…', error: 'No fue posible cargar las sedes.', reintentar: 'Reintentar', vacio: 'No hay sedes registradas.', vacioAyuda: 'Registre la primera sede con el botón superior.', vacioLectura: 'No hay sedes disponibles en este momento.', sinResultados: 'Ninguna sede coincide con la búsqueda.',
  cols: { sede: 'Sede', direccion: 'Dirección', telefono: 'Teléfono', estado: 'Estado', acciones: 'Acciones' },
  activa: 'Activa', inactiva: 'Inactiva', noRegistrado: 'No registrado', sinFoto: 'Sin fotografía',
  ver: 'Ver detalle', verDe: (n: string) => `Ver detalle de ${n}`, editar: 'Editar', editarDe: (n: string) => `Editar ${n}`, activar: 'Activar', desactivar: 'Desactivar', activarDe: (n: string) => `Activar ${n}`, desactivarDe: (n: string) => `Desactivar ${n}`,
  cerrar: 'Cerrar', detalleDesc: 'Información registrada de la sede y acceso a sus recursos.',
  gUbicacion: 'Ubicación y contacto', ciudad: 'Ciudad', direccion: 'Dirección', telefono: 'Teléfono',
  gImagenes: 'Imágenes', portada: 'Portada de la sede', restaurante: 'Imagen del restaurante', sinImagen: 'Sin imagen registrada', foto: (c: string) => `Foto: ${c}`,
  gRegistro: 'Registro', creada: 'Creada', actualizada: 'Última actualización',
  gRecursos: 'Recursos de esta sede', recursosAyuda: 'Al abrir un listado, el selector de sede del panel queda en esta sede.', recursosError: 'No fue posible consultar los recursos de la sede.', ver2: 'Ver',
  recursos: { habitaciones: 'Habitaciones', tipos_habitacion: 'Tipos de habitación', parqueos: 'Parqueos', mesas: 'Mesas', actividades: 'Actividades', servicios_bienestar: 'Servicios de bienestar', terapeutas: 'Terapeutas', amenidades: 'Amenidades', salones: 'Salones', empleados: 'Empleados' } as Record<string, string>,
  verRecurso: (r: string, s: string) => `Ver ${r.toLowerCase()} de ${s}`,
  alcance: 'Su cuenta consulta solo las sedes autorizadas.',
};
const en: typeof es = {
  categoria: 'Configuration', titulo: 'Sites', resumen: (n: number, a: number) => `${n} sites · ${a} active`,
  nueva: 'Register site', buscar: 'Search by name, city or address', limpiar: 'Clear search', mostradas: (n: number) => n === 1 ? '1 site shown' : `${n} sites shown`,
  cargando: 'Loading sites…', error: 'The sites could not be loaded.', reintentar: 'Retry', vacio: 'No sites registered.', vacioAyuda: 'Register the first site with the button above.', vacioLectura: 'No sites are available right now.', sinResultados: 'No site matches the search.',
  cols: { sede: 'Site', direccion: 'Address', telefono: 'Phone', estado: 'Status', acciones: 'Actions' },
  activa: 'Active', inactiva: 'Inactive', noRegistrado: 'Not recorded', sinFoto: 'No photo',
  ver: 'View details', verDe: (n: string) => `View details of ${n}`, editar: 'Edit', editarDe: (n: string) => `Edit ${n}`, activar: 'Activate', desactivar: 'Deactivate', activarDe: (n: string) => `Activate ${n}`, desactivarDe: (n: string) => `Deactivate ${n}`,
  cerrar: 'Close', detalleDesc: 'Recorded site information and access to its resources.',
  gUbicacion: 'Location and contact', ciudad: 'City', direccion: 'Address', telefono: 'Phone',
  gImagenes: 'Images', portada: 'Site cover', restaurante: 'Restaurant image', sinImagen: 'No image recorded', foto: (c: string) => `Photo: ${c}`,
  gRegistro: 'Record', creada: 'Created', actualizada: 'Last updated',
  gRecursos: 'Resources of this site', recursosAyuda: 'Opening a list sets the panel site selector to this site.', recursosError: 'The site resources could not be loaded.', ver2: 'View',
  recursos: { habitaciones: 'Rooms', tipos_habitacion: 'Room types', parqueos: 'Parking', mesas: 'Tables', actividades: 'Activities', servicios_bienestar: 'Wellness services', terapeutas: 'Therapists', amenidades: 'Amenities', salones: 'Halls', empleados: 'Employees' },
  verRecurso: (r: string, s: string) => `View ${r.toLowerCase()} of ${s}`,
  alcance: 'Your account only sees authorized sites.',
};
export const useTextosSedes = () => { const { locale } = useLocale(); return locale === 'en' ? en : es; };
