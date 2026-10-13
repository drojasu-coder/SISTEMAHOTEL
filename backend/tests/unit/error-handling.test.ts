import { describe, expect, it, vi } from "vitest";
import { DatabaseError } from "sequelize";
import { z } from "zod";
import { AppError } from "../../src/utils/AppError";
import { errorHandler } from "../../src/middlewares/error.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../src/middlewares/validate.middleware";

const response = () => {
  const result = {
    headersSent: false,
    status: vi.fn(),
    json: vi.fn(),
  };
  result.status.mockReturnValue(result);
  return result;
};

const request = { method: "POST", originalUrl: "/api/test" } as any;

describe("centralized error handling", () => {
  it("preserves the AppError contract and details", () => {
    const res = response();

    errorHandler(
      new AppError(422, "VALIDATION_ERROR", "Datos inválidos", [
        { field: "email", message: "Formato inválido" },
      ]),
      request,
      res as any,
      vi.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 422,
      code: "VALIDATION_ERROR",
      message: "Datos inválidos",
      details: [{ field: "email", message: "Formato inválido" }],
    });
  });

  it("uses a generic response for unexpected errors", () => {
    const res = response();

    errorHandler(new Error("database password leaked"), request, res as any, vi.fn());

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 500,
      code: "INTERNAL_SERVER_ERROR",
      message: "Ocurrió un error interno en el servidor",
    });
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain("database password");
  });

  it("maps PostgreSQL deadlocks without exposing SQL details", () => {
    const res = response();
    const original = Object.assign(new Error("deadlock detail"), { code: "40P01" });

    errorHandler(new DatabaseError(original), request, res as any, vi.fn());

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 503,
      code: "DATABASE_DEADLOCK",
      message: "La operación no pudo completarse temporalmente. Inténtelo de nuevo",
    });
  });

  it("delegates when another middleware already sent headers", () => {
    const res = response();
    res.headersSent = true;
    const next = vi.fn();
    const error = new Error("already sent");

    errorHandler(error, request, res as any, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("reusable Zod validation details", () => {
  const schema = z.object({ email: z.string().email() }).strict();

  it.each([
    ["body", validateBody(schema), { email: "bad", extra: true }],
    ["params", validateParams(schema), { email: "bad", extra: true }],
    ["query", validateQuery(schema), { email: "bad", extra: true }],
  ])("normalizes %s issues into field details", (_name, middleware, value) => {
    const next = vi.fn();
    const req = { body: value, params: value, query: value } as any;

    middleware(req, {} as any, next);

    const error = next.mock.calls[0][0] as AppError;
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details).toEqual(
      expect.arrayContaining([
        { field: "email", message: expect.any(String) },
        { field: "extra", message: 'El campo "extra" no está permitido' },
      ]),
    );
  });
});
