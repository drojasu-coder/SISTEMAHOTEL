import { describe, expect, it } from "vitest";
import { swaggerSpec } from "../../src/docs/swagger";

describe("generated OpenAPI contract", () => {
  it("contains the preserved sucursales operations without duplicates", () => {
    const paths = swaggerSpec.paths as Record<string, Record<string, unknown>>;
    const collection = paths["/api/sucursales"];
    const resource = paths["/api/sucursales/{id}"];

    expect(collection).toBeDefined();
    expect(resource).toBeDefined();
    expect(Object.keys(collection).sort()).toEqual(["get", "post"]);
    expect(Object.keys(resource).sort()).toEqual(["delete", "get", "patch"]);
    expect(resource.get).toBeDefined();
    expect(resource.patch).toBeDefined();
    expect(resource.delete).toBeDefined();
  });

  it("contains the configuration operations and required security metadata", () => {
    const paths = swaggerSpec.paths as Record<string, Record<string, any>>;
    const configuration = paths["/api/configuraciones/iva"];

    expect(configuration).toBeDefined();
    expect(Object.keys(configuration).sort()).toEqual(["get", "patch"]);
    expect(configuration.get.security).toEqual([{ bearerAuth: [] }]);
    expect(configuration.patch.security).toEqual([{ bearerAuth: [] }]);
  });

  it("contains complete mesas schemas and documented contract responses (BE-009)", () => {
    const paths = swaggerSpec.paths as Record<string, Record<string, any>>;
    const schemas = (swaggerSpec.components?.schemas || {}) as Record<string, any>;

    // Component schemas
    expect(schemas.Mesa).toBeDefined();
    expect(schemas.CreateMesaRequest).toBeDefined();
    expect(schemas.UpdateMesaRequest).toBeDefined();
    expect(schemas.MesaResponse).toBeDefined();
    expect(schemas.MesasResponse).toBeDefined();

    // CreateMesaRequest has sucursal_id, zona, capacidad required and estado optional
    expect(schemas.CreateMesaRequest.required).toEqual(["sucursal_id", "zona", "capacidad"]);
    expect(schemas.CreateMesaRequest.properties.estado).toBeDefined();

    // UpdateMesaRequest has minProperties: 1, excludes sucursal_id, allows zona, capacidad, estado
    expect(schemas.UpdateMesaRequest.minProperties).toBe(1);
    expect(schemas.UpdateMesaRequest.properties.sucursal_id).toBeUndefined();
    expect(schemas.UpdateMesaRequest.properties.zona).toBeDefined();
    expect(schemas.UpdateMesaRequest.properties.capacidad).toBeDefined();
    expect(schemas.UpdateMesaRequest.properties.estado).toBeDefined();

    // Endpoints
    const collection = paths["/api/mesas"];
    const resource = paths["/api/mesas/{id}"];

    expect(collection.get.responses["200"].content["application/json"].schema).toBeDefined();
    expect(collection.post.requestBody.content["application/json"].schema).toBeDefined();
    expect(collection.post.responses["201"].content["application/json"].schema).toBeDefined();
    expect(collection.post.responses["400"]).toBeDefined();
    expect(collection.post.responses["401"]).toBeDefined();
    expect(collection.post.responses["403"]).toBeDefined();
    expect(collection.post.responses["404"]).toBeDefined();

    expect(resource.get.responses["200"].content["application/json"].schema).toBeDefined();
    expect(resource.get.responses["400"]).toBeDefined();
    expect(resource.get.responses["404"]).toBeDefined();

    expect(resource.patch.requestBody.content["application/json"].schema).toBeDefined();
    expect(resource.patch.responses["200"].content["application/json"].schema).toBeDefined();
    expect(resource.patch.responses["400"]).toBeDefined();
    expect(resource.patch.responses["401"]).toBeDefined();
    expect(resource.patch.responses["403"]).toBeDefined();
    expect(resource.patch.responses["404"]).toBeDefined();
  });

  it("keeps the generated specification operation inventory stable", () => {
    const paths = swaggerSpec.paths as Record<string, Record<string, unknown>>;
    const operations = Object.values(paths).reduce(
      (count, pathItem) =>
        count +
        Object.keys(pathItem).filter((method) =>
          ["get", "post", "put", "patch", "delete", "options", "head"].includes(method),
        ).length,
      0,
    );

    expect(Object.keys(paths)).toHaveLength(102);
    expect(operations).toBe(193);
  });
  it("contains complete reservas and disponibilidad schemas and contract responses (BE-011, BE-012)", () => {
    const paths = swaggerSpec.paths as Record<string, Record<string, any>>;
    const schemas = (swaggerSpec.components?.schemas || {}) as Record<string, any>;

    // Component schemas
    expect(schemas.ReservaHabitacionUsuario).toBeDefined();
    expect(schemas.ReservaHabitacionTipo).toBeDefined();
    expect(schemas.ReservaHabitacionSucursal).toBeDefined();
    expect(schemas.ReservaHabitacionHabitacion).toBeDefined();
    expect(schemas.ReservaHabitacion).toBeDefined();
    expect(schemas.CreateReservaHabitacionRequest).toBeDefined();
    expect(schemas.HabitacionDisponible).toBeDefined();
    expect(schemas.ReservaHabitacionResponse).toBeDefined();
    expect(schemas.ReservaHabitacionCreatedResponse).toBeDefined();
    expect(schemas.ReservasHabitacionResponse).toBeDefined();
    expect(schemas.DisponibilidadHabitacionesResponse).toBeDefined();

    // CreateReservaHabitacionRequest: client sends 4 fields, admin sends optional usuario_id
    expect(schemas.CreateReservaHabitacionRequest.required).toEqual([
      "habitacion_id",
      "fecha_entrada",
      "fecha_salida",
      "numero_huespedes",
    ]);
    expect(schemas.CreateReservaHabitacionRequest.properties.usuario_id).toBeDefined();

    // GET /api/habitaciones/disponibles (BE-012)
    const disponibles = paths["/api/habitaciones/disponibles"]?.get;
    expect(disponibles).toBeDefined();
    expect(disponibles.security).toEqual([{ bearerAuth: [] }]);
    expect(disponibles.parameters).toHaveLength(5);
    expect(disponibles.responses["200"].content["application/json"].schema.$ref).toBe(
      "#/components/schemas/DisponibilidadHabitacionesResponse"
    );
    expect(disponibles.responses["400"]).toBeDefined();
    expect(disponibles.responses["401"]).toBeDefined();
    expect(disponibles.responses["404"]).toBeDefined();
    expect(disponibles.responses["422"]).toBeDefined();

    // Reservas endpoints (BE-011)
    const reservasCollection = paths["/api/reservas-habitacion"];
    const reservasResource = paths["/api/reservas-habitacion/{id}"];

    // GET /api/reservas-habitacion
    expect(reservasCollection.get.responses["200"].content["application/json"].schema.$ref).toBe(
      "#/components/schemas/ReservasHabitacionResponse"
    );
    expect(reservasCollection.get.responses["401"]).toBeDefined();

    // POST /api/reservas-habitacion
    expect(reservasCollection.post.requestBody.content["application/json"].schema.$ref).toBe(
      "#/components/schemas/CreateReservaHabitacionRequest"
    );
    expect(reservasCollection.post.responses["201"].content["application/json"].schema.$ref).toBe(
      "#/components/schemas/ReservaHabitacionCreatedResponse"
    );
    expect(reservasCollection.post.responses["400"]).toBeDefined();
    expect(reservasCollection.post.responses["401"]).toBeDefined();
    expect(reservasCollection.post.responses["403"]).toBeDefined();
    expect(reservasCollection.post.responses["404"]).toBeDefined();
    expect(reservasCollection.post.responses["409"]).toBeDefined();
    expect(reservasCollection.post.responses["422"]).toBeDefined();

    // GET /api/reservas-habitacion/{id}
    expect(reservasResource.get.responses["200"].content["application/json"].schema.$ref).toBe(
      "#/components/schemas/ReservaHabitacionResponse"
    );
    expect(reservasResource.get.responses["400"]).toBeDefined();
    expect(reservasResource.get.responses["401"]).toBeDefined();
    expect(reservasResource.get.responses["403"]).toBeDefined();
    expect(reservasResource.get.responses["404"]).toBeDefined();
  });
  it("contains complete carritos and carritoItems schemas and contract responses (BE-013)", () => {
    const paths = swaggerSpec.paths as Record<string, Record<string, any>>;
    const schemas = (swaggerSpec.components?.schemas || {}) as Record<string, any>;

    // Component schemas
    expect(schemas.Carrito).toBeDefined();
    expect(schemas.CarritoItem).toBeDefined();
    expect(schemas.CreateCarritoItemRequest).toBeDefined();
    expect(schemas.CarritoItemsData).toBeDefined();
    expect(schemas.CarritoResponse).toBeDefined();
    expect(schemas.CarritosResponse).toBeDefined();
    expect(schemas.CarritoItemsResponse).toBeDefined();
    expect(schemas.CarritoItemResponse).toBeDefined();

    expect(schemas.Carrito.required).toEqual([
      "id",
      "usuario_id",
      "estado",
      "expira_en",
      "createdAt",
      "updatedAt",
    ]);
    expect(schemas.CarritoItem.required).toEqual([
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
    expect(schemas.CreateCarritoItemRequest.required).toEqual(["tipo_item", "referencia_id"]);
    expect(schemas.CreateCarritoItemRequest.additionalProperties).toBe(false);
    expect(schemas.CarritoItemsData.required).toEqual(["items", "total"]);

    // Endpoints
    const carritosCollection = paths["/api/carritos"];
    const carritoActual = paths["/api/carritos/actual"];
    const carritoResource = paths["/api/carritos/{id}"];
    const itemsCollection = paths["/api/carritos/{carritoId}/items"];
    const itemResource = paths["/api/carritos/{carritoId}/items/{id}"];

    // GET /api/carritos
    expect(carritosCollection.get.responses["200"].content["application/json"].schema.$ref).toBe(
      "#/components/schemas/CarritosResponse"
    );
    // POST /api/carritos
    expect(carritosCollection.post.responses["201"].content["application/json"].schema.$ref).toBe(
      "#/components/schemas/CarritoResponse"
    );
    expect(carritosCollection.post.responses["409"]).toBeDefined();

    // GET /api/carritos/actual
    expect(carritoActual.get.responses["200"].content["application/json"].schema.$ref).toBe(
      "#/components/schemas/CarritoResponse"
    );
    expect(carritoActual.get.responses["404"]).toBeDefined();

    // GET /api/carritos/{id}
    expect(carritoResource.get.responses["200"].content["application/json"].schema.$ref).toBe(
      "#/components/schemas/CarritoResponse"
    );
    expect(carritoResource.get.responses["400"]).toBeDefined();
    expect(carritoResource.get.responses["403"]).toBeDefined();
    expect(carritoResource.get.responses["404"]).toBeDefined();

    // GET /api/carritos/{carritoId}/items
    expect(itemsCollection.get.responses["200"].content["application/json"].schema.$ref).toBe(
      "#/components/schemas/CarritoItemsResponse"
    );

    // POST /api/carritos/{carritoId}/items
    expect(itemsCollection.post.requestBody.content["application/json"].schema.$ref).toBe(
      "#/components/schemas/CreateCarritoItemRequest"
    );
    expect(itemsCollection.post.responses["201"].content["application/json"].schema.$ref).toBe(
      "#/components/schemas/CarritoItemResponse"
    );
    expect(itemsCollection.post.responses["400"]).toBeDefined();
    expect(itemsCollection.post.responses["409"]).toBeDefined();
    expect(itemsCollection.post.responses["422"]).toBeDefined();

    // GET /api/carritos/{carritoId}/items/{id}
    expect(itemResource.get.responses["200"].content["application/json"].schema.$ref).toBe(
      "#/components/schemas/CarritoItemResponse"
    );

    // DELETE /api/carritos/{carritoId}/items/{id}
    expect(itemResource.delete.responses["204"]).toBeDefined();
    expect(itemResource.delete.responses["204"].content).toBeUndefined();
    expect(itemResource.delete.responses["400"]).toBeDefined();
    expect(itemResource.delete.responses["403"]).toBeDefined();
    expect(itemResource.delete.responses["404"]).toBeDefined();
    expect(itemResource.delete.responses["409"]).toBeDefined();
  });
  it("contains complete pagos schemas and contract responses (BE-014)", () => {
    const paths = swaggerSpec.paths as Record<string, Record<string, any>>;
    const schemas = (swaggerSpec.components?.schemas || {}) as Record<string, any>;

    // Component schemas
    expect(schemas.Pago).toBeDefined();
    expect(schemas.CreatePagoRequest).toBeDefined();
    expect(schemas.CreatePagoResponse).toBeDefined();
    expect(schemas.ResumenPagoData).toBeDefined();
    expect(schemas.ResumenPagoResponse).toBeDefined();
    expect(schemas.IntentoActivoData).toBeDefined();
    expect(schemas.IntentoActivoPagoResponse).toBeDefined();
    expect(schemas.PagoResponse).toBeDefined();
    expect(schemas.PagosResponse).toBeDefined();

    // Required fields & contracts
    expect(schemas.CreatePagoRequest.required).toEqual(["monto", "metodo", "moneda"]);
    expect(schemas.IntentoActivoData.properties.payment_intent_id.nullable).toBe(true);

    // Endpoints
    const pagosCollection = paths["/api/pagos"];
    const pagosResumen = paths["/api/pagos/resumen"];
    const pagosIntentoActivo = paths["/api/pagos/intento-activo"];
    const pagoResource = paths["/api/pagos/{id}"];

    // GET /api/pagos
    expect(pagosCollection.get.responses["200"].content["application/json"].schema["$ref"]).toBe(
      "#/components/schemas/PagosResponse"
    );

    // POST /api/pagos
    expect(pagosCollection.post.requestBody.content["application/json"].schema["$ref"]).toBe(
      "#/components/schemas/CreatePagoRequest"
    );
    expect(pagosCollection.post.responses["201"].content["application/json"].schema["$ref"]).toBe(
      "#/components/schemas/CreatePagoResponse"
    );
    expect(pagosCollection.post.responses["400"]).toBeDefined();
    expect(pagosCollection.post.responses["401"]).toBeDefined();
    expect(pagosCollection.post.responses["409"]).toBeDefined();
    expect(pagosCollection.post.responses["422"]).toBeDefined();

    // GET /api/pagos/resumen
    expect(pagosResumen.get.responses["200"].content["application/json"].schema["$ref"]).toBe(
      "#/components/schemas/ResumenPagoResponse"
    );
    expect(pagosResumen.get.responses["400"]).toBeDefined();
    expect(pagosResumen.get.responses["401"]).toBeDefined();
    expect(pagosResumen.get.responses["404"]).toBeDefined();

    // GET /api/pagos/intento-activo
    expect(pagosIntentoActivo.get.responses["200"].content["application/json"].schema["$ref"]).toBe(
      "#/components/schemas/IntentoActivoPagoResponse"
    );
    expect(pagosIntentoActivo.get.responses["400"]).toBeDefined();
    expect(pagosIntentoActivo.get.responses["401"]).toBeDefined();

    // GET /api/pagos/{id}
    expect(pagoResource.get.responses["200"].content["application/json"].schema["$ref"]).toBe(
      "#/components/schemas/PagoResponse"
    );
    expect(pagoResource.get.responses["400"]).toBeDefined();
    expect(pagoResource.get.responses["401"]).toBeDefined();
    expect(pagoResource.get.responses["403"]).toBeDefined();
    expect(pagoResource.get.responses["404"]).toBeDefined();
  });

  it("contains complete sucursales schemas and contract responses (BE-006)", () => {
    const paths = swaggerSpec.paths as Record<string, Record<string, any>>;
    const schemas = (swaggerSpec.components?.schemas || {}) as Record<string, any>;

    // Component schemas
    expect(schemas.Sucursal).toBeDefined();
    expect(schemas.CreateSucursalRequest).toBeDefined();
    expect(schemas.UpdateSucursalRequest).toBeDefined();
    expect(schemas.SucursalResponse).toBeDefined();
    expect(schemas.SucursalesResponse).toBeDefined();

    // Required fields & nullability
    expect(schemas.Sucursal.required).toEqual([
      "id",
      "nombre",
      "activa",
      "createdAt",
      "updatedAt",
    ]);
    expect(schemas.Sucursal.properties.direccion.nullable).toBe(true);
    expect(schemas.Sucursal.properties.ciudad.nullable).toBe(true);
    expect(schemas.Sucursal.properties.telefono.nullable).toBe(true);
    expect(schemas.CreateSucursalRequest.required).toEqual(["nombre"]);
    expect(schemas.UpdateSucursalRequest.minProperties).toBe(1);

    // Endpoints
    const sucursalesCollection = paths["/api/sucursales"];
    const sucursalResource = paths["/api/sucursales/{id}"];

    // GET /api/sucursales
    expect(sucursalesCollection.get.responses["200"].content["application/json"].schema["$ref"]).toBe(
      "#/components/schemas/SucursalesResponse"
    );

    // POST /api/sucursales
    expect(sucursalesCollection.post.requestBody.content["application/json"].schema["$ref"]).toBe(
      "#/components/schemas/CreateSucursalRequest"
    );
    expect(sucursalesCollection.post.responses["201"].content["application/json"].schema["$ref"]).toBe(
      "#/components/schemas/SucursalResponse"
    );
    expect(sucursalesCollection.post.responses["400"]).toBeDefined();
    expect(sucursalesCollection.post.responses["401"]).toBeDefined();
    expect(sucursalesCollection.post.responses["403"]).toBeDefined();

    // GET /api/sucursales/{id}
    expect(sucursalResource.get.responses["200"].content["application/json"].schema["$ref"]).toBe(
      "#/components/schemas/SucursalResponse"
    );
    expect(sucursalResource.get.responses["400"]).toBeDefined();
    expect(sucursalResource.get.responses["404"]).toBeDefined();

    // PATCH /api/sucursales/{id}
    expect(sucursalResource.patch.requestBody.content["application/json"].schema["$ref"]).toBe(
      "#/components/schemas/UpdateSucursalRequest"
    );
    expect(sucursalResource.patch.responses["200"].content["application/json"].schema["$ref"]).toBe(
      "#/components/schemas/SucursalResponse"
    );
    expect(sucursalResource.patch.responses["400"]).toBeDefined();
    expect(sucursalResource.patch.responses["404"]).toBeDefined();

    // DELETE /api/sucursales/{id}
    expect(sucursalResource.delete.responses["204"]).toBeDefined();
    expect(sucursalResource.delete.responses["404"]).toBeDefined();
    expect(sucursalResource.delete.responses["409"]).toBeDefined();
  });

  it("contains complete parqueos schemas and contract responses (BE-010)", () => {
    const paths = swaggerSpec.paths as Record<string, Record<string, any>>;
    const schemas = (swaggerSpec.components?.schemas || {}) as Record<string, any>;

    // Component schemas
    expect(schemas.Parqueo).toBeDefined();
    expect(schemas.CreateParqueoRequest).toBeDefined();
    expect(schemas.UpdateParqueoRequest).toBeDefined();
    expect(schemas.ParqueoResponse).toBeDefined();
    expect(schemas.ParqueosResponse).toBeDefined();
    expect(schemas.ParqueoDeleteResponse).toBeDefined();

    // Required fields & contracts
    expect(schemas.Parqueo.required).toEqual([
      "id",
      "sucursal_id",
      "numero",
      "estado",
      "createdAt",
      "updatedAt",
    ]);
    expect(schemas.CreateParqueoRequest.required).toEqual(["sucursal_id", "numero"]);
    expect(schemas.CreateParqueoRequest.additionalProperties).toBe(false);
    expect(schemas.UpdateParqueoRequest.minProperties).toBe(1);

    // Endpoints
    const parqueosCollection = paths["/api/parqueos"];
    const parqueoResource = paths["/api/parqueos/{id}"];

    // GET /api/parqueos
    expect(parqueosCollection.get.responses["200"].content["application/json"].schema["$ref"]).toBe(
      "#/components/schemas/ParqueosResponse"
    );
    expect(parqueosCollection.get.responses["401"]).toBeDefined();

    // POST /api/parqueos
    expect(parqueosCollection.post.requestBody.content["application/json"].schema["$ref"]).toBe(
      "#/components/schemas/CreateParqueoRequest"
    );
    expect(parqueosCollection.post.responses["201"].content["application/json"].schema["$ref"]).toBe(
      "#/components/schemas/ParqueoResponse"
    );
    expect(parqueosCollection.post.responses["400"]).toBeDefined();
    expect(parqueosCollection.post.responses["401"]).toBeDefined();
    expect(parqueosCollection.post.responses["403"]).toBeDefined();
    expect(parqueosCollection.post.responses["404"]).toBeDefined();
    expect(parqueosCollection.post.responses["409"]).toBeDefined();

    // GET /api/parqueos/{id}
    expect(parqueoResource.get.responses["200"].content["application/json"].schema["$ref"]).toBe(
      "#/components/schemas/ParqueoResponse"
    );
    expect(parqueoResource.get.responses["400"]).toBeDefined();
    expect(parqueoResource.get.responses["401"]).toBeDefined();
    expect(parqueoResource.get.responses["404"]).toBeDefined();

    // PATCH /api/parqueos/{id}
    expect(parqueoResource.patch.requestBody.content["application/json"].schema["$ref"]).toBe(
      "#/components/schemas/UpdateParqueoRequest"
    );
    expect(parqueoResource.patch.responses["200"].content["application/json"].schema["$ref"]).toBe(
      "#/components/schemas/ParqueoResponse"
    );
    expect(parqueoResource.patch.responses["400"]).toBeDefined();
    expect(parqueoResource.patch.responses["401"]).toBeDefined();
    expect(parqueoResource.patch.responses["403"]).toBeDefined();
    expect(parqueoResource.patch.responses["404"]).toBeDefined();
    expect(parqueoResource.patch.responses["409"]).toBeDefined();

    // DELETE /api/parqueos/{id}
    expect(parqueoResource.delete.responses["200"].content["application/json"].schema["$ref"]).toBe(
      "#/components/schemas/ParqueoDeleteResponse"
    );
    expect(parqueoResource.delete.responses["400"]).toBeDefined();
    expect(parqueoResource.delete.responses["401"]).toBeDefined();
    expect(parqueoResource.delete.responses["403"]).toBeDefined();
    expect(parqueoResource.delete.responses["404"]).toBeDefined();
    expect(parqueoResource.delete.responses["409"]).toBeDefined();
  });
  it("contains complete multimedia branding schemas and public endpoint contract", () => {
    const paths = swaggerSpec.paths as Record<string, Record<string, any>>;
    const schemas = (swaggerSpec.components?.schemas || {}) as Record<string, any>;

    expect(schemas.BrandingMedia).toBeDefined();
    expect(schemas.BrandingResponse).toBeDefined();

    expect(schemas.BrandingMedia.required).toEqual([
      "logoHorizontalColor",
      "logoHorizontalBlanco",
      "isotipoColor",
      "expiresAt",
    ]);

    const brandingEndpoint = paths["/api/media/branding"];
    expect(brandingEndpoint).toBeDefined();
    expect(brandingEndpoint.get).toBeDefined();
    expect(brandingEndpoint.get.security).toEqual([]);
    expect(brandingEndpoint.get.responses["200"].content["application/json"].schema["$ref"]).toBe(
      "#/components/schemas/BrandingResponse"
    );
  });
  it("contains complete citas-spa and mis-reservas OpenAPI contracts", () => {
    const paths = swaggerSpec.paths as Record<string, Record<string, any>>;
    const schemas = (swaggerSpec.components?.schemas || {}) as Record<string, any>;

    expect(schemas.CitaBienestar).toBeDefined();
    expect(schemas.CreateCitaBienestarRequest).toBeDefined();
    expect(schemas.UpdateCitaBienestarEstadoRequest).toBeDefined();

    expect(paths["/api/citas-spa"]).toBeDefined();
    expect(paths["/api/citas-spa"].post).toBeDefined();
    expect(paths["/api/citas-spa"].get).toBeDefined();
    expect(paths["/api/citas-spa/mis-reservas"]).toBeDefined();
    expect(paths["/api/citas-spa/mis-reservas"].get).toBeDefined();
    expect(paths["/api/citas-spa/mis-reservas/{id}"]).toBeDefined();
    expect(paths["/api/citas-spa/mis-reservas/{id}"].get).toBeDefined();
  });
});