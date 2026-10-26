import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriceSummary } from './PriceSummary';

describe('PriceSummary', () => {
  it('muestra subtotal, impuestos y total', () => {
    render(<PriceSummary subtotal={1250} descuento={125} impuestos={135} total={1260} />);
    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText('Descuento')).toBeInTheDocument();
    expect(screen.getByText('Impuestos')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Q1,250.00')).toBeInTheDocument();
    expect(screen.getByText('Q1,260.00')).toBeInTheDocument();
  });

  it('no muestra la fila de descuento cuando es cero o undefined', () => {
    render(<PriceSummary subtotal={1000} impuestos={150} total={1150} />);
    expect(screen.queryByText('Descuento')).toBeNull();
    expect(screen.getByText('Q1,000.00')).toBeInTheDocument();
    expect(screen.getByText('Q1,150.00')).toBeInTheDocument();
  });

  it('muestra valores en cero correctamente', () => {
    render(<PriceSummary subtotal={0} descuento={0} impuestos={0} total={0} />);
    expect(screen.getAllByText('Q0.00')[0]).toBeInTheDocument();
  });

  it('usa formatQ para formatear los importes', () => {
    render(<PriceSummary subtotal={1234.5} impuestos={0} total={1234.5} />);
    expect(screen.getAllByText('Q1,234.50')[0]).toBeInTheDocument();
  });
});
