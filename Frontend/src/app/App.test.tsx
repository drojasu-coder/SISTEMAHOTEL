import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '@/App';
import { tokenStorage } from '@/api/session';

describe('App smoke test', () => {
  afterEach(() => {
    tokenStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('muestra la portada de HOTEL HUNAHPÚ con identidad, buscador y acceso a reservas', () => {
    window.history.replaceState(null, '', '/');
    render(<App />);

    // 1. Título principal de HOTEL HUNAHPÚ
    expect(
      screen.getByRole('heading', { level: 1, name: /HOTEL HUNAHP[UÚ]/i }),
    ).toBeInTheDocument();

    // 2. Acceso general para visitantes
    expect(screen.getByRole('link', { name: /Ingresar/i })).toBeInTheDocument();

    // 3. Sin acceso directo al panel para visitantes no autenticados
    expect(screen.queryByRole('link', { name: /Admin|Panel/i })).not.toBeInTheDocument();

    // 4. Botón de llamado a la acción principal
    expect(
      screen.getByRole('link', { name: /Reservar estancia/i }),
    ).toBeInTheDocument();

    // 5. Buscador de disponibilidad interactivo
    expect(
      screen.getByRole('button', { name: /Consultar Disponibilidad/i }),
    ).toBeInTheDocument();

    // 6. Secciones principales visibles
    expect(
      screen.getAllByRole('heading', { level: 2, name: /Nuestras Sedes/i }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByRole('heading', { level: 2, name: /Servicios y Experiencias/i }),
    ).toBeInTheDocument();
  });

  it('ruta inexistente muestra la página 404', () => {
    window.history.replaceState(null, '', '/no-existe');
    render(<App />);
    expect(
      screen.getByRole('heading', { level: 1, name: /Página no encontrada/i }),
    ).toBeInTheDocument();
  });
});
