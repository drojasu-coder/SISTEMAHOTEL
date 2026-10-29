import { api } from '@/api/client/http';
import { es } from '@/i18n/es';
import {
  AuthFlowError,
  isKnownRole,
  type AuthMeResponseEnvelope,
  type AuthUser,
  type LoginRequest,
  type LoginResponse,
  type LoginResponseEnvelope,
  type RegisterRequest,
  type RegisterResponseEnvelope,
  type ApiEnvelope,
  type GoogleChallenge,
  type GoogleLoginRequest,
} from '../types';

/**
 * Los roles los define el backend. Un rol que el frontend no reconoce se rechaza:
 * no se deduce ni se asume ningún permiso para él.
 */
function assertKnownRole(user: { rol: unknown }): void {
  if (!isKnownRole(user.rol)) {
    throw new AuthFlowError(es.errores.rolDesconocido);
  }
}

export const authApi = {
  async googleChallenge(signal?: AbortSignal): Promise<GoogleChallenge> {
    const response = await api.post<ApiEnvelope<GoogleChallenge>>('/auth/google/challenge', {}, {
      token: null, signal, headers: { 'X-Google-CSRF': 'init' }, cache: 'no-store',
    });
    return response.data;
  },

  async googleLogin(payload: GoogleLoginRequest, nonce: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponseEnvelope>('/auth/google', payload, {
      token: null, headers: { 'X-Google-CSRF': nonce }, cache: 'no-store',
    });
    assertKnownRole(response.data.usuario);
    return response.data;
  },
  /** POST /api/auth/login — petición anónima tipada según contrato OpenAPI. */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponseEnvelope>('/auth/login', credentials, {
      token: null,
    });
    assertKnownRole(response.data.usuario);
    return response.data;
  },

  /** POST /api/auth/register — el backend siempre crea cuentas con rol cliente. */
  async register(payload: RegisterRequest): Promise<AuthUser> {
    const response = await api.post<RegisterResponseEnvelope>('/auth/register', payload, {
      token: null,
    });
    return response.data;
  },

  /** GET /api/auth/me — identidad y rol vigentes según el servidor. */
  async me(): Promise<AuthUser> {
    const response = await api.get<AuthMeResponseEnvelope>('/auth/me');
    assertKnownRole(response.data);
    return response.data;
  },
};
