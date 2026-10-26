import { describe, it, expect } from 'vitest';
import { formatQ } from './formatQ';

describe('formatQ', () => {
  it('formatea un monto entero con dos decimales y prefijo Q', () => {
    expect(formatQ(1250)).toBe('Q1,250.00');
  });

  it('formatea un monto con decimales', () => {
    expect(formatQ(1250.5)).toBe('Q1,250.50');
  });

  it('formatea cero', () => {
    expect(formatQ(0)).toBe('Q0.00');
  });

  it('lanza RangeError cuando el valor no es finito', () => {
    expect(() => formatQ(NaN)).toThrow(RangeError);
    expect(() => formatQ(Infinity)).toThrow(RangeError);
    expect(() => formatQ(-Infinity)).toThrow(RangeError);
  });
});
