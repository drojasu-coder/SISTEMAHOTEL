/**
 * Claves de TanStack Query para el dominio de pagos y checkout.
 * Incluyen el ID del usuario autenticado para evitar filtraciones de caché entre sesiones.
 */
export const pagosQueryKeys = {
  all: ['pagos'] as const,

  // Resumen financiero de un carrito
  resumenCarrito: (carritoId?: number, userId?: number) =>
    [...pagosQueryKeys.all, 'resumen', 'carrito', carritoId ?? 0, userId ?? 'anonymous'] as const,

  // Intento de pago activo con tarjeta en curso para el carrito
  intentoActivo: (carritoId?: number, userId?: number) =>
    [...pagosQueryKeys.all, 'intentoActivo', carritoId ?? 0, userId ?? 'anonymous'] as const,

  // Detalle de un pago específico
  detail: (pagoId?: number, userId?: number) =>
    [...pagosQueryKeys.all, 'detail', pagoId ?? 0, userId ?? 'anonymous'] as const,
};
