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
};
