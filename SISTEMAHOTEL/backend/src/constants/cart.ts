export const CART_ITEM_TYPES = [
  "habitacion",
  "evento",
  "mesa",
  "actividad",
  "amenidad",
  "bienestar",
  "boleto_parque",
  "transporte",
] as const;

export type CartItemType =
  (typeof CART_ITEM_TYPES)[number];