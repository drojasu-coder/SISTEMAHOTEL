export const eventosQueryKeys = {
  allSalones: ['salones'] as const,
  salones: (params?: Record<string, unknown>) => ['salones', params] as const,
  salon: (id: number) => ['salones', id] as const,

  allServicios: ['servicios-evento'] as const,
  servicios: (params?: Record<string, unknown>) => ['servicios-evento', params] as const,
  servicio: (id: number) => ['servicios-evento', id] as const,

  allReservas: ['reservas-evento'] as const,
  misReservas: (userId?: number) => ['reservas-evento', 'mine', userId] as const,
  miReserva: (id: number, userId?: number) => ['reservas-evento', 'mine', id, userId] as const,
  reservaServicios: (reservaId: number) => ['reservas-evento', reservaId, 'servicios'] as const,

  adminReservas: (filters?: Record<string, unknown>) => ['reservas-evento', 'admin', filters] as const,
  adminReserva: (id: number) => ['reservas-evento', 'admin', id] as const,
} as const;
