import { useLocale } from '@/i18n/LocaleContext';

/** Textos propios del restaurante y su carta: [español, inglés]. */
const menuCopy = {
  sectionEyebrow: ['Restaurante', 'Restaurant'],
  ourRestaurants: ['Restaurantes de HOTEL HUNAHPÚ', 'HOTEL HUNAHPÚ restaurants'],
  chooseSite: ['Elija una sede para ver la carta de su restaurante.', 'Choose a location to see its restaurant menu.'],
  viewMenu: ['Ver carta', 'View menu'],
  tablesSummary: ['{tables} mesas · {seats} plazas', '{tables} tables · {seats} seats'],
  menuTitle: ['Carta', 'Menu'],
  categories: ['Categorías de la carta', 'Menu categories'],
  all: ['Todo', 'All'],
  desayuno: ['Desayunos', 'Breakfast'],
  entrada: ['Entradas', 'Starters'],
  plato_fuerte: ['Platos fuertes', 'Main courses'],
  postre: ['Postres', 'Desserts'],
  bebida: ['Bebidas', 'Beverages'],
  unavailable: ['No disponible', 'Not available'],
  priceNote: ['Carta de referencia con precios finales en quetzales.', 'Reference menu with final prices in quetzales.'],
  loadingMenu: ['Cargando la carta…', 'Loading the menu…'],
  loadError: ['No se pudo cargar la información del restaurante.', 'The restaurant information could not be loaded.'],
  retry: ['Reintentar', 'Retry'],
  noRestaurant: ['Esta sede no tiene un restaurante publicado por ahora.', 'This location has no published restaurant at the moment.'],
  emptyCategory: ['No hay productos en esta categoría.', 'There are no items in this category.'],
  tablesTitle: ['Reservar mesa', 'Book a table'],
  photoCredits: ['Créditos fotográficos', 'Photo credits'],
  close: ['Cerrar carta', 'Close menu'],
  illustrative: ['Fotografías ilustrativas de cada plato.', 'Illustrative photos of each dish.'],
} as const satisfies Record<string, readonly [string, string]>;

export type MenuCopyKey = keyof typeof menuCopy;

export function useMenuCopy() {
  const { locale } = useLocale();
  return (key: MenuCopyKey, params: Record<string, string | number> = {}) => {
    let text: string = menuCopy[key][locale === 'en' ? 1 : 0];
    for (const [name, value] of Object.entries(params)) text = text.replaceAll(`{${name}}`, String(value));
    return text;
  };
}
