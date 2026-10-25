import type { components } from '@/api/generated/schema';

export type RecursoActividad = components['schemas']['RecursoActividad'] & {
  Sucursal?: {
    id?: number;
    nombre?: string;
    direccion?: string;
  };
};

export type Instructor = components['schemas']['Instructor'];

export type ReservaActividad = Omit<
  components['schemas']['ReservaActividad'],
  'RecursoActividad' | 'Instructor' | 'Usuario'
> & {
  RecursoActividad?: RecursoActividad;
  Instructor?: Instructor | null;
  Usuario?: {
    id?: number;
    nombre?: string;
    email?: string;
  };
};

export type CreateReservaActividadInput = components['schemas']['CreateReservaActividadRequest'];
export type UpdateReservaActividadInput = components['schemas']['UpdateReservaActividadRequest'];

export interface RecursosActividadResponse {
  status: string;
  data: RecursoActividad[];
}

export interface RecursoActividadResponse {
  status: string;
  data: RecursoActividad;
}

export interface InstructoresResponse {
  status: string;
  data: Instructor[];
}

export interface ReservasActividadResponse {
  status: string;
  data: ReservaActividad[];
}

export interface ReservaActividadResponse {
  status: string;
  data: ReservaActividad;
}
