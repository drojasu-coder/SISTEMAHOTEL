export const bienestarQueryKeys = {
  servicios: ['servicios-spa'] as const,
  servicio: (id: number) => ['servicios-spa', id] as const,
  terapeutas: ['terapeutas'] as const,
  terapeuta: (id: number) => ['terapeutas', id] as const,
  misCitas: (userId?: number) => ['citas-bienestar', 'mine', userId] as const,
  miCita: (id: number, userId?: number) => ['citas-bienestar', 'mine', userId, id] as const,
  adminCitas: ['citas-bienestar', 'admin'] as const,
  adminCita: (id: number) => ['citas-bienestar', 'admin', id] as const,
};
