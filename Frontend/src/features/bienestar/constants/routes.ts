export const BIENESTAR_ROUTES = {
  CATALOGO: '/bienestar',
  MIS_RESERVAS: '/mis-reservas/bienestar',
  DETALLE: (id: number | string) => `/mis-reservas/bienestar/${id}`,
  ADMIN_SERVICIOS: '/admin/servicios-spa',
  ADMIN_TERAPEUTAS: '/admin/terapeutas',
  ADMIN_CITAS: '/admin/citas-spa',
  ADMIN_CITA_DETALLE: (id: number | string) => `/admin/citas-spa/${id}`,
} as const;
