export const EVENTOS_ROUTES = {
  CATALOGO: '/eventos',
  SALON_DETALLE: (id: number | string) => `/eventos/salones/${id}`,
  MIS_RESERVAS: '/mis-reservas/eventos',
  MI_RESERVA_DETALLE: (id: number | string) => `/mis-reservas/eventos/${id}`,
  ADMIN_SALONES: '/admin/salones',
  ADMIN_SERVICIOS_EVENTO: '/admin/servicios-evento',
  ADMIN_RESERVAS: '/admin/reservas-evento',
  ADMIN_RESERVA_DETALLE: (id: number | string) => `/admin/reservas-evento/${id}`,
} as const;
