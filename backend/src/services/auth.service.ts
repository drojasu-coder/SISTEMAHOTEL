import bcrypt from "bcryptjs";

import { AppError } from "../utils/AppError";
import { ROLES } from "../constants/roles";
import { generateAccessToken } from "../utils/jwt";

const db = require("../models");
const { Usuario } = db;

interface RegisterData {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
}

interface LoginData {
  email: string;
  password: string;
}

export const register = async (
  data: RegisterData
) => {
  const existingUser = await Usuario.findOne({
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

  const passwordHash = await bcrypt.hash(
    data.password,
    12
  );

  const usuario = await Usuario.create({
    nombre: data.nombre,
    email: data.email,
    password_hash: passwordHash,
    telefono: data.telefono ?? null,

    // El registro público siempre crea clientes.
    rol: ROLES.CLIENTE,

    activo: true,
  });

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    telefono: usuario.telefono,
    rol: usuario.rol,
    activo: usuario.activo,
  };
};

export const login = async (
  data: LoginData
) => {
  const usuario = await Usuario.findOne({
    where: {
      email: data.email,
    },
  });

  // No indicamos si falló el correo o la contraseña.
  if (!usuario) {
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Correo electrónico o contraseña incorrectos"
    );
  }

  const passwordIsValid = await bcrypt.compare(
    data.password,
    usuario.password_hash
  );

  if (!passwordIsValid) {
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Correo electrónico o contraseña incorrectos"
    );
  }

  if (!usuario.activo) {
    throw new AppError(
      403,
      "USER_INACTIVE",
      "La cuenta de usuario se encuentra deshabilitada"
    );
  }

  const accessToken = generateAccessToken({
    id: usuario.id,
  });

  return {
    accessToken,

    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      telefono: usuario.telefono,
      rol: usuario.rol,
    },
  };
};

export const getCurrentUser = async (
  userId: number
) =>{
  const usuario = await Usuario.findByPk(userId);

  if(!usuario){
    throw new AppError(
      401,
      "USER_NOT_FOUND",
      "La sesión ya no corresponde a un usuario válido"
    );
  }

  if (!usuario.activo){
    throw new AppError(
      403,
      "USER_INACTIVE",
      "La cuenta de usuario se encuentra deshabilitada"
    );
  }

  return{
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    telefono: usuario.telefono,
    rol: usuario.rol,
    activo: usuario.activo,
  };
};