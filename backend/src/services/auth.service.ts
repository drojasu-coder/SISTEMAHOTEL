import bcrypt from "bcryptjs";
import jwt, {SignOptions} from "jsonwebtoken";

import {AppError } from "../utils/AppError";
import {ROLES} from "../constants/roles";
import {env} from "../config/env";

const db = require("../models");
const {Usuario} = db;

interface RegisterData{
    nombre: string;
    email: string;
    password: string;
    telefono?: string;
}

interface LoginData{
    email:string;
    password: string;
}

const generateAccessToken = (usuario: any): string =>{
    const options: SignOptions ={
        subject: String(usuario.id),
        expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    };
    return jwt.sign(
        {
            rol: usuario.rol,
        },
        env.JWT_SECRET,
        options
    );
};

export const register = async (data: RegisterData) =>{
    const existingUser = await Usuario.findOne({
        where:{
            email: data.email,
        },
    });

    if(existingUser){
        throw new AppError(
            409,
            "EMAIL_ALREDY_REGISTERED",
            "El correo electrónico ya se encuentra registrado"
        );
}

const passwordHash = await bcrypt.hash(data.password, 12);

const usuario = await Usuario.create({
    nombre: data.nombre,
    email: data.email,
    password_hash: passwordHash,
    telefono: data.telefono ?? null,

    // Nunca tomamos el rol desde req.body
    rol: ROLES.CLIENTE,

    activo: true,
});

return {
    id: usuario.id,
    nombre: usuario.nombre,
    email:usuario.email,
    telefono: usuario.telefono,
    rol: usuario.rol,
    activo: usuario.activo,
};
};

export const login = async (data: LoginData) =>{
    const usuario = await Usuario.findOne({
        where:{
            email: data.email,
        },
    });

    // No reveleamos si fue el correo o la contraseña
    if(!usuario){
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

    if (!passwordIsValid){
        throw new AppError(
            401,
            "INVALID_CREDENTIALS",
            "Correo electrónico o contraseña incorrectos"
        );
    }

    if (!usuario.activo){
        throw new AppError(
            403, "USER_INACTIVE",
            "La cuenta de usuario se encuentra deshabilitada"
        );
    }

    const accessToken = generateAccessToken(Usuario);

    return{
        accessToken,

        usuario:{
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            telefono: usuario.telefono,
            rol: usuario.rol,
        },
    };
};
