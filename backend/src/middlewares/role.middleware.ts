import {RequestHandler} from "express";

import { AppError } from "../utils/AppError";
import {Role } from "../constants/roles";

export const requireRole =(
    ...allowedRoles: Role[]
): RequestHandler =>{
    return(req, _res, next) =>{
        if(!req.user) {
            return next(
                new AppError(
                    401,
                    "AUTH_REQUIRED",
                    "Debe iniciar sesión para acceder a este recurso"
                )
            );
        }

        if(!allowedRoles.includes(req.user.rol)){
            return next(
                new AppError(
                    403,
                    "INSUFFICIENTE_PERMISSIONS",
                    "No tiene permisos para realizar esta operación"
                )
            );
        }

        next();
    };
};