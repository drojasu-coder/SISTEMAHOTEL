import { api } from '@/api/client/http';
import { uploadEntityImage } from '@/api/mediaUpload';
import type {
  CreateSucursalInput,
  PresignImageResponse,
  PresignImageResult,
  Sucursal,
  SucursalResponse,
  SucursalesResponse,
  UpdateSucursalInput,
} from '../types';

export const sedesApi = {
  /**
   * Consulta pública de todas las sedes.
   * El backend las entrega ordenadas alfabéticamente por nombre.
   */
  getAll: async (): Promise<Sucursal[]> => {
    const response = await api.get<SucursalesResponse>('/sucursales');
    return response.data;
  },

  /**
   * Consulta individual por identificador.
   */
  getById: async (id: number): Promise<Sucursal> => {
    const response = await api.get<SucursalResponse>(`/sucursales/${id}`);
    return response.data;
  },

  /**
   * Creación de sede (requiere rol admin).
   */
  create: async (data: CreateSucursalInput): Promise<Sucursal> => {
    const response = await api.post<SucursalResponse>('/sucursales', data);
    return response.data;
  },

  /**
   * Actualización parcial de sede (requiere rol admin).
   */
  update: async (id: number, data: UpdateSucursalInput): Promise<Sucursal> => {
    const response = await api.patch<SucursalResponse>(`/sucursales/${id}`, data);
    return response.data;
  },

  /**
   * Modificación de estado activo/inactivo (requiere rol admin).
   */
  toggleEstado: async (id: number, activa: boolean): Promise<Sucursal> => {
    const response = await api.patch<SucursalResponse>(`/sucursales/${id}`, { activa });
    return response.data;
  },

  /**
   * Solicita una URL prefirmada de subida temporal a S3.
   */
  requestImagePresign: async (id: number, contentType: string): Promise<PresignImageResult> => {
    const response = await api.post<PresignImageResponse>(`/sucursales/${id}/imagen-presign`, {
      contentType,
    });
    return response.data;
  },

  /**
   * Confirma la subida y valida los bytes de la imagen en backend.
   */
  confirmImageUpload: async (
    id: number,
    uploadToken: string,
    tempKey: string,
  ): Promise<Sucursal> => {
    const response = await api.post<SucursalResponse>(`/sucursales/${id}/imagen-confirmar`, {
      uploadToken,
      tempKey,
    });
    return response.data;
  },

  /**
   * Quita la fotografía principal de la sede.
   */
  removeImage: async (id: number): Promise<Sucursal> => {
    const response = await api.delete<SucursalResponse>(`/sucursales/${id}/imagen`);
    return response.data;
  },

  /**
   * Flujo compuesto: Solicita presign -> Sube directo a S3 desde el navegador -> Confirma en backend.
   */
  uploadSedeImage: async (
    id: number,
    file: File,
    onProgress?: (progressPercent: number) => void,
  ): Promise<Sucursal> => {
    // 1. Solicitar presign
    const presign = await sedesApi.requestImagePresign(id, file.type);
    onProgress?.(25);

    // 2. Subir directamente desde el navegador a S3 usando XMLHttpRequest para reporte de progreso
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', presign.uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round(25 + (e.loaded / e.total) * 50); // 25% a 75%
          onProgress?.(pct);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Error al subir imagen a almacenamiento (${xhr.status})`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Fallo de red al transferir la imagen'));
      };

      xhr.send(file);
    });

    onProgress?.(85);

    // 3. Confirmar y validar en backend
    const updatedSede = await sedesApi.confirmImageUpload(id, presign.uploadToken, presign.tempKey);
    onProgress?.(100);

    return updatedSede;
  },

  /**
   * Sube la imagen del restaurante de la sede directamente a S3.
   */
  uploadRestauranteImage: async (
    id: number,
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<Sucursal> => {
    return uploadEntityImage<Sucursal>({
      presignEndpoint: `/sucursales/${id}/restaurante-imagen-presign`,
      confirmEndpoint: `/sucursales/${id}/restaurante-imagen-confirmar`,
      file,
      onProgress,
    });
  },

  /**
   * Quita la imagen del restaurante de la sede.
   */
  removeRestauranteImage: async (id: number): Promise<Sucursal> => {
    const response = await api.delete<SucursalResponse>(`/sucursales/${id}/restaurante-imagen`);
    return response.data;
  },
};
