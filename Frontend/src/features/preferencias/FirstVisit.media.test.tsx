import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { sedesApi } from '@/features/sedes/api/sedesApi';
import type { Sucursal } from '@/features/sedes/types';
import { LocaleProvider } from '@/i18n/LocaleContext';
import { PublicPreferencesProvider } from './PublicPreferences';
import { FirstVisit } from './FirstVisit';

const cover = 'https://cdn.example.test/sedes/hotel-hunahpu-antigua/portada/portada.webp';
const sites: Sucursal[] = [
  {
    id: 1, nombre: 'Hotel Hunahpú Antigua', ciudad: 'Antigua Guatemala', direccion: null, telefono: null, activa: true,
    imagen_url: cover,
    imagen_creditos: { autor: 'Chad Davis', licencia: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Santa_Catalina_Arch.jpg', texto: 'Chad Davis (CC BY 2.0)' },
  },
];

function renderFirstVisit() {
  return renderWithProviders(<LocaleProvider><PublicPreferencesProvider><FirstVisit /></PublicPreferencesProvider></LocaleProvider>, { route: '/' });
}

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(sedesApi, 'getAll').mockResolvedValue(sites);
});
afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

describe('Portadas de sede en la primera visita', () => {
  it('la portada es decorativa: el botón se nombra una sola vez por la sede', async () => {
    renderFirstVisit();
    const button = await screen.findByRole('button', { name: /Hotel Hunahpú Antigua/ });
    const image = button.querySelector('img');
    expect(image).toHaveAttribute('src', cover);
    expect(image).toHaveAttribute('alt', '');
    expect(button.textContent?.match(/Hotel Hunahpú Antigua/g)).toHaveLength(1);
  });

  it('si la portada no carga muestra el marcador neutro en lugar de una imagen rota', async () => {
    renderFirstVisit();
    const button = await screen.findByRole('button', { name: /Hotel Hunahpú Antigua/ });
    fireEvent.error(button.querySelector('img')!);
    expect(button.querySelector('img')).toBeNull();
    expect(within(button).getByText('Antigua Guatemala')).toBeInTheDocument();
  });

  it('el crédito identifica la sede y no repite la licencia', async () => {
    renderFirstVisit();
    const link = await screen.findByRole('link', { name: 'Chad Davis (CC BY 2.0)' });
    expect(link).toHaveAttribute('href', sites[0].imagen_creditos!.url);
    expect(link.closest('p')).toHaveTextContent('Crédito fotográfico (Hotel Hunahpú Antigua): Chad Davis (CC BY 2.0)');
  });
});
