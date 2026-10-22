import { api } from '@/api/client/http';
import { es } from '@/i18n/es';
import {
  AuthFlowError,
  isKnownRole,
  type ApiEnvelope,
  type AuthUser,
  type LoginRequest,
  type LoginResponse,
  type RegisterRequest,
} from '../types';

/**
 * Los roles los define el backend. Un rol que el frontend no reconoce se rechaza:
 * no se deduce ni se asume ningún permiso para él.
 */
function assertKnownRole(user: { rol?: unknown }): void {
  if (!isKnownRole(user.rol)) {
    throw new AuthFlowError(es.errores.rolDesconocido);
  }
}

export const authApi = {
  /** POST /api/auth/login — petición anónima. */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<ApiEnvelope<LoginResponse>>('/auth/login', credentials, {
      token: null,
    });
    assertKnownRole(response.data.usuario);
    return response.data;
  },

  /** POST /api/auth/register — el backend siempre crea cuentas con rol cliente. */
  async register(payload: RegisterRequest): Promise<AuthUser> {
    const response = await api.post<ApiEnvelope<AuthUser>>('/auth/register', payload, {
      token: null,
    });
    return response.data;
  },

  /** GET /api/auth/me — identidad y rol vigentes según el servidor. */
  async me(): Promise<AuthUser> {
    const response = await api.get<ApiEnvelope<AuthUser>>('/auth/me');
    assertKnownRole(response.data);
    return response.data;
  },
};
