export const amenidadesQueryKeys = {
  all: ["amenidades"] as const,
  list: () => [...amenidadesQueryKeys.all, "list"] as const,
  detail: (id: number) => [...amenidadesQueryKeys.all, "detail", id] as const,
  reservas: {
    all: ["reservas-amenidad"] as const,
    list: (userId?: number) =>
      [...amenidadesQueryKeys.reservas.all, "list", userId] as const,
    detail: (id: number, userId?: number) =>
      [...amenidadesQueryKeys.reservas.all, "detail", id, userId] as const,
    adminList: (userId?: number) =>
      [...amenidadesQueryKeys.reservas.all, "admin", "list", userId] as const,
    adminDetail: (id: number, userId?: number) =>
      [...amenidadesQueryKeys.reservas.all, "admin", "detail", id, userId] as const,
  },
} as const;
