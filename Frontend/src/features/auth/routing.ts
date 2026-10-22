import { PANEL_MODULES, canAccessPanel, getHomeRouteForUser, hasPermission } from './permissions';
import type { AuthUser } from './types';

export { getHomeRouteForUser };

const AUTH_ROUTES = ['/login', '/registro'];

/** ¿Puede este usuario entrar a la ruta interna indicada según sus permisos? */
export function canAccessRoute(user: AuthUser, pathname: string): boolean {
  if (pathname === '/admin') return canAccessPanel(user.rol);
  if (pathname.startsWith('/admin/')) {
    const module = PANEL_MODULES.find(
      (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
    );
    return module !== undefined && hasPermission(user.rol, module.permission);
  }
  return true;
}

/**
 * Destino tras autenticarse. Respeta la ruta que el usuario intentaba visitar solo si
 * es interna y permitida para su rol; en otro caso usa su ruta de inicio.
 */
export function getPostLoginRoute(user: AuthUser, from?: unknown): string {
  if (
    typeof from === 'string' &&
    from.startsWith('/') &&
    !from.startsWith('//') &&
    !AUTH_ROUTES.some((route) => from === route || from.startsWith(`${route}?`))
  ) {
    const pathname = from.split(/[?#]/)[0];
    if (canAccessRoute(user, pathname)) {
      return from;
    }
  }
  return getHomeRouteForUser(user);
}
