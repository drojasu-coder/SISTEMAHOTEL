import { describe, expect, it } from "vitest";
import { swaggerSpec } from "../../src/docs/swagger";
import { CART_ITEM_TYPES } from "../../src/constants/cart";

describe("OpenAPI carritos and carritoItems contract (BE-013)", () => {
  const paths = swaggerSpec.paths as Record<string, Record<string, any>>;
  const schemas = (swaggerSpec.components?.schemas || {}) as Record<string, any>;

  describe("tags definition", () => {
    it("declares tags for Carritos and Ítems de Carrito", () => {
      const tags = (swaggerSpec.tags || []) as Array<{ name: string; description?: string }>;
      const tagNames = tags.map((t) => t.name);

      expect(tagNames).toContain("Carritos");
      expect(tagNames).toContain("Ítems de Carrito");
    });
  });

  describe("component schemas", () => {
    it("defines Carrito with explicit required fields and real nullability", () => {
      const schema = schemas.Carrito;
      expect(schema).toBeDefined();
      expect(schema.type).toBe("object");
      expect(schema.required).toEqual([
        "id",
        "usuario_id",
        "estado",
        "expira_en",
        "createdAt",
        "updatedAt",
      ]);
      expect(schema.properties.id.type).toBe("integer");
      expect(schema.properties.usuario_id.type).toBe("integer");
      expect(schema.properties.estado.enum).toEqual(["activo", "expirado", "pagado"]);
      expect(schema.properties.expira_en.nullable).toBe(true);
      expect(schema.properties.expira_en.format).toBe("date-time");
      expect(schema.properties.createdAt.format).toBe("date-time");
      expect(schema.properties.updatedAt.format).toBe("date-time");
    });

    it("defines CarritoItem with explicit required fields, all supported item types and real price types", () => {
      const schema = schemas.CarritoItem;
      expect(schema).toBeDefined();
      expect(schema.type).toBe("object");
      expect(schema.required).toEqual([
        "id",
        "carrito_id",
        "tipo_item",
        "referencia_id",
        "descripcion",
        "precio",
        "cantidad",
        "promocion_id",
        "createdAt",
        "updatedAt",
      ]);
      expect(schema.properties.id.type).toBe("integer");
      expect(schema.properties.carrito_id.type).toBe("integer");
      expect(schema.properties.tipo_item.enum).toEqual([...CART_ITEM_TYPES]);
      expect(schema.properties.referencia_id.type).toBe("integer");
      expect(schema.properties.descripcion.nullable).toBe(true);
      expect(schema.properties.promocion_id.nullable).toBe(true);
      expect(schema.properties.cantidad.type).toBe("integer");
      expect(schema.properties.cantidad.minimum).toBe(1);
      expect(schema.properties.precio.oneOf).toBeDefined();
      expect(schema.properties.precio.oneOf).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: "string" }),
          expect.objectContaining({ type: "number" }),
        ])
      );
      expect(schema.properties.createdAt.format).toBe("date-time");
      expect(schema.properties.updatedAt.format).toBe("date-time");
    });

    it("defines CreateCarritoItemRequest strictly with tipo_item and referencia_id, preserving all types", () => {
      const schema = schemas.CreateCarritoItemRequest;
      expect(schema).toBeDefined();
      expect(schema.type).toBe("object");
      expect(schema.required).toEqual(["tipo_item", "referencia_id"]);
      expect(schema.additionalProperties).toBe(false);
      expect(schema.properties.tipo_item.enum).toEqual([...CART_ITEM_TYPES]);
      expect(schema.properties.referencia_id.type).toBe("integer");
      expect(schema.properties.referencia_id.minimum).toBe(1);

      // Server generates price, description and quantity automatically; client must not supply them
      expect(schema.properties.precio).toBeUndefined();
      expect(schema.properties.cantidad).toBeUndefined();
      expect(schema.properties.descripcion).toBeUndefined();
    });

    it("defines CarritoItemsData with items reference and numeric total", () => {
      const schema = schemas.CarritoItemsData;
      expect(schema).toBeDefined();
      expect(schema.type).toBe("object");
      expect(schema.required).toEqual(["items", "total"]);
      expect(schema.properties.items.type).toBe("array");
      expect(schema.properties.items.items.$ref).toBe("#/components/schemas/CarritoItem");
      expect(schema.properties.total.type).toBe("number");
    });

    it("defines standard response envelopes matching actual controller JSON responses", () => {
      // CarritoResponse
      expect(schemas.CarritoResponse).toBeDefined();
      expect(schemas.CarritoResponse.required).toEqual(["success", "statusCode", "message", "data"]);
      expect(schemas.CarritoResponse.properties.data.$ref).toBe("#/components/schemas/Carrito");

      // CarritosResponse
      expect(schemas.CarritosResponse).toBeDefined();
      expect(schemas.CarritosResponse.required).toEqual(["success", "statusCode", "message", "data"]);
      expect(schemas.CarritosResponse.properties.data.type).toBe("array");
      expect(schemas.CarritosResponse.properties.data.items.$ref).toBe("#/components/schemas/Carrito");

      // CarritoItemsResponse
      expect(schemas.CarritoItemsResponse).toBeDefined();
      expect(schemas.CarritoItemsResponse.required).toEqual(["success", "statusCode", "message", "data"]);
      expect(schemas.CarritoItemsResponse.properties.data.$ref).toBe("#/components/schemas/CarritoItemsData");

      // CarritoItemResponse
      expect(schemas.CarritoItemResponse).toBeDefined();
      expect(schemas.CarritoItemResponse.required).toEqual(["success", "statusCode", "message", "data"]);
      expect(schemas.CarritoItemResponse.properties.data.$ref).toBe("#/components/schemas/CarritoItem");
    });
  });

  describe("carritos endpoints contract", () => {
    it("GET /api/carritos documents security, list response and error codes", () => {
      const op = paths["/api/carritos"]?.get;
      expect(op).toBeDefined();
      expect(op.security).toEqual([{ bearerAuth: [] }]);
      expect(op.responses["200"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/CarritosResponse"
      );
      expect(op.responses["401"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ErrorResponse"
      );
      expect(op.responses["403"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ErrorResponse"
      );
    });

    it("GET /api/carritos/actual documents active cart query and 404 on expiration or absence", () => {
      const op = paths["/api/carritos/actual"]?.get;
      expect(op).toBeDefined();
      expect(op.security).toEqual([{ bearerAuth: [] }]);
      expect(op.responses["200"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/CarritoResponse"
      );
      expect(op.responses["401"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ErrorResponse"
      );
      expect(op.responses["403"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ErrorResponse"
      );
      expect(op.responses["404"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ErrorResponse"
      );
    });

    it("GET /api/carritos/{id} documents path parameter, response and validation/ownership errors", () => {
      const op = paths["/api/carritos/{id}"]?.get;
      expect(op).toBeDefined();
      expect(op.security).toEqual([{ bearerAuth: [] }]);
      expect(op.parameters).toHaveLength(1);
      expect(op.parameters[0].name).toBe("id");
      expect(op.parameters[0].in).toBe("path");
      expect(op.parameters[0].required).toBe(true);

      expect(op.responses["200"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/CarritoResponse"
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
      expect(op.responses["404"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ErrorResponse"
      );
    });

    it("POST /api/carritos documents 201 creation, 403 non-client rejection and 409 conflict", () => {
      const op = paths["/api/carritos"]?.post;
      expect(op).toBeDefined();
      expect(op.security).toEqual([{ bearerAuth: [] }]);
      expect(op.responses["201"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/CarritoResponse"
      );
      expect(op.responses["401"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ErrorResponse"
      );
      expect(op.responses["403"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ErrorResponse"
      );
      expect(op.responses["409"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ErrorResponse"
      );
    });
  });

  describe("carritoItems endpoints contract", () => {
    it("GET /api/carritos/{carritoId}/items documents path parameter, item list with total and errors", () => {
      const op = paths["/api/carritos/{carritoId}/items"]?.get;
      expect(op).toBeDefined();
      expect(op.security).toEqual([{ bearerAuth: [] }]);
      expect(op.parameters).toHaveLength(1);
      expect(op.parameters[0].name).toBe("carritoId");

      expect(op.responses["200"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/CarritoItemsResponse"
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
      expect(op.responses["404"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ErrorResponse"
      );
    });

    it("GET /api/carritos/{carritoId}/items/{id} documents item query and errors", () => {
      const op = paths["/api/carritos/{carritoId}/items/{id}"]?.get;
      expect(op).toBeDefined();
      expect(op.security).toEqual([{ bearerAuth: [] }]);
      expect(op.parameters).toHaveLength(2);

      expect(op.responses["200"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/CarritoItemResponse"
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
      expect(op.responses["404"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ErrorResponse"
      );
    });

    it("POST /api/carritos/{carritoId}/items documents adding item, 201 response and all business errors", () => {
      const op = paths["/api/carritos/{carritoId}/items"]?.post;
      expect(op).toBeDefined();
      expect(op.security).toEqual([{ bearerAuth: [] }]);
      expect(op.parameters).toHaveLength(1);
      expect(op.requestBody.content["application/json"].schema.$ref).toBe(
        "#/components/schemas/CreateCarritoItemRequest"
      );

      expect(op.responses["201"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/CarritoItemResponse"
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
      expect(op.responses["404"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ErrorResponse"
      );
      expect(op.responses["409"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ErrorResponse"
      );
      expect(op.responses["422"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ErrorResponse"
      );
    });

    it("DELETE /api/carritos/{carritoId}/items/{id} documents 204 without content body and errors", () => {
      const op = paths["/api/carritos/{carritoId}/items/{id}"]?.delete;
      expect(op).toBeDefined();
      expect(op.security).toEqual([{ bearerAuth: [] }]);
      expect(op.parameters).toHaveLength(2);

      // 204 No Content must NOT define content schema
      expect(op.responses["204"]).toBeDefined();
      expect(op.responses["204"].content).toBeUndefined();

      expect(op.responses["400"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ValidationErrorResponse"
      );
      expect(op.responses["401"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ErrorResponse"
      );
      expect(op.responses["403"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ErrorResponse"
      );
      expect(op.responses["404"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ErrorResponse"
      );
      expect(op.responses["409"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ErrorResponse"
      );
    });
  });
});
