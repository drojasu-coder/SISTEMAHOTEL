import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Navbar } from '@/components/shared/Navbar';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ForbiddenPage } from '@/pages/ForbiddenPage';

describe('Responsive Layouts & Navigation', () => {
  it('toggles mobile navigation drawer in Navbar', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    const toggleButton = screen.getByLabelText(/Abrir menú de navegación/i);
    expect(toggleButton).toBeInTheDocument();

    // Drawer is closed initially
    expect(screen.queryByText(/Sede actual:/i)).not.toBeInTheDocument();

    // Click to open
    fireEvent.click(toggleButton);

    expect(screen.getByText(/Sede actual:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cerrar menú de navegación/i)).toBeInTheDocument();

    // Click to close
    fireEvent.click(screen.getByLabelText(/Cerrar menú de navegación/i));
    expect(screen.queryByText(/Sede actual:/i)).not.toBeInTheDocument();
  });

  it('toggles mobile drawer in AdminLayout without persistent sidebar on mobile', () => {
    render(
      <MemoryRouter>
        <AdminLayout />
      </MemoryRouter>,
    );

    // Check mobile hamburger button exists
    const menuButton = screen.getByLabelText(/Abrir menú de navegación administrativo/i);
    expect(menuButton).toBeInTheDocument();

    // Open mobile drawer
    fireEvent.click(menuButton);

    const closeButton = screen.getByLabelText(/Cerrar menú/i);
    expect(closeButton).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /Menú de navegación administrativo/i })).toBeInTheDocument();

    // Close mobile drawer
    fireEvent.click(closeButton);
    expect(screen.queryByRole('dialog', { name: /Menú de navegación administrativo/i })).not.toBeInTheDocument();
  });

  it('renders ForbiddenPage with responsive layout and actions', () => {
    render(
      <MemoryRouter>
        <ForbiddenPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Error 403/i)).toBeInTheDocument();
    expect(screen.getByText(/Acceso No Autorizado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Volver a Inicio/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument();
  });
});
