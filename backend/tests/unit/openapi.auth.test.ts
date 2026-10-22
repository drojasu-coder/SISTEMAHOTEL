import { describe, expect, it } from "vitest";
import { swaggerSpec } from "../../src/docs/swagger";
import { ROLES } from "../../src/constants/roles";

describe("OpenAPI authentication contract (BE-001)", () => {
  const paths = swaggerSpec.paths as Record<string, Record<string, any>>;
  const schemas = (swaggerSpec.components?.schemas || {}) as Record<string, any>;

  describe("component schemas", () => {
    it("defines RegisterRequest matching validation rules", () => {
      const schema = schemas.RegisterRequest;
      expect(schema).toBeDefined();
      expect(schema.type).toBe("object");
      expect(schema.required).toEqual(["nombre", "email", "password"]);
      expect(schema.additionalProperties).toBe(false);
      expect(schema.properties.nombre.maxLength).toBe(150);
      expect(schema.properties.email.format).toBe("email");
      expect(schema.properties.password.format).toBe("password");
      expect(schema.properties.password.minLength).toBe(8);
      expect(schema.properties.telefono).toBeDefined();
    });

    it("defines LoginRequest matching login schema", () => {
      const schema = schemas.LoginRequest;
      expect(schema).toBeDefined();
      expect(schema.type).toBe("object");
      expect(schema.required).toEqual(["email", "password"]);
      expect(schema.additionalProperties).toBe(false);
      expect(schema.properties.email.format).toBe("email");
      expect(schema.properties.password.format).toBe("password");
    });

    it("defines AuthUser without exposing password or password_hash", () => {
      const schema = schemas.AuthUser;
      expect(schema).toBeDefined();
      expect(schema.properties.password).toBeUndefined();
      expect(schema.properties.password_hash).toBeUndefined();
      expect(schema.properties.id).toBeDefined();
      expect(schema.properties.nombre).toBeDefined();
      expect(schema.properties.email).toBeDefined();
      expect(schema.properties.telefono).toBeDefined();
      expect(schema.properties.rol.enum).toEqual(Object.values(ROLES));
      expect(schema.required).toEqual(["id", "nombre", "email", "telefono", "rol"]);
    });

    it("defines AuthUserWithStatus for register and session inspection", () => {
      const schema = schemas.AuthUserWithStatus;
      expect(schema).toBeDefined();
      expect(schema.properties.password).toBeUndefined();
      expect(schema.properties.password_hash).toBeUndefined();
      expect(schema.properties.activo).toBeDefined();
      expect(schema.properties.activo.type).toBe("boolean");
      expect(schema.properties.rol.enum).toEqual(Object.values(ROLES));
      expect(schema.required).toEqual(["id", "nombre", "email", "telefono", "rol", "activo"]);
    });

    it("defines response envelopes with real server structures", () => {
      // LoginData
      expect(schemas.LoginData).toBeDefined();
      expect(schemas.LoginData.required).toEqual(["accessToken", "usuario"]);

      // LoginResponse
      expect(schemas.LoginResponse).toBeDefined();
      expect(schemas.LoginResponse.required).toEqual(["success", "statusCode", "data"]);
      expect(schemas.LoginResponse.properties.success).toBeDefined();
      expect(schemas.LoginResponse.properties.statusCode).toBeDefined();
      expect(schemas.LoginResponse.properties.data.$ref).toBe("#/components/schemas/LoginData");

      // RegisterResponse
      expect(schemas.RegisterResponse).toBeDefined();
      expect(schemas.RegisterResponse.required).toEqual(["success", "statusCode", "data"]);
      expect(schemas.RegisterResponse.properties.success).toBeDefined();
      expect(schemas.RegisterResponse.properties.statusCode).toBeDefined();
      expect(schemas.RegisterResponse.properties.data.$ref).toBe("#/components/schemas/AuthUserWithStatus");

      // AuthMeResponse
      expect(schemas.AuthMeResponse).toBeDefined();
      expect(schemas.AuthMeResponse.required).toEqual(["success", "statusCode", "data"]);
      expect(schemas.AuthMeResponse.properties.success).toBeDefined();
      expect(schemas.AuthMeResponse.properties.statusCode).toBeDefined();
      expect(schemas.AuthMeResponse.properties.data.$ref).toBe("#/components/schemas/AuthUserWithStatus");
    });
  });

  describe("endpoints contract", () => {
    it("POST /api/auth/register documents payload, success response and errors", () => {
      const op = paths["/api/auth/register"]?.post;
      expect(op).toBeDefined();
      expect(op.security).toEqual([]);
      expect(op.requestBody.content["application/json"].schema.$ref).toBe(
        "#/components/schemas/RegisterRequest"
      );
      expect(op.responses["201"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/RegisterResponse"
      );
      expect(op.responses["400"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ValidationErrorResponse"
      );
      expect(op.responses["409"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ErrorResponse"
      );
    });

    it("POST /api/auth/login documents payload, tokens, user data and error cases", () => {
      const op = paths["/api/auth/login"]?.post;
      expect(op).toBeDefined();
      expect(op.security).toEqual([]);
      expect(op.requestBody.content["application/json"].schema.$ref).toBe(
        "#/components/schemas/LoginRequest"
      );
      expect(op.responses["200"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/LoginResponse"
      );
      expect(op.responses["400"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ValidationErrorResponse"
      );
      expect(op.responses["401"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ErrorResponse"
      );
      expect(op.responses["403"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ErrorResponse"
      );
    });

    it("GET /api/auth/me documents bearerAuth security and user profile", () => {
      const op = paths["/api/auth/me"]?.get;
      expect(op).toBeDefined();
      expect(op.security).toEqual([{ bearerAuth: [] }]);
      expect(op.responses["200"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/AuthMeResponse"
      );
      expect(op.responses["401"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ErrorResponse"
      );
      expect(op.responses["403"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ErrorResponse"
      );
    });
  });
});
