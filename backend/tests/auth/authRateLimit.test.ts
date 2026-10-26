import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { Op } from "sequelize";

import app from "../../src/app";
import { createTestUser, TEST_PASSWORD } from "../fixtures/users";
import { assertTestDatabase } from "../helpers/db";

const db = require("../../src/models");
const { Usuario } = db;

const loginEmail = "qa034-login@example.test";
const registerEmails = Array.from(
  { length: 6 },
  (_, index) => `qa034-register-${String(index + 1).padStart(2, "0")}@example.test`,
);
const testEmails = [loginEmail, ...registerEmails];

const distribution = (responses: Array<{ status: number }>) =>
  responses.reduce<Record<string, number>>((counts, response) => {
    const status = String(response.status);
    counts[status] = (counts[status] ?? 0) + 1;
    return counts;
  }, {});

describe("Rate limiting de autenticación", () => {
  afterEach(async () => {
    await assertTestDatabase();
    await Usuario.destroy({
      where: {
        email: {
          [Op.in]: testEmails,
        },
      },
    });

    const remainingUsers = await Usuario.count({
      where: {
        email: {
          [Op.in]: testEmails,
        },
      },
    });

    console.log("[QA-AUTH-SEC-CANDIDATE-034 CLEANUP]", {
      remainingUsers,
    });
    expect(remainingUsers).toBe(0);
  });

  it("QA-AUTH-SEC-CANDIDATE-034: limita login y register por IP", async () => {
    expect(await assertTestDatabase()).toBe("hotel_test_db");

    await createTestUser({
      email: loginEmail,
      password: TEST_PASSWORD,
    });

    const loginResponses = [];
    for (let requestNumber = 1; requestNumber <= 11; requestNumber += 1) {
      loginResponses.push(
        await request(app).post("/api/auth/login").send({
          email: loginEmail,
          password: "PasswordIncorrecta034",
        }),
      );
    }

    const registerResponses = [];
    for (const [index, email] of registerEmails.entries()) {
      registerResponses.push(
        await request(app).post("/api/auth/register").send({
          nombre: `Cliente QA 034 ${index + 1}`,
          email,
          password: TEST_PASSWORD,
          telefono: "55550340",
        }),
      );
    }

    const persistedRegisterUsers = await Usuario.findAll({
      attributes: ["email"],
      where: {
        email: {
          [Op.in]: registerEmails,
        },
      },
      order: [["email", "ASC"]],
      raw: true,
    });
    const persistedRegisterEmails = persistedRegisterUsers.map(
      (usuario: { email: string }) => usuario.email,
    );
    const persistedTestUserCount = await Usuario.count({
      where: {
        email: {
          [Op.in]: testEmails,
        },
      },
    });

    const firstTenLogin = loginResponses.slice(0, 10);
    const loginRequestEleven = loginResponses[10];
    const firstFiveRegister = registerResponses.slice(0, 5);
    const registerRequestSix = registerResponses[5];
    const loginRequestElevenReachedAuth =
      loginRequestEleven.status === 401 &&
      loginRequestEleven.body?.code === "INVALID_CREDENTIALS";
    const registerRequestSixReachedFlow =
      registerRequestSix.status === 201 &&
      persistedRegisterEmails.includes(registerEmails[5]);

    console.log(
      "[QA-AUTH-SEC-CANDIDATE-034 EVIDENCE]",
      JSON.stringify(
        {
          database: "hotel_test_db",
          requestIp: "NOT OBSERVABLE",
          bcryptCompareCalls: "NOT OBSERVABLE",
          login: {
            windowMinutes: 15,
            maxRequests: 10,
            requestsExecuted: loginResponses.length,
            firstTenDistribution: distribution(firstTenLogin),
            requestEleven: {
              status: loginRequestEleven.status,
              code: loginRequestEleven.body?.code ?? null,
              reachedAuthFlow: loginRequestElevenReachedAuth,
            },
          },
          register: {
            windowMinutes: 30,
            maxRequests: 5,
            requestsExecuted: registerResponses.length,
            firstFiveDistribution: distribution(firstFiveRegister),
            requestSix: {
              status: registerRequestSix.status,
              code: registerRequestSix.body?.code ?? null,
              reachedRegisterFlow: registerRequestSixReachedFlow,
            },
            persistedEmails: persistedRegisterEmails,
          },
          usersCreated: {
            loginFixture: 1,
            registerPersisted: persistedRegisterEmails.length,
            totalBeforeCleanup: persistedTestUserCount,
          },
        },
        null,
        2,
      ),
    );

    for (const [index, response] of firstTenLogin.entries()) {
      expect.soft(response.status, `login solicitud ${index + 1}`).toBe(401);
      expect.soft(response.body?.code, `login código ${index + 1}`).toBe(
        "INVALID_CREDENTIALS",
      );
    }
    expect.soft(loginRequestEleven.status, "login solicitud 11").toBe(429);
    expect.soft(loginRequestEleven.body?.code, "login código solicitud 11").toBe(
      "TOO_MANY_REQUESTS",
    );

    for (const [index, response] of firstFiveRegister.entries()) {
      expect.soft(response.status, `register solicitud ${index + 1}`).toBe(201);
    }
    expect.soft(registerRequestSix.status, "register solicitud 6").toBe(429);
    expect
      .soft(registerRequestSix.body?.code, "register código solicitud 6")
      .toBe("TOO_MANY_REQUESTS");
    expect
      .soft(
        persistedRegisterEmails,
        "PostgreSQL solo debe contener los cinco registros permitidos",
      )
      .toEqual(registerEmails.slice(0, 5));

    expect
      .soft(
        [...loginResponses, ...registerResponses].some(
          (response) => response.status >= 500,
        ),
        "el rate limiting no debe producir respuestas 5xx",
      )
      .toBe(false);
  });
});
