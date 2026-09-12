import { RequestHandler } from "express";
import {
  JsonWebTokenError,
  TokenExpiredError,
} from "jsonwebtoken";

import { AppError } from "../utils/AppError";
import { verifyAccessToken } from "../utils/jwt";
import { ROLES, Role } from "../constants/roles";

const db = require("../models");
const { Usuario } = db;

export const authMiddleware: RequestHandler = async (
  req,
  _res,
  next
) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return next(
      new AppError(
        401,
        "AUTH_TOKEN_REQUIRED",
        "Debe iniciar sesión para acceder a este recurso"
      )
    );
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(
      new AppError(
        401,
        "INVALID_AUTH_FORMAT",
        "El token de autenticación no tiene un formato válido"
      )
    );
  }

  try {
    // 1. Comprobar firma, expiración, issuer y audience
    const payload = verifyAccessToken(token);

    if (
      !payload.sub ||
      payload.tipo !== "access"
    ) {
      throw new AppError(
        401,
        "INVALID_TOKEN",
        "El token de autenticación no es válido"
      );
    }

    // 2. Obtener ID del usuario desde el JWT
    const userId = Number(payload.sub);

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      throw new AppError(
        401,
        "INVALID_TOKEN",
        "El token contiene un identificador inválido"
      );
    }

    // 3. Consultar el usuario ACTUAL en PostgreSQL
    const usuario = await Usuario.findByPk(
      userId,
      {
        attributes: [
          "id",
          "rol",
          "activo",
        ],
      }
    );

    // 4. Usuario eliminado
    if (!usuario) {
      throw new AppError(
        401,
        "USER_NOT_FOUND",
        "La sesión ya no corresponde a un usuario válido"
      );
    }

    // 5. Usuario deshabilitado
    if (!usuario.activo) {
      throw new AppError(
        403,
        "USER_INACTIVE",
        "La cuenta de usuario se encuentra deshabilitada"
      );
    }

    // 6. Validar que el rol guardado sea reconocido
    const validRoles = Object.values(ROLES);

    if (!validRoles.includes(usuario.rol as Role)) {
      throw new AppError(
        403,
        "INVALID_USER_ROLE",
        "La cuenta no tiene un rol válido asignado"
      );
    }

    // 7. El rol usado desde aquí es el ACTUAL de PostgreSQL
    req.user = {
      id: usuario.id,
      rol: usuario.rol as Role,
    };

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return next(
        new AppError(
          401,
          "TOKEN_EXPIRED",
          "La sesión ha expirado. Inicie sesión nuevamente"
        )
      );
    }

    if (error instanceof JsonWebTokenError) {
      return next(
        new AppError(
          401,
          "INVALID_TOKEN",
          "El token de autenticación no es válido"
        )
      );
    }

    next(error);
  }
};