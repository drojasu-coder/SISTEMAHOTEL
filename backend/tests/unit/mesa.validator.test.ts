import { describe, expect, it } from "vitest";
import {
  createMesaSchema,
  updateMesaSchema,
} from "../../src/validators/restaurante/mesa.validator";

describe("mesa validators (BE-008)", () => {
  describe("createMesaSchema", () => {
    it("acepta creación válida con estado explícito", () => {
      const result = createMesaSchema.safeParse({
        sucursal_id: 1,
        zona: "Terraza",
        capacidad: 4,
        estado: "disponible",
      });
      expect(result.success).toBe(true);
    });

    it("acepta creación válida sin campo estado (es opcional)", () => {
      const result = createMesaSchema.safeParse({
        sucursal_id: 1,
        zona: "Interior",
        capacidad: 2,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.estado).toBeUndefined();
      }
    });

    it("rechaza estado: null en creación (no debe ser nullable)", () => {
      const result = createMesaSchema.safeParse({
        sucursal_id: 1,
        zona: "Terraza",
        capacidad: 4,
        estado: null,
      });
      expect(result.success).toBe(false);
    });

    it("rechaza campos adicionales no permitidos (.strict())", () => {
      const result = createMesaSchema.safeParse({
        sucursal_id: 1,
        zona: "Terraza",
        capacidad: 4,
        campoInvalido: "extra",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateMesaSchema", () => {
    it("acepta actualización válida con al menos un campo", () => {
      const result = updateMesaSchema.safeParse({
        capacidad: 6,
      });
      expect(result.success).toBe(true);
    });

    it("rechaza actualización con objeto vacío", () => {
      const result = updateMesaSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rechaza sucursal_id en actualización (.strict())", () => {
      const result = updateMesaSchema.safeParse({
        sucursal_id: 2,
      });
      expect(result.success).toBe(false);
    });

    it("rechaza estado: null en actualización (no debe ser nullable)", () => {
      const result = updateMesaSchema.safeParse({
        estado: null,
      });
      expect(result.success).toBe(false);
    });
  });
});
