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

export const CATEGORIAS_MENU = ["desayuno", "entrada", "plato_fuerte", "postre", "bebida"] as const;
export type CategoriaMenu = (typeof CATEGORIAS_MENU)[number];

/** GET /api/restaurantes: restaurante principal de una sede con resumen de mesas. */
export interface Restaurante {
  id: number;
  sucursal_id: number;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
  Sucursal?: { id: number; nombre: string; ciudad?: string | null };
  mesas?: { total: number; plazas: number };
}

/** Producto de la carta. El precio es final (GTQ) y llega como cadena DECIMAL. */
export interface ProductoMenu {
  id: number;
  restaurante_id: number;
  categoria: CategoriaMenu;
  nombre: string;
  descripcion?: string | null;
  precio: number | string;
  disponible: boolean;
  orden?: number;
  imagen_url?: string | null;
  imagen_creditos?: { autor?: string; licencia?: string; url?: string; texto?: string } | null;
}

export interface SlotDisponibilidad {
  hora: string;
  hora_fin?: string;
  disponible: boolean;
  ocupada: boolean;
  pasada: boolean;
}

export interface ConfiguracionReservasMesa {
  apertura: string;
  cierre: string;
  intervalo_minutos: number;
  duracion_minutos: number;
  ultima_hora_inicio: string;
  slots?: string[];
}

export interface DisponibilidadMesaResponse {
  mesa_id: number;
  fecha: string;
  estado_mesa: string;
  capacidad: number;
  configuracion: ConfiguracionReservasMesa;
  slots: SlotDisponibilidad[];
  horarios_disponibles: string[];
  horarios_ocupados: string[];
}

