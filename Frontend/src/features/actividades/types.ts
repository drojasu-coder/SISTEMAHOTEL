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
  /** por_hora: reserva exclusiva cobrada por hora. experiencia: salida de duración fija con cupo y precio por persona. */
  modalidad?: 'por_hora' | 'experiencia';
  duracion_minutos?: number | null;
  cupo_maximo?: number | null;
  precio_persona?: number | string | null;
};

/** GET /api/recursos-actividad/:id/salidas?fecha= */
export interface SalidasActividad {
  recurso_id: number;
  fecha: string;
  modalidad: 'por_hora' | 'experiencia';
  cupo_maximo: number | null;
  salidas: { hora_inicio: string; hora_fin: string; participantes: number; disponibles: number }[];
}

export type Instructor = components['schemas']['Instructor'];

export type ReservaActividad = Omit<
  components['schemas']['ReservaActividad'],
  'RecursoActividad' | 'Instructor' | 'Usuario'
> & {
  RecursoActividad?: RecursoActividad;
  Instructor?: Instructor | null;
  numero_participantes?: number;
  Usuario?: {
    id?: number;
    nombre?: string;
    email?: string;
  };
};

// En experiencias el servidor calcula hora_fin y cobra por participante.
export type CreateReservaActividadInput = Omit<components['schemas']['CreateReservaActividadRequest'], 'hora_fin'> & {
  hora_fin?: string;
  numero_participantes?: number;
};
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
