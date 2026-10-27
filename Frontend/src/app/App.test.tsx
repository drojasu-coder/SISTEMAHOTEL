import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '@/App';
import { tokenStorage } from '@/api/session';

describe('App smoke test', () => {
  afterEach(() => {
    tokenStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('muestra la portada provisional sin datos ficticios y con acceso general', () => {
    window.history.replaceState(null, '', '/');
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: /HOTEL HUNAHP[UÚ]/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ingresar/i })).toBeInTheDocument();

    // Sin acceso directo al panel para visitantes
    expect(screen.queryByRole('link', { name: /Admin|Panel/i })).not.toBeInTheDocument();

    // Sin precios, sedes, direcciones, teléfonos ni disponibilidad inventados
    const text = document.body.textContent ?? '';
    expect(text).not.toMatch(/Q\s?\d/);
    expect(text).not.toMatch(/Antigua|Atitl[aá]n|Panajachel|\+502|@hotelhunapu/i);
    expect(screen.queryByRole('button', { name: /Reservar/i })).not.toBeInTheDocument();
  });

  it('ruta inexistente muestra la página 404', () => {
    window.history.replaceState(null, '', '/no-existe');
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: /Página no encontrada/i })).toBeInTheDocument();
  });
});
