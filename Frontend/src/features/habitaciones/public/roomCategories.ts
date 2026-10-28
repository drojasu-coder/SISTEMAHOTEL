import { useLocale } from '@/i18n/LocaleContext';

export function commercialRoomName(type: { nombre: string; nombre_comercial?: string | null }) {
  return type.nombre_comercial?.trim() || type.nombre;
}

/**
 * Agrupa unidades físicas por categoría comercial (tipo.id). La sede y el tipo se
 * identifican por sus ids reales del backend, nunca por el texto del nombre.
 * El representante es la unidad de menor id, para enlaces estables.
 */
export function groupByCategory<T extends { id: number; tipo: { id: number } | null }>(rooms: T[]) {
  const groups = new Map<number, { representative: T; rooms: T[] }>();
  for (const room of [...rooms].sort((a, b) => a.id - b.id)) {
    if (!room.tipo) continue;
    const group = groups.get(room.tipo.id);
    if (group) group.rooms.push(room);
    else groups.set(room.tipo.id, { representative: room, rooms: [room] });
  }
  return [...groups.values()];
}

/**
 * Tipos ofrecibles en una sede: solo los asignados a esa sede (sucursal_id) y con
 * su nombre comercial. Los tipos generales anteriores (sin sede) quedan fuera.
 * Sin sede elegida no se ofrece filtro de tipo: cada sede tiene sus propias tarifas.
 */
type SiteType = { nombre: string; sucursal_id?: number | null; nombre_comercial?: string | null };

export function typesForSite<T extends { nombre: string }>(tipos: T[], site: number | 'all' | undefined): T[] {
  if (typeof site !== 'number') return [];
  return tipos
    .filter((tipo) => (tipo as SiteType).sucursal_id === site)
    .map((tipo) => ({ ...tipo, nombre: (tipo as SiteType).nombre_comercial ?? tipo.nombre }));
}

/** Indica si el servidor ya entrega la sede de cada tipo (contrato con tarifas por sede). */
export function hasSiteTypes(tipos: { nombre: string }[]) {
  return tipos.some((tipo) => (tipo as SiteType).sucursal_id != null);
}

const roomCopy = {
  available: ['{n} habitaciones disponibles', '{n} rooms available'],
  availableOne: ['1 habitación disponible', '1 room available'],
  chooseSiteForTypes: ['Elija una sede para filtrar por categoría.', 'Choose a location to filter by category.'],
} as const satisfies Record<string, readonly [string, string]>;

export function useRoomCopy() {
  const { locale } = useLocale();
  return (key: keyof typeof roomCopy, params: Record<string, string | number> = {}) => {
    let text: string = roomCopy[key][locale === 'en' ? 1 : 0];
    for (const [name, value] of Object.entries(params)) text = text.replaceAll(`{${name}}`, String(value));
    return text;
  };
}
