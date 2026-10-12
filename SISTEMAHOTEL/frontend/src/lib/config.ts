/**
 * Precios SOLO PARA MOSTRAR de los boletos del parque.
 * El backend los toma de PARK_TICKET_PRICE_* (variables de entorno) y el carrito siempre
 * cobra el precio del servidor. Mantén estos valores iguales a los del .env del backend
 * o define VITE_PARK_PRICE_* para que coincidan.
 * (Pendiente: pedir un endpoint que exponga estos precios y borrar esta constante.)
 */
const num = (v: string | undefined, d: number) => (v ? Number(v) : d);
export const PRECIOS_PARQUE = {
  adulto: num(import.meta.env.VITE_PARK_PRICE_ADULT, 150),
  nino: num(import.meta.env.VITE_PARK_PRICE_CHILD, 75),
  familiar: num(import.meta.env.VITE_PARK_PRICE_FAMILY, 400),
};

export const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
