import { describe, it, expect, beforeEach } from 'vitest';
import {
  getOrCreateCheckoutIdempotencyKey,
  clearCheckoutIdempotencyKey,
  generateSecureIdempotencyKey,
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
    const key1 = getOrCreateCheckoutIdempotencyKey(5, 12, 1800);
    const key2 = getOrCreateCheckoutIdempotencyKey(5, 12, 1800);

    expect(key1).toBe(key2);
  });

  it('invalida y genera una nueva clave si el monto cambia (ej. cambio en el carrito)', () => {
    const keyOriginal = getOrCreateCheckoutIdempotencyKey(5, 12, 1800);
    const keyConNuevoMonto = getOrCreateCheckoutIdempotencyKey(5, 12, 2200);

    expect(keyConNuevoMonto).not.toBe(keyOriginal);
    expect(keyConNuevoMonto).toContain('chk-u5-c12-');
  });

  it('genera claves independientes para distintos carritos o usuarios', () => {
    const keyUser1 = getOrCreateCheckoutIdempotencyKey(1, 10, 500);
    const keyUser2 = getOrCreateCheckoutIdempotencyKey(2, 10, 500);
    const keyOtroCarrito = getOrCreateCheckoutIdempotencyKey(1, 11, 500);

    expect(keyUser1).not.toBe(keyUser2);
    expect(keyUser1).not.toBe(keyOtroCarrito);
  });

  it('limpia la clave al invocar clearCheckoutIdempotencyKey', () => {
    const key1 = getOrCreateCheckoutIdempotencyKey(5, 12, 1800);
    clearCheckoutIdempotencyKey(5, 12);
    const key2 = getOrCreateCheckoutIdempotencyKey(5, 12, 1800);

    expect(key2).not.toBe(key1);
  });
});
