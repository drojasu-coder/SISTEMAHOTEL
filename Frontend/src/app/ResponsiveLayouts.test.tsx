import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { Navbar } from '@/components/shared/Navbar';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { tokenStorage } from '@/api/session';
import { meResponse, renderWithProviders } from '@/test/renderWithProviders';

describe('Navegación pública', () => {
  beforeEach(() => tokenStorage.clear());
  afterEach(() => {
    vi.restoreAllMocks();
    tokenStorage.clear();
  });

  it('visitante: ofrece ingresar y crear cuenta sin enlaces de panel', () => {
    renderWithProviders(<Navbar />);

    expect(screen.getByRole('link', { name: /Ingresar/i })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /Crear cuenta/i })).toHaveAttribute('href', '/registro');
    expect(screen.queryByRole('link', { name: /Panel/i })).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/Sede actual|Hunapú Antigua/i);
  });

  it('cliente con sesión: ve su cuenta y cerrar sesión, nunca el panel', async () => {
    tokenStorage.set('jwt');
    global.fetch = vi.fn().mockResolvedValue(meResponse('cliente'));
    renderWithProviders(<Navbar />);

    await userEvent.setup().click(await screen.findByText('Persona Prueba'));
    expect(await screen.findByRole('link', { name: /Mi cuenta/i })).toHaveAttribute('href', '/cuenta');
    expect(screen.getByRole('button', { name: /Cerrar sesión/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Panel$/i })).not.toBeInTheDocument();
  });

  it('personal con módulos: el acceso principal lleva al panel', async () => {
    tokenStorage.set('jwt');
    global.fetch = vi.fn().mockResolvedValue(meResponse('recepcionista'));
    renderWithProviders(<Navbar />);

    await userEvent.setup().click(await screen.findByText('Persona Prueba'));
    expect(await screen.findByRole('link', { name: /Ir al panel/i })).toHaveAttribute('href', '/admin');
  });

  it('cerrar sesión borra el token y vuelve a ofrecer ingresar', async () => {
    tokenStorage.set('jwt');
    global.fetch = vi.fn().mockResolvedValue(meResponse('cliente'));
    renderWithProviders(<Navbar />);

    await userEvent.setup().click(await screen.findByText('Persona Prueba'));
    await userEvent.setup().click(await screen.findByRole('button', { name: /Cerrar sesión/i }));

    expect(await screen.findByRole('link', { name: /Ingresar/i })).toBeInTheDocument();
    expect(tokenStorage.get()).toBeNull();
  });
});

describe('Panel administrativo responsivo y accesible', () => {
  beforeEach(() => {
    tokenStorage.set('jwt');
    global.fetch = vi.fn().mockResolvedValue(meResponse('admin', 'Ana Gómez'));
  });
  afterEach(() => {
    vi.restoreAllMocks();
    tokenStorage.clear();
  });

  const renderPanel = () =>
    renderWithProviders(
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<p>contenido</p>} />
        </Route>
      </Routes>,
      { route: '/admin' },
    );

  it('muestra la persona y el rol reales, sin textos de demostración', async () => {
    renderPanel();
    expect(await screen.findByText('Administrador')).toBeInTheDocument();
    expect(screen.getAllByText(/Ana Gómez/).length).toBeGreaterThan(0);
    expect(document.body).not.toHaveTextContent(/Demo|Todas las sedes|Sede activa/i);
  });

  it('tiene enlace para saltar al contenido y un único contenedor principal', async () => {
    renderPanel();
    const skip = await screen.findByRole('link', { name: /Saltar al contenido/i });
    expect(skip).toHaveAttribute('href', '#contenido');
    expect(screen.getAllByRole('main')).toHaveLength(1);
  });

  it('el menú móvil es un diálogo: enfoca dentro, se cierra con Escape y devuelve el foco', async () => {
    const user = userEvent.setup();
    renderPanel();

    const toggle = await screen.findByRole('button', { name: /Abrir menú de navegación administrativo/i });
    await user.click(toggle);

    const dialog = screen.getByRole('dialog', { name: /Menú de navegación administrativo/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(within(dialog).getByRole('navigation', { name: /Panel administrativo/i })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: /Menú de navegación administrativo/i })).not.toBeInTheDocument(),
    );
    expect(toggle).toHaveFocus();
  });

  it('el foco queda atrapado dentro del menú móvil con Tab', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(await screen.findByRole('button', { name: /Abrir menú de navegación administrativo/i }));
    const dialog = screen.getByRole('dialog');

    for (let i = 0; i < 12; i += 1) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });
});

describe('Acceso no autorizado', () => {
  afterEach(() => tokenStorage.clear());

  it('visitante: ofrece iniciar sesión', () => {
    renderWithProviders(<ForbiddenPage />);
    expect(screen.getByRole('heading', { level: 1, name: /Acceso no autorizado/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Iniciar Sesión/i })).toBeInTheDocument();
  });

  it('con sesión: ofrece volver a su espacio en lugar de iniciar sesión', async () => {
    tokenStorage.set('jwt');
    global.fetch = vi.fn().mockResolvedValue(meResponse('empleado_operativo'));
    renderWithProviders(<ForbiddenPage />);

    expect(await screen.findByRole('link', { name: /Ir a mi espacio/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Iniciar Sesión/i })).not.toBeInTheDocument();
  });
});
