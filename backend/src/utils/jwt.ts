import jwt, {
    JwtPayload,
    SignOptions,
} from "jsonwebtoken";

import { env } from "../config/env";
import { Role } from "../constants/roles";

export interface AccessTokenPayload extends JwtPayload{
    role: Role;
    tipo: "access";
}

interface UserForToken{
    id: number;
    rol: Role;
}

export const generateAccessToken =(
    usuario: UserForToken
): string =>{
    const options: SignOptions ={
        subject: String(usuario.id),
        expiresIn:
        env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
        issuer: "sistemahotel",
        audience: "sistemashotel-web",
    };

    return jwt.sign(
        {
        rol: usuario.rol,
        tipo: "access",
        },
        env.JWT_SECRET,
        options
    );
};

export const verifyAccessToken =(
    token: string
): AccessTokenPayload =>{
    return jwt.verify(token, env.JWT_SECRET,{
        issuer: "sistemahotel",
        audience: "sistemahotel-web",
    }) as AccessTokenPayload;
};