/**
 * Constantes de rutas del dominio de pagos y checkout.
 */
export const PAGOS_ROUTES = {
  CHECKOUT: '/checkout',
  RESULTADO: (pagoId: number | string) => `/pagos/${pagoId}/resultado`,
} as const;
