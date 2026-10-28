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

/**
 * Sesión compartida entre pestañas del mismo origen.
 *
 * El token vive en sessionStorage (por pestaña), así que una pestaña abierta escribiendo
 * la URL o con clic central nacía sin sesión. Con un BroadcastChannel del mismo origen:
 * - una pestaña sin token pide la sesión a las abiertas y una le responde;
 * - iniciar o cerrar sesión se propaga al resto.
 * El token no sale del navegador ni del origen (ninguna pestaña lo publica sin que se lo
 * pidan) y sigue desapareciendo al cerrar todas las pestañas. El backend valida siempre
 * la identidad con /auth/me.
 */
const SESSION_CHANNEL = 'hunapu.session';

type SessionSyncMessage =
  | { type: 'request'; id: string }
  | { type: 'share'; id: string; token: string }
  | { type: 'login'; token: string }
  | { type: 'logout' };

export type RemoteSessionEvent = { type: 'login'; token: string } | { type: 'logout' };

// En pruebas se desactiva por defecto para que cada caso sea determinista.
const syncOptions = { enabled: import.meta.env.MODE !== 'test', timeoutMs: 300 };

/** Permite a las pruebas activar la sincronización o acortar la espera. */
export function configureSessionSync(options: Partial<typeof syncOptions>): void {
  Object.assign(syncOptions, options);
}

export function isSessionSyncAvailable(): boolean {
  return syncOptions.enabled && typeof BroadcastChannel !== 'undefined';
}

export interface SessionSync {
  /** Pide la sesión a otras pestañas; resuelve null si ninguna responde a tiempo. */
  requestToken(): Promise<string | null>;
  announceLogin(token: string): void;
  announceLogout(): void;
  close(): void;
}

export function openSessionSync(onRemote: (event: RemoteSessionEvent) => void): SessionSync | null {
  if (!isSessionSyncAvailable()) return null;
  const channel = new BroadcastChannel(SESSION_CHANNEL);
  const pending = new Map<string, (token: string | null) => void>();
  channel.onmessage = (event: MessageEvent<SessionSyncMessage>) => {
    const message = event.data;
    if (!message || typeof message !== 'object') return;
    if (message.type === 'request') {
      const token = tokenStorage.get();
      if (token) channel.postMessage({ type: 'share', id: message.id, token } satisfies SessionSyncMessage);
    } else if (message.type === 'share') {
      pending.get(message.id)?.(message.token);
    } else if (message.type === 'login' || message.type === 'logout') {
      onRemote(message);
    }
  };
  return {
    requestToken() {
      const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Math.random());
      return new Promise((resolve) => {
        const timer = setTimeout(() => { pending.delete(id); resolve(null); }, syncOptions.timeoutMs);
        pending.set(id, (token) => { clearTimeout(timer); pending.delete(id); resolve(token); });
        channel.postMessage({ type: 'request', id } satisfies SessionSyncMessage);
      });
    },
    announceLogin(token) { channel.postMessage({ type: 'login', token } satisfies SessionSyncMessage); },
    announceLogout() { channel.postMessage({ type: 'logout' } satisfies SessionSyncMessage); },
    close() {
      for (const resolve of pending.values()) resolve(null);
      pending.clear();
      channel.close();
    },
  };
}
