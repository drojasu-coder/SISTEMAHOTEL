import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { formatDisplayMoney, formatGTQ, parseAmount } from './money';
import { MoneyReference } from '@/components/ui/MoneyReference';

describe('Moneda de presentación desde importes base GTQ', () => {
  it.each([[500, 'Q500.00', 'US$64.10'], [1250, 'Q1,250.00', 'US$160.26'], [2800, 'Q2,800.00', 'US$358.97']] as const)('presenta %s en una sola moneda con dos decimales', (base, gtq, usd) => {
    expect(formatDisplayMoney(base)).toBe(gtq);
    expect(formatDisplayMoney(base, 'GTQ')).toBe(gtq);
    expect(formatDisplayMoney(base, 'USD')).toBe(usd);
    expect(formatGTQ(base)).toBe(gtq);
  });
  it.each([null, undefined, '', '  ', 'NaN', 'Infinity', Infinity, {}, true, '0x10', '1,000', 'US$64.10', 'Q500.00'])('rechaza ausencia, valores inválidos o importes ya formateados %s', input => {
    expect(parseAmount(input)).toBeNull();
    expect(formatDisplayMoney(input, 'USD')).toBeNull();
    expect(formatDisplayMoney(input, 'GTQ')).toBeNull();
  });
  it('conserva cero, precisión y el importe original al alternar repetidamente', () => {
    expect(formatDisplayMoney('0.00', 'USD')).toBe('US$0.00');
    expect(formatDisplayMoney(1.005, 'GTQ')).toBe('Q1.01');
    expect(formatDisplayMoney('0.04', 'USD')).toBe('US$0.01');
    const base = '1234.50';
    for (let i = 0; i < 20; i++) {
      expect(formatDisplayMoney(base, 'USD')).toBe('US$158.27');
      expect(formatDisplayMoney(base, 'GTQ')).toBe('Q1,234.50');
    }
    expect(base).toBe('1234.50');
  });
  it('rechaza tipos de cambio inválidos y permite una tasa de referencia explícita sin alterar GTQ', () => {
    for (const rate of [0, -7.8, NaN, Infinity]) expect(formatDisplayMoney(1000, 'USD', rate)).toBeNull();
    expect(formatDisplayMoney(1000, 'USD', 8)).toBe('US$125.00');
    expect(formatDisplayMoney(1000, 'GTQ', 0)).toBe('Q1,000.00');
  });
  it('solo afirma impuestos incluidos con evidencia explícita, sin sumar impuestos', () => {
    const rendered = render(<MoneyReference amount="1000.00" />);
    expect(screen.getByText('Q1,000.00')).toBeInTheDocument();
    expect(screen.queryByText('Impuestos incluidos')).not.toBeInTheDocument();
    rendered.rerender(<MoneyReference amount="1000.00" taxes={{ included: true, source: 'contract' }} />);
    expect(screen.getByText('Q1,000.00')).toBeInTheDocument();
    expect(screen.getByText('Impuestos incluidos')).toBeInTheDocument();
    rendered.rerender(<MoneyReference amount={null} taxes={{ included: true, source: 'validated-configuration' }} />);
    expect(screen.getByText('Importe no disponible')).toBeInTheDocument();
    expect(screen.queryByText('Impuestos incluidos')).not.toBeInTheDocument();
  });
});
