import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { createIsolatedTestDatabase, TestDatabase } from "./testDatabase";

describe("isolated PostgreSQL authentication baseline", () => {
  let database: TestDatabase;
  let app: (typeof import("../../src/app"))["default"];
  let email: string;
  let accessToken: string;
  let userId: number;

  beforeAll(async () => {
    database = await createIsolatedTestDatabase();
    ({ default: app } = await import("../../src/app"));
    email = `auth-${Date.now()}@example.com`;
  });

  afterAll(async () => {
    if (userId) {
      await database.Usuario.destroy({ where: { id: userId }, force: true });
    }
    await database.sequelize.close();
  });

  it("registers and logs in a fictitious user against PostgreSQL", async () => {
    const registration = await request(app)
      .post("/api/auth/register")
      .send({
        nombre: "Usuario HTTP",
        email,
        password: "Password123",
      });

    expect(registration.status).toBe(201);
    userId = registration.body.data.id;
    expect(registration.body.data.rol).toBe("cliente");

    const invalidLogin = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "Wrong123" });
    expect(invalidLogin.status).toBe(401);
    expect(invalidLogin.body.code).toBe("INVALID_CREDENTIALS");

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "Password123" });
    expect(login.status).toBe(200);
    accessToken = login.body.data.accessToken;
  });

  it("accepts the valid token and rejects insufficient role", async () => {
    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.data.id).toBe(userId);

    const adminResource = await request(app)
      .get("/api/usuarios")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(adminResource.status).toBe(403);

    const invalid = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid.token.value");
    expect(invalid.status).toBe(401);

    const expired = jwt.sign(
      { id: userId, rol: "cliente" },
      process.env.JWT_SECRET!,
      { expiresIn: -1 },
    );
    const expiredResponse = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${expired}`);
    expect(expiredResponse.status).toBe(401);
  });

  it("rejects the same token after the user is disabled", async () => {
    await database.Usuario.update({ activo: false }, { where: { id: userId } });

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(response.status).toBe(403);
    expect(response.body.code).toBe("USER_INACTIVE");
  });
});
