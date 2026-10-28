import type { Permission } from './permissions';

/** Lista de rutas que existen en AppRouter. No interpreta rutas codificadas ni normalizadas. */
const publicRoute = /^\/(?:sedes|habitaciones(?:\/[1-9]\d*)?|restaurante|amenidades|actividades|bienestar|eventos(?:\/salones\/[1-9]\d*)?)?$/;
const customerRoute = /^\/(?:reservar|crear-reserva|carrito|checkout|pagos\/[1-9]\d*\/resultado|mis-reservas(?:\/(?:[1-9]\d*|(?:restaurante|amenidades|actividades|bienestar|eventos)(?:\/[1-9]\d*)?))?)$/;
const adminRoutes: [RegExp, Permission][] = [
  [/^\/admin\/habitaciones$/, 'habitaciones.gestionar'],
  [/^\/admin\/tipos-habitacion$/, 'habitaciones.configurar'],
  [/^\/admin\/(?:parqueos|reservas(?:\/[1-9]\d*)?)$/, 'reservas.gestionar'],
  [/^\/admin\/facturacion$/, 'facturas.gestionar'],
  [/^\/admin\/pagos$/, 'pagos.administrar'],
  [/^\/admin\/(?:restaurante|reservas-restaurante(?:\/[1-9]\d*)?)$/, 'restaurante.gestionar'],
  [/^\/admin\/personal$/, 'personal.administrar'],
  [/^\/admin\/(?:configuracion(?:\/inicio)?|sedes|branding|inicio|reportes|instructores|servicios-evento)$/, 'configuracion.administrar'],
  [/^\/admin\/(?:servicios|amenidades|recursos-actividad|servicios-spa|terapeutas|salones|(?:reservas-amenidades|reservas-actividades|citas-spa|reservas-evento)(?:\/[1-9]\d*)?)$/, 'servicios.administrar'],
];
export const returnPermission = (pathname: string) => adminRoutes.find(([route]) => route.test(pathname))?.[1];
export const isCustomerReturn = (pathname: string) => customerRoute.test(pathname);
export const isPublicReturn = (pathname: string) => publicRoute.test(pathname);

const criteria = new Set(['sede', 'sucursal_id', 'fecha_entrada', 'fecha_salida', 'numero_huespedes', 'tipo_habitacion_id', 'buscar', 'q', 'min', 'max', 'orden', 'pagina']);
/** Solo ubicaciones relativas del mismo origen, conocidas y sin secretos. También se usa al restaurar. */
export function safeReturnPath(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048 || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020\u007f]/.test(value)) return null;
  try {
    const url = new URL(value, window.location.origin);
    const rawPath = value.split(/[?#]/)[0];
    if (url.origin !== window.location.origin || url.pathname !== rawPath || /[%#]/.test(rawPath) || url.hash) return null;
    const path = url.pathname;
    if (!isPublicReturn(path) && !isCustomerReturn(path) && path !== '/cuenta' && path !== '/admin' && !returnPermission(path)) return null;
    // habitacion_id solo expresa selección en /reservar; nunca copiar importes, tokens o identidad.
    const params = new URLSearchParams();
    const serviceRoute = /^\/(?:restaurante|bienestar|amenidades|actividades|eventos(?:\/salones\/[1-9]\d*)?)$/.test(path);
    if (isPublicReturn(path) || path === '/reservar' || path === '/crear-reserva') {
      for (const [key, val] of url.searchParams) {
        if ((path === '/reservar' || path === '/crear-reserva') && key === 'habitacion_id' && /^[1-9]\d*$/.test(val) && Number.isSafeInteger(Number(val)) && !params.has(key)) params.set(key, val);
        if (path === '/bienestar' && key === 'duracion' && /^[1-9]\d{0,5}$/.test(val) && !params.has(key)) params.set(key, val);
        if (serviceRoute && ['recurso', 'page', 'zona', 'tipo'].includes(key) && !params.has(key) && val.length <= 100 && !/[\u0000-\u001f\u007f]/.test(val)) {
          if (!['recurso', 'page'].includes(key) || (/^[1-9]\d*$/.test(val) && Number.isSafeInteger(Number(val)))) params.set(key, val);
        }
        if (criteria.has(key) && !params.has(key) && val.length <= 100 && !/[\u0000-\u001f\u007f]/.test(val)) params.set(key, val);
      }
    }
    return `${path}${params.size ? `?${params}` : ''}`;
  } catch { return null; }
}
