import type { components } from "@/api/generated/schema";

export type BaseReservaMesa = components["schemas"]["ReservaMesa"];
export type CreateReservaMesaInput = components["schemas"]["CreateReservaMesaRequest"];
export type UpdateReservaMesaEstadoInput = components["schemas"]["UpdateReservaMesaEstadoRequest"];

export interface MesaConSucursal {
  id: number;
  zona: string;
  capacidad: number;
  estado: "disponible" | "ocupada" | "mantenimiento" | string;
  sucursal_id?: number;
  Sucursal?: {
    id: number;
    nombre: string;
    direccion?: string;
    telefono?: string;
  };
}

export interface UsuarioReserva {
  id: number;
  nombre: string;
  email: string;
}

export interface ReservaMesa {
  id: number;
  usuario_id: number;
  mesa_id: number;
  fecha: string;
  hora: string;
  numero_comensales: number;
  estado: "confirmada" | "cancelada";
  createdAt?: string;
  updatedAt?: string;
  Mesa?: MesaConSucursal;
  Usuario?: UsuarioReserva;
}

export interface ReservasMesaResponse {
  status: string;
  data: ReservaMesa[];
}

export interface ReservaMesaResponse {
  status: string;
  data: ReservaMesa;
}
