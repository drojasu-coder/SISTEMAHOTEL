import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardContent, CardFooter } from './Card';

describe('Card', () => {
  it('renderiza hijos dentro de un div con clase surface', () => {
    render(<Card><p>Contenido</p></Card>);
    const card = screen.getByText('Contenido').closest('div');
    expect(card?.className).toContain('surface');
  });

  it('acepta className adicional', () => {
    render(<Card className="mi-clase"><p>x</p></Card>);
    expect(screen.getByText('x').closest('div')?.className).toContain('mi-clase');
  });
});

describe('CardHeader', () => {
  it('renderiza título y descripción opcional', () => {
    render(
      <CardHeader title="Título" description="Descripción" aside={<span>aside</span>} />,
    );
    expect(screen.getByText('Título')).toBeInTheDocument();
    expect(screen.getByText('Descripción')).toBeInTheDocument();
    expect(screen.getByText('aside')).toBeInTheDocument();
  });

  it('funciona sin descripción ni aside', () => {
    render(<CardHeader title="Solo título" />);
    expect(screen.getByText('Solo título')).toBeInTheDocument();
    expect(screen.queryByText('Descripción')).toBeNull();
  });
});

describe('CardContent', () => {
  it('renderiza hijos con relleno', () => {
    render(<CardContent><p>Cuerpo</p></CardContent>);
    expect(screen.getByText('Cuerpo')).toBeInTheDocument();
  });
});

describe('CardFooter', () => {
  it('renderiza hijos en el pie', () => {
    render(<CardFooter><button>Guardar</button></CardFooter>);
    expect(screen.getByText('Guardar')).toBeInTheDocument();
  });
});
