import { api } from '@/api/client/http';
import { uploadEntityImage } from '@/api/mediaUpload';
import type { InicioData, UpdateInicioInput } from '../types';

interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

export const inicioApi = {
  getContent: async (): Promise<InicioData> => {
    const response = await api.get<ApiResponse<InicioData>>('/inicio');
    return response.data;
  },

  updateContent: async (data: UpdateInicioInput): Promise<InicioData> => {
    const response = await api.put<ApiResponse<InicioData>>('/inicio', data);
    return response.data;
  },

  uploadImage: async (
    section: 'hero' | 'presentacion' | 'experiencias',
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<InicioData> => {
    return uploadEntityImage<InicioData>({
      presignEndpoint: `/inicio/imagen/${section}/presign`,
      confirmEndpoint: `/inicio/imagen/${section}/confirmar`,
      file,
      onProgress,
    });
  },

  removeImage: async (
    section: 'hero' | 'presentacion' | 'experiencias',
  ): Promise<InicioData> => {
    const response = await api.delete<ApiResponse<InicioData>>(
      `/inicio/imagen/${section}`,
    );
    return response.data;
  },
};
