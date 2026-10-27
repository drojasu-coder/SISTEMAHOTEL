import type { CarritoItem } from '@/features/carrito/types';
export function groupItems(items: CarritoItem[]) {
  const groups = new Map<string, CarritoItem[]>();
  for (const item of items) groups.set(item.tipo_item, [...(groups.get(item.tipo_item) ?? []), item]);
  return [...groups].map(([type, entries]) => ({ type, entries }));
}
export function itemTypeLabel(type: string, locale: 'es' | 'en'): string {
  const labels: Record<string, [string, string]> = { habitacion: ['Habitaciones', 'Rooms'], evento: ['Eventos', 'Events'], actividad: ['Actividades', 'Activities'], bienestar: ['Bienestar', 'Wellness'], mesa: ['Mesas', 'Tables'], amenidad: ['Amenidades', 'Amenities'], boleto_parque: ['Boletos de parque', 'Park tickets'], transporte: ['Transporte', 'Transport'] };
  return labels[type]?.[locale === 'es' ? 0 : 1] ?? (locale === 'es' ? 'Otros artículos' : 'Other items');
}
