import bcrypt from "bcryptjs";
import { Transaction, Op, fn, col, where, UniqueConstraintError } from "sequelize";

import { AppError } from "../../utils/AppError";
import { Role } from "../../constants/roles";

const db = require("../../models");
const { Usuario } = db;

export interface CreateUsuarioData {
  nombre: string;
  email: string;
  password: string;
  rol: Role;
  telefono?: string | null;
  activo?: boolean;
}

interface UpdateUsuarioData {
  nombre?: string;
  email?: string;
  telefono?: string | null;
}

const safeAttributes = [
  "id",
  "nombre",
  "email",
  "rol",
  "telefono",
  "activo",
  "createdAt",
  "updatedAt",
];

export const getAll = async () => {
  return Usuario.findAll({
    attributes: safeAttributes,
    order: [["id", "ASC"]],
  });
};

export const getById = async (
  id: number,
  transaction?: Transaction
) => {
  const usuario = await Usuario.findByPk(
    id,
    {
      attributes: safeAttributes,
      transaction,
    }
  );

  if (!usuario) {
    throw new AppError(
      404,
      "USER_NOT_FOUND",
      "El usuario solicitado no existe"
    );
  }

  return usuario;
};

export const create = async (data: CreateUsuarioData, transaction?: Transaction) => {
  const email = data.email.trim().toLowerCase();
  const duplicate = () => new AppError(409, "EMAIL_ALREADY_REGISTERED", "El correo electrónico ya se encuentra registrado");
  const existingUser = await Usuario.findOne({
    where: where(fn("lower", col("email")), { [Op.eq]: email }), transaction,
  });
  if (existingUser) throw duplicate();
  const passwordHash = await bcrypt.hash(data.password, 12);
  try {
    const usuario = await Usuario.create({
      nombre: data.nombre, email, password_hash: passwordHash,
      rol: data.rol, telefono: data.telefono ?? null, activo: data.activo ?? true,
    }, { transaction });
    return await getById(usuario.id, transaction);
  } catch (error) {
    if (error instanceof UniqueConstraintError) throw duplicate();
    throw error;
  }
};

export const update = async (
  id: number,
  data: UpdateUsuarioData
) => {
  const usuario =
    await Usuario.findByPk(id);

  if (!usuario) {
    throw new AppError(
      404,
      "USER_NOT_FOUND",
      "El usuario solicitado no existe"
    );
  }

  if (
    data.email !== undefined &&
    data.email !== usuario.email
  ) {
    const existingUser =
      await Usuario.findOne({
        where: {
          email: data.email,
        },
      });

    if (
      existingUser &&
      existingUser.id !== id
    ) {
      throw new AppError(
        409,
        "EMAIL_ALREADY_REGISTERED",
        "El correo electrónico ya se encuentra registrado"
      );
    }
  }

  await usuario.update(data);

  return getById(id);
};

export const updateRole = async (
  id: number,
  rol: Role,
  currentUserId: number
) => {
  if (id === currentUserId) {
    throw new AppError(
      422,
      "CANNOT_CHANGE_OWN_ROLE",
      "No puede modificar su propio rol"
    );
  }

  const usuario =
    await Usuario.findByPk(id);

  if (!usuario) {
    throw new AppError(
      404,
      "USER_NOT_FOUND",
      "El usuario solicitado no existe"
    );
  }

  await usuario.update({
    rol,
  });

  return getById(id);
};

export const updateStatus = async (
  id: number,
  activo: boolean,
  currentUserId: number
) => {
  if (
    id === currentUserId &&
    activo === false
  ) {
    throw new AppError(
      422,
      "CANNOT_DISABLE_OWN_ACCOUNT",
      "No puede deshabilitar su propia cuenta"
    );
  }

  const usuario =
    await Usuario.findByPk(id);

  if (!usuario) {
    throw new AppError(
      404,
      "USER_NOT_FOUND",
      "El usuario solicitado no existe"
    );
  }

  await usuario.update({
    activo,
  });

  return getById(id);
};

