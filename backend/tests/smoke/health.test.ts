import {
  describe,
  expect,
  it,
} from "vitest";

import request from "supertest";

import app from "../../src/app";

describe(
  "Smoke - Health",
  () => {
    it(
      "GET /api/health debe responder 200",
      async () => {
        const response =
          await request(app)
            .get("/api/health");

        expect(
          response.status
        ).toBe(200);

        expect(
          response.body
        ).toEqual({
          success: true,
          statusCode: 200,
          message:
            "API de Hotel está funcionando correctamente",
        });
      }
    );
  }
);