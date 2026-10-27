import type { components } from '@/api/generated/schema';

export interface AssetCreditInfo {
  autor?: string;
  fuente?: string;
  licencia?: string;
  url?: string;
}

export type RecursoActividad = components['schemas']['RecursoActividad'] & {
  imagen_key?: string | null;
  imagen_url?: string | null;
  imagen_expires_at?: string | null;
  imagen_creditos?: AssetCreditInfo | null;
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

export type CreateRecursoActividadInput = components['schemas']['CreateRecursoActividadRequest'];
export type UpdateRecursoActividadInput = components['schemas']['UpdateRecursoActividadRequest'];

export type CreateInstructorInput = components['schemas']['CreateInstructorRequest'];
export type UpdateInstructorInput = components['schemas']['UpdateInstructorRequest'];

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

export interface InstructorResponse {
  status: string;
  data: Instructor;
}

export interface ReservasActividadResponse {
  status: string;
  data: ReservaActividad[];
}

export interface ReservaActividadResponse {
  status: string;
  data: ReservaActividad;
}
