import { Op } from "sequelize";

import { AppError }
  from "../../utils/AppError";

import { env }
  from "../../config/env";

import {
  ROLES,
  Role,
} from "../../constants/roles";

const db = require("../../models");

const {
  sequelize,
  Carrito,
  Usuario,
} = db;

const expireDueCarts = async (
  usuarioId?: number,
  transaction?: any
) => {
  const where: any = {
    estado: "activo",

    expira_en: {
      [Op.lte]: new Date(),
    },
  };

  if (usuarioId !== undefined) {
    where.usuario_id =
      usuarioId;
  }

  await Carrito.update(
    {
      estado: "expirado",
    },
    {
      where,
      transaction,
    }
  );
};

const validateAccess = (
  carrito: any,
  requesterId: number,
  requesterRole: Role
) => {
  if (
    requesterRole !==
      ROLES.ADMIN &&
    carrito.usuario_id !==
      requesterId
  ) {
    throw new AppError(
      403,
      "INSUFFICIENT_PERMISSIONS",
      "No tiene permisos para acceder a este carrito"
    );
  }
};

export const getAll = async (
  requesterId: number,
  requesterRole: Role
) => {
  await expireDueCarts();

  const where =
    requesterRole === ROLES.ADMIN
      ? {}
      : {
          usuario_id:
            requesterId,
        };

  return Carrito.findAll({
    where,

    order: [
      ["id", "DESC"],
    ],
  });
};

export const getCurrent = async (
  usuarioId: number
) => {
  await expireDueCarts(
    usuarioId
  );

  const carrito =
    await Carrito.findOne({
      where: {
        usuario_id:
          usuarioId,

        estado:
          "activo",
      },

      order: [
        ["id", "DESC"],
      ],
    });

  if (!carrito) {
    throw new AppError(
      404,
      "ACTIVE_CART_NOT_FOUND",
      "El usuario no tiene un carrito activo"
    );
  }

  return carrito;
};

export const getById = async (
  id: number,
  requesterId: number,
  requesterRole: Role
) => {
  await expireDueCarts();

  const carrito =
    await Carrito.findByPk(id);

  if (!carrito) {
    throw new AppError(
      404,
      "CART_NOT_FOUND",
      "El carrito solicitado no existe"
    );
  }

  validateAccess(
    carrito,
    requesterId,
    requesterRole
  );

  return carrito;
};

export const create = async (
  usuarioId: number
) => {
  const carritoId =
    await sequelize.transaction(
      async (
        transaction: any
      ) => {
        /*
         * Bloqueamos al usuario para evitar que dos
         * peticiones simultáneas creen dos carritos.
         */
        const usuario =
          await Usuario.findByPk(
            usuarioId,
            {
              transaction,

              lock:
                transaction.LOCK.UPDATE,
            }
          );

        if (!usuario) {
          throw new AppError(
            404,
            "USER_NOT_FOUND",
            "El usuario no existe"
          );
        }

        await expireDueCarts(
          usuarioId,
          transaction
        );

        const existing =
          await Carrito.findOne({
            where: {
              usuario_id:
                usuarioId,

              estado:
                "activo",
            },

            transaction,
          });

        if (existing) {
          throw new AppError(
            409,
            "CART_ALREADY_ACTIVE",
            "El usuario ya tiene un carrito activo"
          );
        }

        const expiresAt =
          new Date(
            Date.now() +
              env.CART_EXPIRATION_MINUTES *
                60 *
                1000
          );

        const carrito =
          await Carrito.create(
            {
              usuario_id:
                usuarioId,

              estado:
                "activo",

              expira_en:
                expiresAt,
            },
            {
              transaction,
            }
          );

        return carrito.id;
      }
    );

  return getById(
    carritoId,
    usuarioId,
    ROLES.ADMIN
  );
};