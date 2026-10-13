import { afterEach, describe, expect, it, vi } from "vitest";
import { logger, normalizeRequestPath, sanitizeLogValue } from "../../src/utils/logger";

describe("structured logger", () => {
  afterEach(() => vi.restoreAllMocks());

  it("redacts credentials and sensitive payment metadata", () => {
    const output = sanitizeLogValue({
      authorization: "Bearer token",
      password: "secret",
      stripeSignature: "signature",
      eventId: "evt_test",
    });

    expect(output).toEqual({
      authorization: "[REDACTED]",
      password: "[REDACTED]",
      stripeSignature: "[REDACTED]",
      eventId: "evt_test",
    });
  });

  it("emits a structured safe log entry", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    logger.info("test.event", { requestId: "request-1", token: "secret" });

    expect(spy).toHaveBeenCalledOnce();
    const message = String(spy.mock.calls[0][0]);
    expect(message).toContain("test.event");
    expect(message).toContain("[REDACTED]");
    expect(message).not.toContain("secret");
  });

  it("normalizes numeric and UUID path segments", () => {
    expect(normalizeRequestPath("/api/users/42/orders/550e8400-e29b-41d4-a716-446655440000?token=x"))
      .toBe("/api/users/:id/orders/:id");
  });
});
