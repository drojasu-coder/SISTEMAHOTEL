/**
 * Modelo de datos de una sede (sucursal) según el backend y OpenAPI.
 * Verificado contra backend/src/models/sucursal.js y backend/src/modules/sucursales.
 */
export interface Sucursal {
  id: number;
  nombre: string;
  direccion: string | null;
  ciudad: string | null;
  telefono: string | null;
  activa: boolean;
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
