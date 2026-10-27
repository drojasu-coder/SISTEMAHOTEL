import { api } from '@/api/client/http';

export interface PresignImageResponse {
  status?: string;
  data: {
    uploadUrl: string;
    uploadToken: string;
    tempKey: string;
    expiresInSeconds: number;
  };
}

export interface UploadEntityImageParams {
  presignEndpoint: string;
  confirmEndpoint: string;
  file: File;
  onProgress?: (percent: number) => void;
}

/**
 * Flujo genérico y reutilizable de subida de imágenes a AWS S3 con validación server-side:
 * 1. Solicita URL prefirmada PUT y ticket criptográfico al backend.
 * 2. Transfiere el archivo directamente desde el cliente hacia S3 reportando progreso.
 * 3. Confirma la subida en el backend, donde se validan bytes decodificables (sharp o sanitizer SVG)
 *    y se traslada a su clave canónica final.
 */
export async function uploadEntityImage<T = any>({
  presignEndpoint,
  confirmEndpoint,
  file,
  onProgress,
}: UploadEntityImageParams): Promise<T> {
  // 1. Presign
  onProgress?.(10);
  const presignRes = await api.post<any>(presignEndpoint, {
    contentType: file.type,
  });
  const presignData = presignRes.data?.data || presignRes.data || presignRes;
  onProgress?.(25);

  // 2. Subida directa con XHR para monitor de progreso
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presignData.uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round(25 + (e.loaded / e.total) * 50);
        onProgress?.(pct);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Error al transferir imagen al almacenamiento (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error('Fallo de red al transferir la imagen'));
    xhr.ontimeout = () => reject(new Error('Tiempo de espera agotado al subir'));
    xhr.send(file);
  });

  // 3. Confirmación
  onProgress?.(80);
  const confirmRes = await api.post<any>(confirmEndpoint, {
    uploadToken: presignData.uploadToken,
    tempKey: presignData.tempKey,
  });
  onProgress?.(100);

  return (confirmRes.data?.data || confirmRes.data || confirmRes) as T;
}
