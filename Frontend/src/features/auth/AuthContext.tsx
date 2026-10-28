import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client/http';
import {
  abortPrivateRequests,
  isSessionSyncAvailable,
  openSessionSync,
  setUnauthorizedHandler,
  tokenStorage,
  type RemoteSessionEvent,
  type SessionInvalidReason,
  type SessionSync,
} from '@/api/session';
import { es } from '@/i18n/es';
import { authApi } from './api/authApi';
import { AuthFlowError, type AuthUser, type LoginRequest } from './types';

/**
 * - loading: se está verificando con el servidor una sesión existente.
 * - authenticated: hay usuario verificado por el backend.
 * - anonymous: no hay sesión.
 * - error: no se pudo verificar la sesión (red / servidor); el token se conserva.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'error';

const NOTICES: Record<SessionInvalidReason, string> = {
  expired: es.avisosSesion.expirada,
  inactive: es.avisosSesion.inactiva,
  'invalid-role': es.avisosSesion.rolInvalido,
};

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** Motivo por el que el servidor invalidó la sesión, para mostrarlo al iniciar sesión. */
  notice: string | null;
  noticeReason: SessionInvalidReason | null;
  login: (credentials: LoginRequest) => Promise<AuthUser>;
  logout: () => void;
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const isAbort = (error: unknown) =>
  typeof error === 'object' && error !== null && (error as { name?: string }).name === 'AbortError';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  // Sin token propio, la pestaña espera brevemente una sesión compartida antes de ser anónima.
  const [status, setStatus] = useState<AuthStatus>(() =>
    tokenStorage.get() || isSessionSyncAvailable() ? 'loading' : 'anonymous',
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeReason, setNoticeReason] = useState<SessionInvalidReason | null>(null);
  const [attempt, setAttempt] = useState(0);
  const queryClient = useQueryClient();
  const syncRef = useRef<SessionSync | null>(null);
  const remoteHandlerRef = useRef<(event: RemoteSessionEvent) => void>(() => {});

  /**
   * Cancela las solicitudes privadas en vuelo y descarta la caché: nada de la sesión
   * anterior debe poder mostrarse a la siguiente.
   */
  const discardPrivateData = useCallback(() => {
    abortPrivateRequests();
    void queryClient.cancelQueries();
    // Solo la caché de consultas: no se interrumpen las mutaciones del propio formulario.
    queryClient.getQueryCache().clear();
  }, [queryClient]);

  const endSession = useCallback(
    (reason?: SessionInvalidReason) => {
      tokenStorage.clear();
      discardPrivateData();
      setUser(null);
      setNoticeReason(reason ?? null);
      setNotice(reason ? NOTICES[reason] : null);
      setStatus('anonymous');
    },
    [discardPrivateData],
  );

  // El servidor es la fuente de verdad: ante un código de sesión inválida se cierra la sesión.
  useEffect(() => {
    setUnauthorizedHandler(endSession);
    return () => setUnauthorizedHandler(null);
  }, [endSession]);

  // Otras pestañas: un inicio de sesión se adopta (y se valida con el backend); un cierre se aplica.
  remoteHandlerRef.current = (event) => {
    if (event.type === 'logout') {
      if (tokenStorage.get()) endSession();
      return;
    }
    if (event.token === tokenStorage.get()) return;
    discardPrivateData();
    tokenStorage.set(event.token);
    setUser(null);
    setNotice(null);
    setNoticeReason(null);
    setAttempt((value) => value + 1);
  };

  // Canal de sesión entre pestañas (se abre antes de restaurar la sesión).
  useEffect(() => {
    const sync = openSessionSync((event) => remoteHandlerRef.current(event));
    syncRef.current = sync;
    return () => {
      sync?.close();
      syncRef.current = null;
    };
  }, []);

  // Restaura la sesión consultando la identidad y el rol vigentes al backend.
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      if (!tokenStorage.get()) {
        const shared = (await syncRef.current?.requestToken()) ?? null;
        if (cancelled) return;
        // Otra pestaña pudo iniciar o cerrar sesión mientras se esperaba la respuesta.
        if (!tokenStorage.get()) {
          if (!shared) {
            setStatus((current) => (current === 'loading' ? 'anonymous' : current));
            return;
          }
          tokenStorage.set(shared);
        }
      }
      setStatus('loading');
      await authApi
      .me()
      .then((currentUser) => {
        if (cancelled) return;
        setUser(currentUser);
        setStatus('authenticated');
      })
      .catch((error: unknown) => {
        if (cancelled || isAbort(error)) return;
        // Si el manejador global ya cerró la sesión (con su motivo), no se sobrescribe.
        if (!tokenStorage.get()) return;
        if (error instanceof AuthFlowError) {
          endSession('invalid-role');
        } else if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          // Los códigos de sesión inválida ya cerraron la sesión vía el manejador global;
          // cualquier otro 401/403 al restaurar impide confiar en el token.
          endSession('expired');
        } else {
          // Fallo de red o del servidor: se conserva el token y se permite reintentar.
          setStatus('error');
        }
      });
    };

    void restore();
    return () => {
      cancelled = true;
    };
  }, [attempt, endSession]);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const { accessToken, usuario } = await authApi.login(credentials);
      // Cambio de usuario: nada de la sesión previa sobrevive.
      discardPrivateData();
      tokenStorage.set(accessToken);
      syncRef.current?.announceLogin(accessToken);
      setUser(usuario);
      setNotice(null);
      setNoticeReason(null);
      setStatus('authenticated');
      return usuario;
    },
    [discardPrivateData],
  );

  // Cerrar sesión explícitamente la cierra en todas las pestañas.
  const logout = useCallback(() => {
    endSession();
    syncRef.current?.announceLogout();
  }, [endSession]);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, notice, noticeReason, login, logout, retry }),
    [status, user, notice, noticeReason, login, logout, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  }
  return context;
}
