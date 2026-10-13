export const PAYMENT_METHODS = ["tarjeta", "efectivo", "transferencia"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_TYPES = ["total", "anticipo", "saldo"] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const PAYMENT_CURRENCY = "GTQ" as const;
