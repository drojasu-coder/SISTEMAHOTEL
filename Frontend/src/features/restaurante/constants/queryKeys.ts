export const restauranteQueryKeys = {
  all: ["restaurante"] as const,
  mesas: () => [...restauranteQueryKeys.all, "mesas"] as const,
  reservas: {
    all: ["reservas-mesa"] as const,
    list: (userId?: number) =>
      [...restauranteQueryKeys.reservas.all, "list", userId] as const,
    detail: (id: number, userId?: number) =>
      [...restauranteQueryKeys.reservas.all, "detail", id, userId] as const,
    adminList: (userId?: number) =>
      [...restauranteQueryKeys.reservas.all, "admin", "list", userId] as const,
    adminDetail: (id: number, userId?: number) =>
      [...restauranteQueryKeys.reservas.all, "admin", "detail", id, userId] as const,
  },
} as const;
