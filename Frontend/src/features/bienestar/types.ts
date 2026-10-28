import type { components } from '@/api/generated/schema';

export interface AssetCreditInfo {
  autor?: string;
  fuente?: string;
  licencia?: string;
  url?: string;
}

// Sequelize DECIMAL se serializa también como cadena; OpenAPI aún lo declara number.
export type ServicioBienestar = Omit<components['schemas']['ServicioBienestar'], 'precio'> & {
  precio?: number | string;
  imagen_key?: string | null;
  imagen_url?: string | null;
  imagen_expires_at?: string | null;
  imagen_creditos?: AssetCreditInfo | null;
  /** Sede del servicio; null en los servicios generales anteriores. */
  sucursal_id?: number | null;
  activo?: boolean;
};

export type CreateServicioBienestarInput = components['schemas']['CreateServicioBienestarRequest'];
export type UpdateServicioBienestarInput = components['schemas']['UpdateServicioBienestarRequest'];

export type Terapeuta = components['schemas']['Terapeuta'] & { sucursal_id?: number | null };
export type CreateTerapeutaInput = components['schemas']['CreateTerapeutaRequest'];
export type UpdateTerapeutaInput = components['schemas']['UpdateTerapeutaRequest'];

export type CitaBienestar = Omit<
  components['schemas']['CitaBienestar'],
  'Terapeuta' | 'ServicioBienestar' | 'Usuario'
> & {
  Terapeuta?: Terapeuta | null;
  ServicioBienestar?: ServicioBienestar;
  Usuario?: {
    id?: number;
    nombre?: string;
    email?: string;
  };
};

export type CreateCitaBienestarInput = components['schemas']['CreateCitaBienestarRequest'];
export type UpdateCitaBienestarEstadoInput = components['schemas']['UpdateCitaBienestarEstadoRequest'];

export interface ServiciosBienestarResponse {
  status: string;
  data: ServicioBienestar[];
}

export interface ServicioBienestarResponse {
  status: string;
  data: ServicioBienestar;
}

export interface TerapeutasResponse {
  status: string;
  data: Terapeuta[];
}

export interface TerapeutaResponse {
  status: string;
  data: Terapeuta;
}

export interface CitasBienestarResponse {
  status: string;
  data: CitaBienestar[];
}

export interface CitaBienestarResponse {
  status: string;
  data: CitaBienestar;
}
