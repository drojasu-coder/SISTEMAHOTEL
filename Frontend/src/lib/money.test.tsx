import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { formatReferenceMoney, parseAmount } from './money';
import { MoneyReference } from '@/components/ui/MoneyReference';

describe('Referencia monetaria de presentación', () => {
  it('convierte 1000 GTQ a 128.21 USD en ambos idiomas', () => {
    expect(formatReferenceMoney('1000.00', 'es')).toBe('Q 1,000.00 · ≈ US$ 128.21');
    expect(formatReferenceMoney(1000, 'en')).toBe('Q1,000.00 · ≈ US$128.21');
  });
  it.each([null, undefined, '', '  ', 'NaN', 'Infinity', Infinity, {}, true, '0x10', '1,000'])('no convierte ausencia o entrada inválida %s en cero', (input) => {
    expect(parseAmount(input)).toBeNull();
    expect(formatReferenceMoney(input, 'es')).toBeNull();
  });
  it('acepta cero y valores decimales serializados sin mutarlos', () => {
    expect(formatReferenceMoney('0.00', 'en')).toBe('Q0.00 · ≈ US$0.00');
    const amount = '1234.50';
    expect(formatReferenceMoney(amount, 'es')).toContain('Q 1,234.50');
    expect(amount).toBe('1234.50');
    expect(formatReferenceMoney(1000, 'es', 0)).toBeNull();
    expect(formatReferenceMoney(1000, 'es', -7.8)).toBeNull();
  });
  it('solo afirma impuestos incluidos con un fixture explícito de contrato validado', () => {
    const rendered = render(<MoneyReference amount="1000.00" />);
    expect(screen.queryByText('Impuestos incluidos')).not.toBeInTheDocument();
    rendered.rerender(<MoneyReference amount="1000.00" taxes={{ included: true, source: 'contract' }} />);
    expect(screen.getByText('Impuestos incluidos')).toBeInTheDocument();
    rendered.rerender(<MoneyReference amount={null} taxes={{ included: true, source: 'validated-configuration' }} />);
    expect(screen.getByText('Importe no disponible')).toBeInTheDocument();
    expect(screen.queryByText('Impuestos incluidos')).not.toBeInTheDocument();
  });
});
