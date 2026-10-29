import type { UxKey } from '@/i18n/ux';
export const experienceLinks: { to: string; label: UxKey }[] = [
  { to: '/amenidades', label: 'amenities' }, { to: '/actividades', label: 'activities' },
  { to: '/bienestar', label: 'wellness' }, { to: '/eventos', label: 'events' },
];
export const primaryLinks: { to: string; label: UxKey; children?: typeof experienceLinks }[] = [
  { to: '/', label: 'home' }, { to: '/habitaciones', label: 'rooms' },
  { to: '/restaurante', label: 'restaurant' }, { to: '/amenidades', label: 'experiences', children: experienceLinks },
  { to: '/sedes', label: 'sites' },
];
export function sectionActive(path: string, to: string) {
  if (to === '/') return path === '/';
  // Explorar habitaciones y reservar son accesos distintos: /reservar tiene su propio acceso.
  if (to === '/reservar') return ['/reservar', '/crear-reserva'].some((p) => path === p || path.startsWith(p + '/'));
  return path === to || path.startsWith(to + '/');
}
