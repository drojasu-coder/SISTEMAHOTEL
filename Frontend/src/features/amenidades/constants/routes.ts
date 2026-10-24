export const AMENIDADES_ROUTES = {
  CATALOGO: "/amenidades",
  MIS_RESERVAS: "/mis-reservas/amenidades",
  DETALLE_RESERVA: (id: number | string) => `/mis-reservas/amenidades/${id}`,
  ADMIN_RESERVAS: "/admin/reservas-amenidades",
  ADMIN_DETALLE_RESERVA: (id: number | string) => `/admin/reservas-amenidades/${id}`,
} as const;
