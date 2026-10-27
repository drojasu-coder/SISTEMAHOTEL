export const RESTAURANTE_ROUTES = {
  CATALOGO: "/restaurante",
  MIS_RESERVAS: "/mis-reservas/restaurante",
  DETALLE_RESERVA: (id: number | string) => `/mis-reservas/restaurante/${id}`,
  ADMIN_RESERVAS: "/admin/reservas-restaurante",
  ADMIN_DETALLE_RESERVA: (id: number | string) => `/admin/reservas-restaurante/${id}`,
} as const;
