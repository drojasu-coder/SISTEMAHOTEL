/**
 * Cliente HTTP del backend.
 * Respuesta correcta: { success, statusCode, message, data }
 * Respuesta de error:  { success:false, statusCode, code, message, details? }
 * Aquí devolvemos directamente `data` y lanzamos ApiError en los errores.
 */
const BASE = `${import.meta.env.VITE_API_URL ?? ""}/api`;
const TOKEN_KEY = "hunapu_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Se dispara cuando el token ya no sirve, para que AuthContext cierre la sesión. */
export const SESSION_EXPIRED_EVENT = "hunapu:session-expired";
const SESSION_CODES = new Set(["TOKEN_EXPIRED", "INVALID_TOKEN", "INVALID_AUTH_FORMAT", "AUTH_TOKEN_REQUIRED", "USER_NOT_FOUND"]);

type Query = Record<string, string | number | undefined | null>;

async function request<T>(
  method: string,
  path: string,
  opts: { body?: unknown; query?: Query; auth?: boolean } = {},
): Promise<T> {
  const { body, query, auth = true } = opts;
  const qs = query
    ? "?" +
      Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&")
    : "";

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}${qs}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "No se pudo conectar con el servidor. Revisa que el backend esté encendido.");
  }

  const json = await res.json().catch(() => null);

  if (!res.ok || json?.success === false) {
    const code = json?.code ?? "UNKNOWN_ERROR";
    if (res.status === 401 && token && SESSION_CODES.has(code)) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw new ApiError(res.status, code, json?.message ?? "Ocurrió un error inesperado", json?.details);
  }
  return (json?.data ?? null) as T;
}

export const api = {
  get: <T>(path: string, query?: Query, auth = true) => request<T>("GET", path, { query, auth }),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, { body: body ?? {} }),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, { body: body ?? {} }),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

/** Texto amigable para mostrar al usuario a partir de cualquier error. */
export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    const d = e.details;
    if (Array.isArray(d) && d.length && typeof d[0]?.message === "string") {
      return d.map((x: { message: string }) => x.message).join(". ");
    }
    return e.message;
  }
  return e instanceof Error ? e.message : "Ocurrió un error inesperado";
}
