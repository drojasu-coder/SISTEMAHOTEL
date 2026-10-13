import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "../../src/validators/auth.validator";

describe("auth validators", () => {
  it("normalizes email and accepts a valid registration", () => {
    const result = registerSchema.safeParse({
      nombre: "Juan Pérez",
      email: " JUAN@EXAMPLE.COM ",
      password: "Password123",
      telefono: "55551234",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("juan@example.com");
  });

  it("rejects unknown fields and weak passwords", () => {
    const result = registerSchema.safeParse({
      nombre: "A",
      email: "not-an-email",
      password: "short",
      inesperado: true,
    });

    expect(result.success).toBe(false);
  });

  it("requires a password for login", () => {
    expect(loginSchema.safeParse({ email: "user@example.com" }).success).toBe(false);
  });
});
