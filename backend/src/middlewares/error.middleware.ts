import { ErrorRequestHandler } from "express";
import{
    ConnectionError,
    ForeignKeyConstraintError,
    DatabaseError,
    ExclusionConstraintError,
    TimeoutError,
    UniqueConstraintError,
    ValidationError as SequelizeValidationError,
} from "sequelize";

import { AppError } from "../utils/AppError";

export const errorHandler: ErrorRequestHandler =(
    error,
    req,
    res,
    _next
) => {
    if (res.headersSent) {
        return _next(error);
    }

    let statusCode = 500;
    let code = "INTERNAL_SERVER_ERROR";
    let message = "Ocurrió un error interno en el servidor";
    let details: unknown = undefined;

    // Errores creados por nuestra aplicación
    if(error instanceof AppError){
        statusCode = error.statusCode;
        code = error.code;
        message = error.message;
        details = error.details;
    }
    
    // JSON mal escrito
    else if(
        error instanceof SyntaxError &&
        (error as any).type === "entity.parse.failed"
    ){
        statusCode = 400;
        code = "INVALID_JSON";
        message = "El cuerpo de la petición contiene JSON inválido";
    }
    else if ((error as { type?: string }).type === "entity.too.large") {
        statusCode = 413;
        code = "REQUEST_ENTITY_TOO_LARGE";
        message = "El cuerpo de la petición supera el tamaño permitido";
    }

    // Restricción UNIQUE
    else if (error instanceof UniqueConstraintError){
        statusCode = 409;
        code = "DUPLICATE_RESOURCE";
        message = "Ya existe un registro con esos datos";

        details = error.errors.map((item) =>({
            field: item.path,
            message: item.message
        }));
    }

  // Foreign key inválida
  else if (error instanceof ForeignKeyConstraintError){
    statusCode = 409;
    code = "FOREIGN_KEY_CONFLICT";
    message = "La operación hace referencia a un registro relacionado inválido";
  }   
  else if (error instanceof ExclusionConstraintError) {
    statusCode = 409;
    code = "RESOURCE_CONFLICT";
    message = "La operación entra en conflicto con un registro existente";
  }
  // Validaciones propias de Sequelize
  else if (error instanceof SequelizeValidationError){
    statusCode = 422;
    code = "DATABASE_VALIDATION_ERROR";
    message = "Los datos no cumplen las validaciones requeridas";

    details = error.errors.map((item) => ({
        field: item.path,
        message: item.message
    }));
  }
  // Base de datos caída / inaccesible
  else if (
    error instanceof ConnectionError ||
    error instanceof TimeoutError
  ){
    statusCode = 503;
    code = "DATABASE_UNAVAILABLE";
    message = "La base de datos no está disponible temporalmente";
  }
  else if (error instanceof DatabaseError) {
    const databaseCode = (error.parent as { code?: string } | undefined)?.code;
    if (databaseCode === "40P01") {
      statusCode = 503;
      code = "DATABASE_DEADLOCK";
      message = "La operación no pudo completarse temporalmente. Inténtelo de nuevo";
    } else if (databaseCode === "55P03") {
      statusCode = 503;
      code = "DATABASE_LOCK_TIMEOUT";
      message = "La operación no pudo completarse temporalmente. Inténtelo de nuevo";
    }
  }

  // Los errores 500+ los registramos en consola
  if(statusCode >= 500){
    console.error("ERROR:",{
        method: req.method,
        url: req.originalUrl,
        code,
        errorName: error.name,
        statusCode,
    });
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    code,
    message,
    ...(details !== undefined && {details})
  });
};