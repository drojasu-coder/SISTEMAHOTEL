/**
 * Modelo de datos de una sede (sucursal) según el backend y OpenAPI.
 * Verificado contra backend/src/models/sucursal.js y backend/src/modules/sucursales.
 */
export interface AssetCreditInfo {
  autor?: string;
  fuente?: string;
  licencia?: string;
  url?: string;
  texto?: string;
}

export interface Sucursal {
  id: number;
  nombre: string;
  direccion: string | null;
  ciudad: string | null;
  telefono: string | null;
  activa: boolean;
  imagen_key?: string | null;
  imagen_url?: string | null;
  imagen_expires_at?: string | number | null;
  imagen_creditos?: AssetCreditInfo | any | null;
  restaurante_imagen_key?: string | null;
  restaurante_imagen_url?: string | null;
  restaurante_imagen_expires_at?: string | number | null;
  restaurante_imagen_creditos?: AssetCreditInfo | any | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SucursalesResponse {
  status: 'success';
  data: Sucursal[];
}

export interface SucursalResponse {
  status: 'success';
  data: Sucursal;
}

export interface CreateSucursalInput {
  nombre: string;
  direccion?: string | null;
  ciudad?: string | null;
  telefono?: string | null;
}

export interface UpdateSucursalInput {
  nombre?: string;
  direccion?: string | null;
  ciudad?: string | null;
  telefono?: string | null;
  activa?: boolean;
}

export interface PresignImageResult {
  uploadUrl: string;
  uploadToken: string;
  tempKey: string;
  expiresInSeconds: number;
}

export interface PresignImageResponse {
  status: 'success';
  data: PresignImageResult;
}
