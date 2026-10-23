export const AMENIDADES_ROUTES = {
  CATALOGO: "/amenidades",
  MIS_RESERVAS: "/mis-reservas/amenidades",
  DETALLE_RESERVA: (id: number | string) => `/mis-reservas/amenidades/${id}`,
} as const;
