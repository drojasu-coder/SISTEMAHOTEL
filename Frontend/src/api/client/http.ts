import { env } from '@/app/config/env';
import {
  getPrivateRequestSignal,
  notifyUnauthorized,
  tokenStorage,
  type SessionInvalidReason,
} from '@/api/session';

/**
 * Códigos de error del backend que indican que la sesión ya no es utilizable.
 * Verificados contra backend/src/middlewares/auth.middleware.ts y role.middleware.ts.
 * Un 403 ordinario (p. ej. INSUFFICIENT_PERMISSIONS) NO figura aquí: la persona sigue
 * autenticada, solo carece de permiso para esa operación.
 */
const SESSION_INVALID_CODES: Record<string, SessionInvalidReason> = {
  AUTH_TOKEN_REQUIRED: 'expired',
  INVALID_AUTH_FORMAT: 'expired',
  INVALID_TOKEN: 'expired',
  TOKEN_EXPIRED: 'expired',
  USER_NOT_FOUND: 'expired',
  AUTH_REQUIRED: 'expired',
  USER_INACTIVE: 'inactive',
  INVALID_USER_ROLE: 'invalid-role',
};

const isAbortError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { name?: string }).name === 'AbortError';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Descargas binarias; los errores siguen pasando por el manejo JSON central. */
  responseType?: 'blob';
  params?: Record<string, string | number | boolean | undefined | null>;
  token?: string | null;
}

export class ApiError extends Error {
  public status: number;
  public data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }

  /** Código de aplicación del backend (p. ej. INVALID_CREDENTIALS), si existe. */
  get code(): string | undefined {
    if (typeof this.data === 'object' && this.data !== null && 'code' in this.data) {
      const code = (this.data as { code: unknown }).code;
      return typeof code === 'string' ? code : undefined;
    }
    return undefined;
  }

  /** Detalle de validación del backend: [{ field, message }]. */
  get details(): Array<{ field: string; message: string }> {
    if (typeof this.data === 'object' && this.data !== null && 'details' in this.data) {
      const details = (this.data as { details: unknown }).details;
      if (Array.isArray(details)) {
        return details.filter(
          (item): item is { field: string; message: string } =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as { field?: unknown }).field === 'string' &&
            typeof (item as { message?: unknown }).message === 'string',
        );
      }
    }
    return [];
  }
}

export async function httpClient<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, params, token, responseType, headers: customHeaders, ...customConfig } = options;

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let url = `${env.apiBaseUrl}${cleanEndpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(customHeaders as Record<string, string>),
  };

  // `token: undefined` usa la sesión activa; `token: null` fuerza una petición anónima.
  const effectiveToken = token === undefined ? tokenStorage.get() : token;

  if (effectiveToken) {
    headers.Authorization = `Bearer ${effectiveToken}`;
  }

  const config: RequestInit = {
    ...customConfig,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  // Las solicitudes con credenciales se cancelan al cerrar sesión o cambiar de usuario.
  if (effectiveToken) {
    const sessionSignal = getPrivateRequestSignal();
    const callerSignal = customConfig.signal;
    if (callerSignal) {
      const controller = new AbortController();
      const abort = () => controller.abort();
      if (sessionSignal.aborted || callerSignal.aborted) abort();
      sessionSignal.addEventListener('abort', abort, { once: true });
      callerSignal.addEventListener('abort', abort, { once: true });
      config.signal = controller.signal;
    } else {
      config.signal = sessionSignal;
    }
  }

  let response: Response;
  let responseData: unknown = null;
  try {
    response = await fetch(url, config);

    const contentType = response.headers.get('content-type');
    if (response.ok && responseType === 'blob') {
      responseData = await response.blob();
    } else if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
  } catch (cause) {
    // Una cancelación deliberada no es un fallo de red: se propaga tal cual.
    if (isAbortError(cause)) throw cause;
    throw new ApiError(0, 'No fue posible conectar con el servidor', {
      code: 'NETWORK_ERROR',
      cause: cause instanceof Error ? cause.message : undefined,
    });
  }

  if (!response.ok) {
    const errorMessage =
      typeof responseData === 'object' && responseData !== null && 'message' in responseData
        ? String((responseData as { message: unknown }).message)
        : `Error HTTP ${response.status}: ${response.statusText}`;

    const apiError = new ApiError(response.status, errorMessage, responseData);

    // Solo se invalida la sesión si la petición viajó con las credenciales vigentes y el
    // backend respondió con un código de sesión inválida (no por coincidencia de texto).
    const invalidReason =
      (response.status === 401 || response.status === 403) && apiError.code
        ? SESSION_INVALID_CODES[apiError.code]
        : undefined;
    if (effectiveToken && invalidReason && tokenStorage.get() === effectiveToken) {
      notifyUnauthorized(invalidReason);
    }

    throw apiError;
  }

  return responseData as T;
}

export const api = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    httpClient<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    httpClient<T>(endpoint, { ...options, method: 'POST', body }),
  put: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    httpClient<T>(endpoint, { ...options, method: 'PUT', body }),
  patch: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    httpClient<T>(endpoint, { ...options, method: 'PATCH', body }),
  delete: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    httpClient<T>(endpoint, { ...options, method: 'DELETE' }),
};
