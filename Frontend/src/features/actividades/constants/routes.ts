export const ACTIVIDADES_ROUTES = {
  CATALOGO: '/actividades',
  MIS_RESERVAS: '/mis-reservas/actividades',
  DETALLE_RESERVA: (id: number | string) => `/mis-reservas/actividades/${id}`,
  ADMIN_RESERVAS: '/admin/reservas-actividades',
  ADMIN_DETALLE_RESERVA: (id: number | string) => `/admin/reservas-actividades/${id}`,
} as const;
