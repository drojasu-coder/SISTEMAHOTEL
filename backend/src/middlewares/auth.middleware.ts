import {RequestHandler} from "express";
import{
    JsonWebTokenError,
    TokenExpiredError,
} from "jsonwebtoken";

import {AppError} from "../utils/AppError";
import {verifyAccessToken} from "../utils/jwt";
import {ROLES, Role} from "../constants/roles";

export const authMiddleware: RequestHandler =(
    req,
    _res,
    next
) =>{
    const authorization = req.headers.authorization;

    if(!authorization){
        return next(
            new AppError(
                401,
                "AUTH_TOKEN_REQUIRED",
                "Debe iniciar sesión para acceder a este recurso"
            )
        );
    }

    const [scheme, token] = authorization.split (" ");

    if(
        scheme !== "Bearer" ||
        !token
    ){
        return next(
            new AppError(
                401,
                "INVALID_AUTH_FORMAT",
                "El token de autenticación no tiene un formato válido"
            )
        );
    }

    try{
        const payload = verifyAccessToken(token);

        if(
            !payload.sub ||
            payload.tipo !== "access"
        ){
            throw new AppError(
                401,
                "INVALID_TOKEN",
                "El token de autenticación no es válidio"
            );
        }
        const validRoles = Object.values(ROLES);

        if(
            !validRoles.includes(payload.role as Role)
        ){
            throw new AppError(
                401,
                "INVALID_TOKEN",
                "El token contiene información inválida"
            );
        }

        req.user ={
            id: Number(payload.sub),
            rol: payload.rol
        };

        next();
    } catch (error){
        if (error instanceof TokenExpiredError){
            return next(
                new AppError(
                    401,
                    "TOKEN_EXPIRED",
                    "La sesión ha expirado. Inicie sesión nuevamente"
                )
            );
        }

        if (error instanceof JsonWebTokenError){
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