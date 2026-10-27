import { canAccessPanel, getHomeRouteForUser, hasPermission } from './permissions';
import { isCustomerReturn, isPublicReturn, returnPermission, safeReturnPath } from './secureReturn';
import type { AuthUser } from './types';
export { getHomeRouteForUser };

export function canAccessRoute(user: AuthUser, pathname: string): boolean {
  if (pathname === '/admin') return canAccessPanel(user.rol);
  const permission = returnPermission(pathname);
  if (permission) return hasPermission(user.rol, permission);
  if (isCustomerReturn(pathname)) return user.rol === 'cliente';
  // La consulta de habitaciones de 3A exige cliente. El personal dispone de su panel.
  if (/^\/habitaciones(?:\/|$)/.test(pathname)) return user.rol === 'cliente';
  return pathname === '/cuenta' || isPublicReturn(pathname);
}
export function getPostLoginRoute(user: AuthUser, from?: unknown): string {
  const safe = safeReturnPath(from);
  return safe && canAccessRoute(user, safe.split('?')[0]) ? safe : getHomeRouteForUser(user);
}
