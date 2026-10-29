import { OAuth2Client, TokenPayload } from "google-auth-library";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

const client = new OAuth2Client({ transporterOptions: { timeout: 10000 } });
export interface GoogleProfile { sub: string; email: string; nombre: string }

// Se ejecuta DESPUÉS de verificar criptográficamente el ID token con la biblioteca oficial.
export function validateGoogleClaims(payload: TokenPayload | undefined, nonce: string): GoogleProfile {
  if (!payload || !payload.sub || payload.sub.length > 255 ||
    !["accounts.google.com", "https://accounts.google.com"].includes(payload.iss) ||
    payload.aud !== env.GOOGLE_CLIENT_ID ||
    (payload.azp !== undefined && payload.azp !== env.GOOGLE_CLIENT_ID) ||
    !Number.isFinite(payload.exp) || payload.exp <= Date.now() / 1000 ||
    (payload as TokenPayload & { nonce?: string }).nonce !== nonce) {
    throw new AppError(401, "GOOGLE_INVALID_TOKEN", "La identificación de Google no es válida o ha expirado");
  }
  if (payload.email_verified !== true || !payload.email) {
    throw new AppError(401, "GOOGLE_EMAIL_UNVERIFIED", "Google debe verificar su correo electrónico");
  }
  const email = payload.email.trim().toLowerCase();
  if (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError(422, "GOOGLE_EMAIL_UNSUPPORTED", "No se puede utilizar ese correo electrónico");
  }
  return { sub: payload.sub, email, nombre: payload.name?.trim().slice(0, 150) || "Cliente" };
}

export async function verifyGoogleToken(credential: string, nonce: string): Promise<GoogleProfile> {
  let payload: TokenPayload | undefined;
  try {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: env.GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch (error) {
    // La biblioteca puede incluir el JWT en su mensaje de error. Nunca propagar ese error.
    const failure = error as { code?: string; response?: { status?: number } };
    if (["ENOTFOUND", "EAI_AGAIN", "ETIMEDOUT", "ECONNRESET", "ECONNREFUSED", "ENETUNREACH"].includes(failure.code ?? "") ||
      failure.response?.status === 429 || (failure.response?.status ?? 0) >= 500) {
      throw new AppError(503, "GOOGLE_UNAVAILABLE", "No fue posible verificar Google. Inténtelo nuevamente");
    }
    throw new AppError(401, "GOOGLE_INVALID_TOKEN", "La identificación de Google no es válida o ha expirado");
  }
  return validateGoogleClaims(payload, nonce);
}
