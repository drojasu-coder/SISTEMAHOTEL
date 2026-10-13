import {RequestHandler} from "express";
import {ZodIssue, ZodType} from "zod";

import {AppError} from "../utils/AppError";

const issueDetails = (issues: ZodIssue[]) =>
  issues.map((issue) => {
    const field = issue.path.length > 0 ? issue.path.join(".") : "body";

    if (issue.code === "unrecognized_keys") {
      const keys = issue.keys.join(", ");
      return {
        field: issue.keys.length === 1 ? issue.keys[0] : "body",
        message:
          issue.keys.length === 1
            ? `El campo "${keys}" no está permitido`
            : `Los campos "${keys}" no están permitidos`,
      };
    }

    return {
      field,
      message: issue.code === "invalid_type"
        ? "El tipo de dato enviado no es válido"
        : issue.message,
    };
  });

const validationError = (message: string, issues: ZodIssue[]) =>
  new AppError(400, "VALIDATION_ERROR", message, issueDetails(issues));

export const validateBody = (schema: ZodType): RequestHandler =>{
    return (req, _res, next) => {
        const result = schema.safeParse(req.body);

        if(!result.success){
            return next(validationError("Los datos enviados no son válidos", result.error.issues));
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
      return next(validationError("Los parámetros enviados no son válidos", result.error.issues));
    }

    req.params = result.data as typeof req.params;

    next();
  };
};

export const validateQuery = (schema: ZodType): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(validationError("Los parámetros enviados no son válidos", result.error.issues));
    }
    Object.defineProperty(req, "query", {
      value: result.data,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    next();
  };
};