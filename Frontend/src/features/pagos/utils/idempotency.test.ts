import { describe, it, expect, beforeEach } from 'vitest';
import {
  getOrCreateCheckoutIdempotencyKey,
  clearCheckoutIdempotencyKey,
  generateSecureIdempotencyKey,
  getStoredCheckoutAttempt,
  recordCheckoutPagoId,
  clearMatchingStoredAttempt,
} from './idempotency';

describe('checkout idempotency helpers', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('genera una clave única con prefijo de usuario y carrito', () => {
    const key = generateSecureIdempotencyKey(5, 12);
    expect(key).toMatch(/^chk-u5-c12-[0-9a-f-]{36}$|^chk-u5-c12-[a-z0-9-]+$/);
  });

  it('conserva la misma clave de idempotencia al consultar con el mismo monto', () => {
    const res1 = getOrCreateCheckoutIdempotencyKey(5, 12, 1800);
    const res2 = getOrCreateCheckoutIdempotencyKey(5, 12, 1800);

    expect(res1.key).toBe(res2.key);
    expect(res2.esReutilizada).toBe(true);
    expect(res2.montoDifiere).toBe(false);
  });

  it('conserva la clave pero detecta montoDifiere si el monto del carrito cambia durante un intento', () => {
    const res1 = getOrCreateCheckoutIdempotencyKey(5, 12, 1800);
    recordCheckoutPagoId(5, 12, 99);

    const res2 = getOrCreateCheckoutIdempotencyKey(5, 12, 2200);

    // No debe borrar la clave silenciosamente; conserva la clave del intento previo y alerta la discrepancia
    expect(res2.key).toBe(res1.key);
    expect(res2.esReutilizada).toBe(true);
    expect(res2.montoDifiere).toBe(true);
    expect(res2.montoPrevio).toBe(1800);
    expect(res2.pagoId).toBe(99);
  });

  it('permite asociar el ID de pago local al intento en curso', () => {
    getOrCreateCheckoutIdempotencyKey(5, 12, 1800);
    recordCheckoutPagoId(5, 12, 456);

    const stored = getStoredCheckoutAttempt(5, 12);
    expect(stored?.pagoId).toBe(456);
  });

  it('genera claves independientes para distintos carritos o usuarios', () => {
    const resUser1 = getOrCreateCheckoutIdempotencyKey(1, 10, 500);
    const resUser2 = getOrCreateCheckoutIdempotencyKey(2, 10, 500);
    const resOtroCarrito = getOrCreateCheckoutIdempotencyKey(1, 11, 500);

    expect(resUser1.key).not.toBe(resUser2.key);
    expect(resUser1.key).not.toBe(resOtroCarrito.key);
  });

  it('limpia la clave al invocar clearCheckoutIdempotencyKey', () => {
    const res1 = getOrCreateCheckoutIdempotencyKey(5, 12, 1800);
    clearCheckoutIdempotencyKey(5, 12);
    const res2 = getOrCreateCheckoutIdempotencyKey(5, 12, 1800);

    expect(res2.key).not.toBe(res1.key);
  });
});

  describe('clearMatchingStoredAttempt', () => {
    it('no ejecuta nada ni falla si carritoId es null o no válido', () => {
      const res = clearMatchingStoredAttempt(5, null, 123);
      expect(res).toBe(false);

      const resUndefined = clearMatchingStoredAttempt(5, undefined, 123);
      expect(resUndefined).toBe(false);
    });

    it('no borra la clave si el intento almacenado pertenece a un pagoId posterior o diferente', () => {
      getOrCreateCheckoutIdempotencyKey(5, 12, 1800);
      recordCheckoutPagoId(5, 12, 200); // Intento posterior 200

      // Visitar el resultado de un pago anterior (pagoId = 150)
      const cleaned = clearMatchingStoredAttempt(5, 12, 150, 'chk-otra-clave');
      expect(cleaned).toBe(false);

      // El intento posterior (200) sigue intacto
      const stored = getStoredCheckoutAttempt(5, 12);
      expect(stored).not.toBeNull();
      expect(stored?.pagoId).toBe(200);
    });

    it('borra la clave si el intento almacenado coincide con el pagoId mostrado', () => {
      getOrCreateCheckoutIdempotencyKey(5, 12, 1800);
      recordCheckoutPagoId(5, 12, 200);

      const cleaned = clearMatchingStoredAttempt(5, 12, 200);
      expect(cleaned).toBe(true);

      const stored = getStoredCheckoutAttempt(5, 12);
      expect(stored).toBeNull();
    });

    it('borra la clave si coincide por idempotencyKey aunque pagoId no estuviera registrado', () => {
      const keyRes = getOrCreateCheckoutIdempotencyKey(5, 12, 1800);

      const cleaned = clearMatchingStoredAttempt(5, 12, 999, keyRes.key);
      expect(cleaned).toBe(true);

      const stored = getStoredCheckoutAttempt(5, 12);
      expect(stored).toBeNull();
    });
  });
