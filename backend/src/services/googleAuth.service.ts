import { createHash, randomBytes, randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { col, fn, Op, Transaction, UniqueConstraintError, where } from "sequelize";
import { env } from "../config/env";
import { ROLES } from "../constants/roles";
import { AppError } from "../utils/AppError";
import { createAuthSession } from "./auth.service";
import { verifyGoogleToken, GoogleProfile } from "./googleToken.service";

const { sequelize, Usuario, GoogleIdentity, GoogleAuthChallenge } = require("../models");
const digest = (nonce: string) => createHash("sha256").update(nonce).digest("hex");
const expired = () => new AppError(401, "GOOGLE_CHALLENGE_EXPIRED", "Reinicie el acceso con Google");

export async function createGoogleChallenge() {
  const nonce = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  // Solo elimina desafíos efímeros vencidos; nunca identidades o usuarios.
  await GoogleAuthChallenge.destroy({ where: { expires_at: { [Op.lt]: new Date() } } });
  const challenge = await GoogleAuthChallenge.create({ id: randomUUID(), nonce_hash: digest(nonce), expires_at: expiresAt });
  return { challengeId: challenge.id as string, nonce, expiresAt: expiresAt.toISOString(), clientId: env.GOOGLE_CLIENT_ID! };
}

function assertGoogleUser(usuario: { activo: boolean; rol: string } | null) {
  if (!usuario?.activo) throw new AppError(403, "USER_INACTIVE", "La cuenta se encuentra deshabilitada");
  // Las cuentas del personal siguen usando su autenticación tradicional, incluso tras un cambio de rol.
  if (usuario.rol !== ROLES.CLIENTE) throw new AppError(403, "GOOGLE_CLIENT_ONLY", "Utilice el acceso con correo y contraseña para esta cuenta");
}

// Recibe exclusivamente una identidad ya verificada por verifyGoogleToken (no datos del body).
export async function resolveGoogleUser(profile: GoogleProfile, password: string | undefined, transaction: Transaction) {
  const identity = await GoogleIdentity.findByPk(profile.sub, { transaction });
  if (identity) {
    const usuario = await Usuario.findByPk(identity.usuario_id, { transaction, lock: transaction.LOCK.UPDATE });
    assertGoogleUser(usuario);
    return usuario;
  }
  let usuario = await Usuario.findOne({
    where: where(fn("lower", fn("btrim", col("email"))), profile.email),
    transaction, lock: transaction.LOCK.UPDATE,
  });
  if (usuario) {
    assertGoogleUser(usuario);
    if (await GoogleIdentity.findOne({ where: { usuario_id: usuario.id }, transaction })) {
      throw new AppError(409, "GOOGLE_IDENTITY_CONFLICT", "La cuenta ya está vinculada a otra identidad de Google");
    }
    if (!password) throw new AppError(409, "GOOGLE_LINK_REQUIRED", "Confirme la contraseña de su cuenta para vincular Google");
    if (!await bcrypt.compare(password, usuario.password_hash)) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Correo electrónico o contraseña incorrectos");
    }
  } else {
    // No inventa una contraseña conocida ni cambia el contrato NOT NULL de usuarios.
    // Una cuenta nueva de Google no tiene contraseña utilizable por la persona.
    usuario = await Usuario.create({
      nombre: profile.nombre, email: profile.email,
      password_hash: await bcrypt.hash(randomBytes(48).toString("base64url"), 12),
      telefono: null, rol: ROLES.CLIENTE, activo: true,
    }, { transaction });
  }
  await GoogleIdentity.create({ sub: profile.sub, usuario_id: usuario.id }, { transaction });
  return usuario;
}

export async function loginWithGoogle(data: { credential: string; challengeId: string; password?: string }, nonce: string) {
  const challenge = await GoogleAuthChallenge.findByPk(data.challengeId);
  if (!challenge || challenge.expires_at <= new Date() || challenge.nonce_hash !== digest(nonce)) throw expired();
  const profile = await verifyGoogleToken(data.credential, nonce);
  return completeVerifiedGoogleLogin(profile, data.challengeId, nonce, data.password);
}

/** Solo para el perfil validado por Google; nunca exponer como endpoint de perfiles. */
export async function completeVerifiedGoogleLogin(profile: GoogleProfile, challengeId: string, nonce: string, password?: string) {
  try {
    return await sequelize.transaction(async (transaction: Transaction) => {
      const current = await GoogleAuthChallenge.findByPk(challengeId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!current || current.expires_at <= new Date() || current.nonce_hash !== digest(nonce)) throw expired();
      const usuario = await resolveGoogleUser(profile, password, transaction);
      // Consumir y crear/vincular cuenta son atómicos. Los reintentos fallidos no dejan usuarios parciales.
      await current.destroy({ transaction });
      return createAuthSession(usuario);
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new AppError(409, "GOOGLE_RETRY", "Otra solicitud completó el registro. Intente nuevamente");
    }
    throw error;
  }
}
