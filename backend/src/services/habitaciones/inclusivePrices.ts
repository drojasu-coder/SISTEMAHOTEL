import { AppError } from "../../utils/AppError";

/** Desglosa un importe final; nunca aumenta el total contractual publicado.
 * Hospedaje: base + IVA + INGUAT. Otros servicios: base + IVA.
 * El residuo de centavos se asigna al IVA para conservar exactamente el total. */
export function splitInclusivePrice(total: number, ivaRate: number, inguatRate = 0) {
  const cents = Math.round(total * 100);
  if (!Number.isFinite(total) || total < 0 || !Number.isSafeInteger(cents) ||
      !Number.isFinite(ivaRate) || ivaRate < 0 || !Number.isFinite(inguatRate) || inguatRate < 0) {
    throw new AppError(422, "INVALID_INCLUSIVE_PRICE", "El importe final o sus tasas no son válidos");
  }
  const denominator = 100 + ivaRate + inguatRate;
  const base = Math.round(cents * 100 / denominator);
  const inguat = Math.round(cents * inguatRate / denominator);
  const iva = cents - base - inguat;
  return { subtotal: base / 100, iva: iva / 100, inguat: inguat / 100, total: cents / 100 };
}
