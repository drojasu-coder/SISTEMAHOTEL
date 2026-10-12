import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { api, tokenStore, SESSION_EXPIRED_EVENT } from "../lib/api";
import type { Usuario } from "../lib/types";

interface AuthState {
  user: Usuario | null;
  loading: boolean;
  isStaff: boolean;
  login: (email: string, password: string) => Promise<Usuario>;
  register: (d: { nombre: string; email: string; password: string; telefono?: string }) => Promise<Usuario>;
  logout: () => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  // Al cargar la página, si hay token guardado se pide el usuario actual.
  useEffect(() => {
    if (!tokenStore.get()) { setLoading(false); return; }
    api.get<Usuario>("/auth/me")
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  // Si cualquier petición detecta un token vencido, se cierra la sesión.
  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, logout);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, logout);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api.post<{ accessToken: string; usuario: Usuario }>("/auth/login", { email, password });
    tokenStore.set(r.accessToken);
    setUser(r.usuario);
    return r.usuario;
  }, []);

  const register = useCallback(async (d: { nombre: string; email: string; password: string; telefono?: string }) => {
    await api.post("/auth/register", d);
    return login(d.email, d.password);
  }, [login]);

  const value = useMemo<AuthState>(
    () => ({ user, loading, isStaff: !!user && user.rol !== "cliente", login, register, logout }),
    [user, loading, login, register, logout],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return c;
};
