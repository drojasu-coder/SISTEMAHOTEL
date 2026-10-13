import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";

describe("HTTP baseline", () => {
  it("exposes the health check without authentication", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      statusCode: 200,
      message: "API de Hotel está funcionando correctamente",
    });
  });

  it("returns a fresh request ID and preserves it in the response", async () => {
    const [first, second] = await Promise.all([
      request(app).get("/api/health"),
      request(app).get("/api/health"),
    ]);

    expect(first.headers["x-request-id"]).toEqual(expect.any(String));
    expect(second.headers["x-request-id"]).toEqual(expect.any(String));
    expect(first.headers["x-request-id"]).not.toBe(second.headers["x-request-id"]);
  });

  it("rejects invalid registration input before reaching the database", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ email: "invalid", password: "weak" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.details).toEqual(expect.any(Array));
  });

  it("requires a bearer token for the current-user endpoint", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("AUTH_TOKEN_REQUIRED");
  });

  it("preserves authentication on the configuration endpoints", async () => {
    const read = await request(app).get("/api/configuraciones/iva");
    const update = await request(app)
      .patch("/api/configuraciones/iva")
      .send({ porcentaje_iva: 12 });

    expect(read.status).toBe(401);
    expect(read.body.code).toBe("AUTH_TOKEN_REQUIRED");
    expect(update.status).toBe(401);
    expect(update.body.code).toBe("AUTH_TOKEN_REQUIRED");
  });

  it("keeps the Stripe webhook outside JWT middleware and requires raw signed input", async () => {
    const response = await request(app)
      .post("/api/pagos/stripe/webhook")
      .set("Content-Type", "application/json")
      .send({ type: "payment_intent.succeeded" });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_WEBHOOK_REQUEST");
  });

  it("allows configured CORS origins and handles preflight", async () => {
    const response = await request(app)
      .options("/api/health")
      .set("Origin", "http://localhost:3000")
      .set("Access-Control-Request-Method", "GET")
      .set("Access-Control-Request-Headers", "Authorization, Content-Type");

    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
    expect(response.headers["access-control-allow-headers"]).toContain("Authorization");
  });

  it("rejects unconfigured browser origins", async () => {
    const response = await request(app)
      .get("/api/health")
      .set("Origin", "https://malicious.example");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("CORS_ORIGIN_DENIED");
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("sets security headers without exposing Express", async () => {
    const response = await request(app).get("/api/health");

    expect(response.headers["x-powered-by"]).toBeUndefined();
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["referrer-policy"]).toBe("no-referrer");
  });

  it("rejects malformed JSON with the existing error contract", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email":');

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_JSON");
  });

  it("rejects request bodies above the configured limit", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send(`{"email":"${"a".repeat(1024 * 1024)}"}`);

    expect(response.status).toBe(413);
    expect(response.body.code).toBe("REQUEST_ENTITY_TOO_LARGE");
  });

  it("rate limits repeated authentication requests", async () => {
    const responses = await Promise.all(
      Array.from({ length: 11 }, () =>
        request(app)
          .post("/api/auth/login")
          .send({ email: "invalid", password: "invalid" }),
      ),
    );

    const limited = responses.find((response) => response.status === 429);
    expect(limited?.body).toMatchObject({
      success: false,
      statusCode: 429,
      code: "RATE_LIMIT_EXCEEDED",
    });
    expect(limited?.headers["ratelimit"]).toBeDefined();
  });
});
