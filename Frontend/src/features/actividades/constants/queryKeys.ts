export const actividadesQueryKeys = {
  all: ['actividades'] as const,
  recursos: () => [...actividadesQueryKeys.all, 'recursos'] as const,
  recursoDetail: (id: number) => [...actividadesQueryKeys.all, 'recursos', id] as const,
  instructores: () => [...actividadesQueryKeys.all, 'instructores'] as const,
  salidas: (recursoId: number, fecha: string) => [...actividadesQueryKeys.all, 'salidas', recursoId, fecha] as const,
  reservas: {
    all: ['reservas-actividad'] as const,
    list: (userId?: number) =>
      [...actividadesQueryKeys.reservas.all, 'list', userId] as const,
    detail: (id: number, userId?: number) =>
      [...actividadesQueryKeys.reservas.all, 'detail', id, userId] as const,
    adminList: () =>
      [...actividadesQueryKeys.reservas.all, 'admin', 'list'] as const,
    adminDetail: (id: number) =>
      [...actividadesQueryKeys.reservas.all, 'admin', 'detail', id] as const,
  },
} as const;
