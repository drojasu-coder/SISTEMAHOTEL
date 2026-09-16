import bcrypt from "bcryptjs";

import { AppError } from "../../utils/AppError";
import { Role } from "../../constants/roles";

const db = require("../../models");
const { Usuario } = db;

interface CreateUsuarioData {
  nombre: string;
  email: string;
  password: string;
  rol: Role;
  telefono?: string | null;
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
  id: number
) => {
  const usuario = await Usuario.findByPk(
    id,
    {
      attributes: safeAttributes,
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

export const create = async (
  data: CreateUsuarioData
) => {
  const existingUser =
    await Usuario.findOne({
      where: {
        email: data.email,
      },
    });

  if (existingUser) {
    throw new AppError(
      409,
      "EMAIL_ALREADY_REGISTERED",
      "El correo electrónico ya se encuentra registrado"
    );
  }

  const passwordHash =
    await bcrypt.hash(
      data.password,
      12
    );

  const usuario =
    await Usuario.create({
      nombre: data.nombre,
      email: data.email,
      password_hash: passwordHash,
      rol: data.rol,
      telefono:
        data.telefono ?? null,
      activo: true,
    });

  return getById(usuario.id);
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

