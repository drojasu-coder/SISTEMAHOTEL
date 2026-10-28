import { describe, expect, it } from "vitest";
import { splitInclusivePrice } from "../../src/services/habitaciones/inclusivePrices";

describe("Desglose de precios finales", () => {
  it("extrae IVA e INGUAT del hospedaje sin aumentar el precio", () => {
    expect(splitInclusivePrice(122, 12, 10)).toEqual({ subtotal: 100, iva: 12, inguat: 10, total: 122 });
    expect(splitInclusivePrice(112, 12)).toEqual({ subtotal: 100, iva: 12, inguat: 0, total: 112 });
  });
  it("conserva cada centavo, incluso en importes que no se dividen exactamente", () => {
    for (let cents = 0; cents < 10000; cents++) for (const hotelRate of [0, 10]) {
      const result = splitInclusivePrice(cents / 100, 12, hotelRate);
      expect(Math.round(result.subtotal * 100) + Math.round(result.iva * 100) + Math.round(result.inguat * 100)).toBe(cents);
      expect(result.iva).toBeGreaterThanOrEqual(0);
      if (!hotelRate) expect(result.inguat).toBe(0);
    }
  });
  it.each([NaN, Infinity, -1, Number.MAX_SAFE_INTEGER])("rechaza el importe inválido %s", (value) => {
    expect(() => splitInclusivePrice(value, 12, 10)).toThrow();
  });
});
