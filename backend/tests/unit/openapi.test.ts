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
});
