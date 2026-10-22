/**
 * Rutas previstas para el flujo de reservas del cliente.
 * Nota: Estas rutas se activarán en el enrutador tras la integración con el backend.
 */
export const RESERVAS_ROUTES = {
  NUEVA: '/reservar',
  MIS_RESERVAS: '/mis-reservas',
  DETALLE: (id: number | string) => `/mis-reservas/${id}`,
} as const;
