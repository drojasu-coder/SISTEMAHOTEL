export const restauranteQueryKeys = {
  all: ["restaurante"] as const,
  mesas: () => [...restauranteQueryKeys.all, "mesas"] as const,
  restaurantes: () => [...restauranteQueryKeys.all, "restaurantes"] as const,
  menu: (restauranteId: number) => [...restauranteQueryKeys.all, "menu", restauranteId] as const,
  disponibilidad: (mesaId: number, fecha: string) =>
    [...restauranteQueryKeys.all, "disponibilidad", mesaId, fecha] as const,
  disponibilidadAll: () =>
    [...restauranteQueryKeys.all, "disponibilidad"] as const,
  reservas: {
    all: ["reservas-mesa"] as const,
    list: (userId?: number) =>
      [...restauranteQueryKeys.reservas.all, "list", userId] as const,
    detail: (id: number, userId?: number) =>
      [...restauranteQueryKeys.reservas.all, "detail", id, userId] as const,
    adminList: (userId?: number, sucursalId: number | "all" = "all") =>
      [...restauranteQueryKeys.reservas.all, "admin", "list", userId, sucursalId] as const,
    adminDetail: (id: number, userId?: number) =>
      [...restauranteQueryKeys.reservas.all, "admin", "detail", id, userId] as const,
  },
} as const;
