/**
 * Claves de TanStack Query para el dominio de carrito.
 * Vinculan el ID del usuario autenticado para evitar fugas de caché entre sesiones.
 */
export const carritoQueryKeys = {
  all: ['carrito'] as const,

  // Carrito activo del usuario
  current: (userId?: number) =>
    [...carritoQueryKeys.all, 'current', userId ?? 'anonymous'] as const,

  // Listado de ítems y total de un carrito específico
  items: (carritoId?: number, userId?: number) =>
    [...carritoQueryKeys.all, 'items', carritoId ?? 0, userId ?? 'anonymous'] as const,

  // Estado de carrito y pago de una reserva propia (bajo `all`: cualquier cambio del carrito lo refresca)
  estadoReferencia: (tipoItem: string, referenciaId: number, userId?: number) =>
    [...carritoQueryKeys.all, 'estado-referencia', tipoItem, referenciaId, userId ?? 'anonymous'] as const,
};
