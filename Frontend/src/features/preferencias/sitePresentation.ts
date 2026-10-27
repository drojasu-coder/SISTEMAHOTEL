import type { Sucursal } from '@/features/sedes/types';
// Registros verificados por GET /api/sucursales el 26-10-2026. No se crean registros.
// Se exige también el nombre conocido para no renombrar un ID reutilizado en otro entorno.
const official = [
  { id: 1, aliases: ['Hotel Hunapú Antigua', 'Hotel Hunahpú Antigua'], nombre: 'Hotel Hunahpú Antigua', ciudad: 'Antigua Guatemala', short: 'Antigua' },
  { id: 2, aliases: ['Hotel Hunahpú Atitlán'], nombre: 'Hotel Hunahpú Atitlán', ciudad: 'Lago de Atitlán, Panajachel', short: 'Atitlán' },
  { id: 3, aliases: ['Hotel Hunahpú Xela'], nombre: 'Hotel Hunahpú Xela', ciudad: 'Quetzaltenango', short: 'Xela' },
  { id: 4, aliases: ['Hotel Hunahpú Capital'], nombre: 'Hotel Hunahpú Capital', ciudad: 'Ciudad de Guatemala', short: 'Capital' },
];
export function presentSite(site: Sucursal) {
  const known = official.find((s) => s.id === site.id && s.aliases.includes(site.nombre));
  return { ...site, nombre: known?.nombre ?? site.nombre, ciudad: known?.ciudad ?? site.ciudad, short: known?.short ?? site.nombre, order: known ? official.indexOf(known) : 4 };
}
export function orderedSites(sites: Sucursal[]) {
  return sites.filter((s) => s.activa !== false).map(presentSite).sort((a, b) => a.order - b.order || a.id - b.id);
}
