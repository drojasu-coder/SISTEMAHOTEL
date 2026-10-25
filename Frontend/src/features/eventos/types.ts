import type { components } from '@/api/generated/schema';

export type Salon = components['schemas']['Salon'] & {
  sucursal?: {
    id?: number;
    nombre?: string;
    direccion?: string;
  };
};

export type CreateSalonInput = {
  sucursal_id: number;
  nombre: string;
  capacidad_maxima: number;
  tarifa_base: number;
  descripcion?: string | null;
};

export type UpdateSalonInput = Partial<CreateSalonInput>;

export type ServicioEvento = {
  id: number;
  nombre: string;
  precio: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateServicioEventoInput = {
  nombre: string;
  precio: number;
};

export type UpdateServicioEventoInput = Partial<CreateServicioEventoInput>;

export type TipoEvento = 'boda' | 'cumpleanos' | 'ejecutivo' | 'convivio';
export type EstadoReservaEvento = 'cotizacion' | 'confirmada' | 'cancelada' | 'finalizada';

export type ReservaEventoServicio = {
  id: number;
  reserva_evento_id: number;
  servicio_evento_id: number;
  cantidad: number;
  subtotal: number;
  createdAt?: string;
  updatedAt?: string;
  ServicioEvento?: ServicioEvento;
};

export type ReservaEvento = {
  id: number;
  usuario_id: number;
  salon_id: number;
  tipo_evento: TipoEvento;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  numero_invitados: number;
  estado: EstadoReservaEvento;
  anticipo: number;
  total: number;
  createdAt?: string;
  updatedAt?: string;
  Salon?: Salon;
  Usuario?: {
    id?: number;
    nombre?: string;
    email?: string;
    telefono?: string | null;
  };
  Servicios?: ReservaEventoServicio[];
};

export type CreateReservaEventoInput = {
  salon_id: number;
  tipo_evento: TipoEvento;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  numero_invitados: number;
};

export type UpdateReservaEventoInput = Partial<CreateReservaEventoInput>;

export type UpdateReservaEventoEstadoInput = {
  estado: 'confirmada' | 'cancelada' | 'finalizada';
};

export type AddReservaEventoServicioInput = {
  servicio_evento_id: number;
  cantidad: number;
};

export interface SalonesResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Salon[];
}

export interface SalonResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Salon;
}

export interface ServiciosEventoResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ServicioEvento[];
}

export interface ServicioEventoResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ServicioEvento;
}

export interface ReservasEventoResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ReservaEvento[];
}

export interface ReservaEventoResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ReservaEvento;
}

export interface ReservaEventoServiciosResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ReservaEventoServicio[];
}

export interface AddServicioToReservaResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    item: ReservaEventoServicio;
    reserva: {
      total: number;
      anticipo: number;
    };
  };
}
