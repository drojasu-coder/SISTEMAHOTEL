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

  it("keeps the Stripe webhook outside JWT middleware and requires raw signed input", async () => {
    const response = await request(app)
      .post("/api/pagos/stripe/webhook")
      .set("Content-Type", "application/json")
      .send({ type: "payment_intent.succeeded" });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_WEBHOOK_REQUEST");
  });
});
