import {RequestHandler} from "express";
import {ZodType} from "zod";

import {AppError} from "../utils/AppError";

export const validateBody = (schema: ZodType): RequestHandler =>{
    return (req, _res, next) => {
        const result = schema.safeParse(req.body);

        if(!result.success){
const details = result.error.issues.map((issue) => {
  if (issue.code === "unrecognized_keys") {
    const keys = issue.keys.join(", ");

    return {
      field:
        issue.keys.length === 1
          ? issue.keys[0]
          : "body",
      message:
        issue.keys.length === 1
          ? `El campo "${keys}" no está permitido`
          : `Los campos "${keys}" no están permitidos`,
    };
  }

  if (issue.code === "invalid_type") {
    return {
      field:
        issue.path.length > 0
          ? issue.path.join(".")
          : "body",
      message: "El tipo de dato enviado no es válido",
    };
  }

  return {
    field:
      issue.path.length > 0
        ? issue.path.join(".")
        : "body",
    message: issue.message,
  };
});

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

export const validateParams = (
  schema: ZodType
): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
const details = result.error.issues.map((issue) => {
  if (issue.code === "unrecognized_keys") {
    const keys = issue.keys.join(", ");

    return {
      field:
        issue.keys.length === 1
          ? issue.keys[0]
          : "body",
      message:
        issue.keys.length === 1
          ? `El campo "${keys}" no está permitido`
          : `Los campos "${keys}" no están permitidos`,
    };
  }

  return {
    field:
      issue.path.length > 0
        ? issue.path.join(".")
        : "body",
    message: issue.message,
  };
});
      return next(
        new AppError(
          400,
          "VALIDATION_ERROR",
          "Los parámetros enviados no son válidos",
          details
        )
      );
    }

    req.params = result.data as typeof req.params;

    next();
  };
};