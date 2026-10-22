import type { paths } from '@/api/generated/schema';
import { es } from '@/i18n/es';

/**
 * Los endpoints de autenticación documentan sus respuestas solo como ejemplo en el
 * OpenAPI (el tipo generado es `unknown`), por lo que las respuestas se tipan aquí
 * a mano. Las peticiones sí se derivan del contrato generado.
 * Ver docs/pendientes-backend.md (BE-001).
 */
export type LoginRequest =
  paths['/api/auth/login']['post']['requestBody']['content']['application/json'];

export type RegisterRequest =
  paths['/api/auth/register']['post']['requestBody']['content']['application/json'];

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
}

export interface LoginResponse {
  accessToken: string;
  usuario: AuthUser;
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
