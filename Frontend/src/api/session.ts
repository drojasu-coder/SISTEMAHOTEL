/**
 * Almacenamiento de sesión, cancelación de solicitudes privadas y notificación de
 * sesión inválida. Es el único punto del frontend que toca el token de acceso.
 *
 * El backend entrega un JWT de acceso en el cuerpo de la respuesta (no usa cookies),
 * por lo que se conserva en sessionStorage: se descarta al cerrar la pestaña.
 */

const TOKEN_KEY = 'hunapu.accessToken';

export const tokenStorage = {
  get(): string | null {
    try {
      return window.sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      window.sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* Almacenamiento no disponible: la sesión vivirá solo en memoria. */
    }
  },
  clear(): void {
    try {
      window.sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* noop */
    }
  },
};

/**
 * Todas las solicitudes que viajan con credenciales comparten esta señal. Al cerrar
 * sesión o cambiar de usuario se aborta y se crea una nueva, de modo que ninguna
 * respuesta de la sesión anterior pueda llegar a la interfaz.
 */
let privateRequests = new AbortController();

export function getPrivateRequestSignal(): AbortSignal {
  return privateRequests.signal;
}

export function abortPrivateRequests(): void {
  privateRequests.abort();
  privateRequests = new AbortController();
}

export type SessionInvalidReason = 'expired' | 'inactive' | 'invalid-role';

type UnauthorizedHandler = (reason: SessionInvalidReason) => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

/** Registra quién reacciona cuando el servidor invalida la sesión actual. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

export function notifyUnauthorized(reason: SessionInvalidReason): void {
  unauthorizedHandler?.(reason);
}
