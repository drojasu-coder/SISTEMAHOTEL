import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { AppError } from "../../src/utils/AppError";
import { stripeService, toStripeAmount } from "../../src/services/stripe.service";

describe("Stripe amount conversion", () => {
  it("converts GTQ to minor units", () => {
    expect(toStripeAmount(12.5, "GTQ")).toBe(1250);
  });

  it("rejects unsupported currencies", () => {
    expect(() => toStripeAmount(10, "USD")).toThrowError(AppError);
  });

  it("rejects non-positive amounts", () => {
    expect(() => toStripeAmount(0, "GTQ")).toThrowError(AppError);
  });

  it("accepts a locally generated webhook signature without contacting Stripe", () => {
    const payload = Buffer.from(JSON.stringify({ id: "evt_test", type: "payment_intent.succeeded" }));
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload.toString()}`;
    const signature = createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET!)
      .update(signedPayload)
      .digest("hex");

    expect(stripeService.constructEvent(
      payload,
      `t=${timestamp},v1=${signature}`,
    )).toMatchObject({ id: "evt_test", type: "payment_intent.succeeded" });
  });

  it("rejects an invalid webhook signature", () => {
    const payload = Buffer.from(JSON.stringify({ id: "evt_invalid" }));

    expect(() => stripeService.constructEvent(payload, "t=1,v1=invalid"))
      .toThrowError(AppError);
  });
});
