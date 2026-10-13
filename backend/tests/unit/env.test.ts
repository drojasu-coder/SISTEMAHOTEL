import { describe, expect, it } from "vitest";
import { loadEnv } from "../../src/config/env";

const validTestEnvironment = () => ({
  NODE_ENV: "test",
  PORT: "4101",
  EVENT_DEPOSIT_PERCENTAGE: "30",
  TRANSPORT_BLOCK_MINUTES: "120",
  CART_EXPIRATION_MINUTES: "15",
  PARK_TICKET_PRICE_ADULT: "150",
  PARK_TICKET_PRICE_CHILD: "75",
  PARK_TICKET_PRICE_FAMILY: "400",
  JWT_SECRET: "test-only-secret-that-is-at-least-32-characters",
  JWT_EXPIRES_IN: "1h",
  TEST_DATABASE_URL:
    "postgresql://hotel_test_user:hotel_test_password@127.0.0.1:55432/hotel_test_db",
  STRIPE_ENABLED: "false",
});

describe("environment configuration", () => {
  it("rejects missing required values", () => {
    const values = validTestEnvironment();
    delete values.JWT_SECRET;

    expect(() => loadEnv(values)).toThrow(/JWT_SECRET/);
  });

  it("rejects invalid URLs and ports", () => {
    const invalidUrl = {
      ...validTestEnvironment(),
      TEST_DATABASE_URL: "not-a-database-url",
    };
    expect(() => loadEnv(invalidUrl)).toThrow(/TEST_DATABASE_URL/);

    expect(() => loadEnv({ ...validTestEnvironment(), PORT: "70000" })).toThrow(/PORT/);
  });

  it("rejects invalid boolean values", () => {
    expect(() => loadEnv({ ...validTestEnvironment(), STRIPE_ENABLED: "maybe" })).toThrow(
      /STRIPE_ENABLED/,
    );
  });

  it("rejects unknown environments", () => {
    expect(() => loadEnv({ ...validTestEnvironment(), NODE_ENV: "staging" })).toThrow(
      /NODE_ENV/,
    );
  });

  it("enforces the isolated test database", () => {
    expect(() =>
      loadEnv({
        ...validTestEnvironment(),
        TEST_DATABASE_URL:
          "postgresql://user:password@127.0.0.1:5432/hotel_db",
      }),
    ).toThrow(/localhost:55432\/hotel_test_db/);
  });

  it("requires both Stripe credentials when Stripe is enabled", () => {
    expect(() =>
      loadEnv({ ...validTestEnvironment(), STRIPE_ENABLED: "true" }),
    ).toThrow(/STRIPE_SECRET_KEY/);
  });

  it("supports a production environment without optional Stripe integration", () => {
    const values = {
      ...validTestEnvironment(),
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://user:password@example.test:5432/hotel_db",
    };
    delete values.TEST_DATABASE_URL;

    expect(loadEnv(values)).toMatchObject({
      NODE_ENV: "production",
      STRIPE_ENABLED: false,
    });
  });
});
