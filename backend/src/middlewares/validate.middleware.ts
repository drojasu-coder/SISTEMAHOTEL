import {RequestHandler} from "express";
import {ZodType} from "zod";

import {AppError} from "../utils/AppError";

export const validateBody = (schema: ZodType): RequestHandler =>{
    return (req, _res, next) => {
        const result = schema.safeParse(req.body);

        if(!result.success){
            const details = result.error.issues.map((issue) =>({
                field: issue.path.join("."),
                message: issue.message,
            }));

            return next(
                new AppError(
                    400,
                    "VALIDATION_ERROR",
                    "Los datos enviados no son válidos",
                    details
                )
            );
        }

        req.body = result.data;

        next();
    };
};