import { describe, expect, it } from "vitest";
import {
  assertCartOwnership,
  isPaymentAdministrator,
} from "../../src/utils/paymentOwnership";
import { ROLES } from "../../src/constants/roles";

describe("payment ownership policy", () => {
  it("recognizes only the configured administrative roles", () => {
    expect(isPaymentAdministrator({ id: 1, rol: ROLES.ADMIN })).toBe(true);
    expect(isPaymentAdministrator({ id: 2, rol: ROLES.CLIENTE })).toBe(false);
  });

  it("denies a client access to another user's cart", () => {
    expect(() => assertCartOwnership(
      { usuario_id: 8 },
      { id: 9, rol: ROLES.CLIENTE },
    )).toThrowError("No tiene permisos para acceder a este recurso de pago");
  });
});
