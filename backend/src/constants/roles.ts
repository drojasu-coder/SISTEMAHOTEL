export const ROLES ={
    ADMIN: "admin",
    RECEPCIONISTA: "recepcionista",
    GERENTE_RESTAURANTE: "gerente_restaurante",
    GERENTE_HABITACIONES: "gerente_habitaciones",
    EMPLEADO_OPERATIVO: "empleado_operativo",
    CLIENTE: "cliente",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];