import type { paths, components } from '@/api/generated/schema';
import { es } from '@/i18n/es';

/**
 * Contratos de transporte derivados directamente de OpenAPI (BE-001 resuelto).
 */
export type LoginRequest =
  paths['/api/auth/login']['post']['requestBody']['content']['application/json'];

export type RegisterRequest =
  paths['/api/auth/register']['post']['requestBody']['content']['application/json'];

export type LoginResponseEnvelope =
  paths['/api/auth/login']['post']['responses'][200]['content']['application/json'];

export type RegisterResponseEnvelope =
  paths['/api/auth/register']['post']['responses'][201]['content']['application/json'];

export type AuthMeResponseEnvelope =
  paths['/api/auth/me']['get']['responses'][200]['content']['application/json'];

export type AuthUserSchema = components['schemas']['AuthUser'];
export type AuthUserWithStatusSchema = components['schemas']['AuthUserWithStatus'];
export type LoginDataSchema = components['schemas']['LoginData'];

/** Roles definidos por el backend (backend/src/constants/roles.ts). */
export const ROLES = [
  'admin',
  'recepcionista',
  'gerente_restaurante',
  'gerente_habitaciones',
  'empleado_operativo',
  'cliente',
] as const;

export type Role = (typeof ROLES)[number];

export function isKnownRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  rol: Role;
  activo?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  usuario: AuthUser;
}

/** Contrato de googleAuth.routes.ts; la respuesta de sesión es LoginResponse. */
export interface GoogleChallenge {
  challengeId: string;
  nonce: string;
  expiresAt: string;
  clientId: string;
}

export interface GoogleLoginRequest {
  credential: string;
  challengeId: string;
  password?: string;
}

/** Envoltorio estándar de respuestas exitosas del backend. */
export interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
}

/** Error de flujo de autenticación del lado del cliente (p. ej. rol desconocido). */
export class AuthFlowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthFlowError';
  }
}

export function getRoleLabel(role: Role): string {
  return es.roles[role];
}
