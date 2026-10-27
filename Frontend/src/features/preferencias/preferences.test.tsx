import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import { sedesApi } from '@/features/sedes/api/sedesApi';
import type { Sucursal } from '@/features/sedes/types';
import { LocaleProvider, LanguageSelector } from '@/i18n/LocaleContext';
import { translateUx, uxEn, uxEs } from '@/i18n/ux';
import { PublicPreferencesProvider, siteStatus, usePublicPreferences } from './PublicPreferences';
import { SITE_KEY, LANGUAGE_KEY, parseSite, initialLanguage } from './storage';
import { orderedSites } from './sitePresentation';
import { SiteSelector } from './SiteSelector';
import { FirstVisit } from './FirstVisit';
import { DraftSiteNotice, ResourceSiteNotice, useDraftSiteGuard } from './SiteContextNotice';
import { Navbar } from '@/components/shared/Navbar';
import { PublicDropdown } from '@/components/shared/PublicDropdown';

const sites: Sucursal[] = [
  { id: 2, nombre: 'Hotel Hunahpú Atitlán', ciudad: 'Panajachel', direccion: null, telefono: null, activa: true },
  { id: 1, nombre: 'Hotel Hunapú Antigua', ciudad: 'Antigua Guatemala', direccion: null, telefono: null, activa: true },
];
function Probe() {
  const { selected, hasPreference, status } = usePublicPreferences();
  const location = useLocation();
  return <output data-testid="state">{JSON.stringify({ selected, hasPreference, status, path: location.pathname + location.search })}</output>;
}
function scope(ui: React.ReactElement, route = '/') {
  return renderWithProviders(<LocaleProvider><PublicPreferencesProvider>{ui}<Probe /></PublicPreferencesProvider></LocaleProvider>, { route });
}
function state() { return JSON.parse(screen.getByTestId('state').textContent!); }
function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (v: Error) => void;
  const promise = new Promise<T>((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
}
beforeEach(() => {
  localStorage.clear();
  vi.spyOn(sedesApi, 'getAll').mockResolvedValue(sites);
});
afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); document.body.style.overflow = ''; });

describe('Identidad, persistencia y estados del catálogo', () => {
  it.each([null, '', '0', '-1', 'NaN', '1.2', '[]', '{"id":1}', '9007199254740992'])('rechaza preferencia corrupta %s', (value) => expect(parseSite(value)).toBeNull());
  it('acepta IDs estables y todas las sedes', () => { expect(parseSite('42')).toBe(42); expect(parseSite('all')).toBe('all'); });
  it('normaliza solo registros inequívocos, no inventa ni muta filas, y ordena nuevas sedes por ID', () => {
    const extra = { ...sites[0], id: 90, nombre: 'Otra sede' };
    const result = orderedSites([extra, sites[0], { ...extra, id: 30 }, sites[1]]);
    expect(result.map((s) => s.id)).toEqual([1, 2, 30, 90]);
    expect(result[0].nombre).toBe('Hotel Hunahpú Antigua');
    expect(result[1].ciudad).toBe('Lago de Atitlán, Panajachel');
    expect(sites[1].nombre).toBe('Hotel Hunapú Antigua');
    expect(orderedSites([{ ...extra, id: 1 }])[0].nombre).toBe('Otra sede');
  });
  it('distingue carga, fallo, catálogo vacío y sede desaparecida', () => {
    expect(siteStatus(2, [], true, false)).toBe('loading');
    expect(siteStatus(2, [], false, true)).toBe('error');
    expect(siteStatus('all', [], false, false)).toBe('empty');
    expect(siteStatus(2, [], false, false)).toBe('unavailable');
  });
  it('conserva ID durante carga y error; reintentar recupera la misma preferencia', async () => {
    localStorage.setItem(SITE_KEY, '2');
    const request = deferred<Sucursal[]>();
    vi.mocked(sedesApi.getAll).mockReturnValueOnce(request.promise);
    scope(<SiteSelector />);
    expect(screen.getByRole('combobox')).toHaveValue('2');
    expect(state().status).toBe('loading');
    await act(async () => request.reject(new Error('offline')));
    await screen.findByText(/No se pudieron consultar/, { selector: 'option' });
    expect(state()).toMatchObject({ selected: 2, status: 'error' });
    expect(localStorage.getItem(SITE_KEY)).toBe('2');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(state().status).toBe('ready'));
    expect(screen.getByRole('combobox')).toHaveValue('2');
  });
  it('una carga correcta demuestra una sede eliminada sin ampliar el filtro automáticamente', async () => {
    localStorage.setItem(SITE_KEY, '70');
    scope(<SiteSelector />);
    await waitFor(() => expect(state().status).toBe('unavailable'));
    expect(state().selected).toBe(70);
    expect(screen.getByRole('combobox')).toHaveValue('70');
    await userEvent.setup().selectOptions(screen.getByRole('combobox'), '1');
    expect(state().selected).toBe(1);
    expect(localStorage.getItem(SITE_KEY)).toBe('1');
  });
  it('catálogo vacío no genera opciones ficticias', async () => {
    vi.mocked(sedesApi.getAll).mockResolvedValue([]);
    scope(<SiteSelector />);
    await screen.findByText('No hay sedes disponibles en este momento.');
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });
  it('almacenamiento no disponible permite elegir en memoria sin bloquear la navegación', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    scope(<SiteSelector />);
    await screen.findByRole('option', { name: 'Hotel Hunahpú Antigua' });
    await userEvent.setup().selectOptions(screen.getByRole('combobox'), '1');
    expect(state()).toMatchObject({ selected: 1, hasPreference: true });
  });
  it('al volver a montar restaura la elección explícita', async () => {
    const rendered = scope(<SiteSelector />);
    await screen.findByRole('option', { name: 'Hotel Hunahpú Antigua' });
    await userEvent.setup().selectOptions(screen.getByRole('combobox'), '2');
    rendered.unmount();
    scope(<SiteSelector />);
    expect(state().selected).toBe(2);
    expect(state().hasPreference).toBe(true);
  });
});

describe('Idioma y primera visita', () => {
  it('sugiere inglés solo para navegador inglés y respeta la preferencia explícita', () => {
    expect(initialLanguage(null, 'en-US')).toBe('en');
    expect(initialLanguage('es', 'en')).toBe('es');
    expect(initialLanguage('invalid', 'fr')).toBe('es');
  });
  it('actualiza HTML lang y persiste Español / English', async () => {
    scope(<LanguageSelector />);
    await userEvent.setup().selectOptions(screen.getByRole('combobox'), 'en');
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('en');
    expect(screen.getByLabelText('Language')).toHaveValue('en');
  });
  it('fallback al español sin claves ni cadenas vacías', () => {
    const original = uxEn.close;
    uxEn.close = '';
    expect(translateUx('en', 'close')).toBe('Cerrar');
    delete uxEn.close;
    expect(translateUx('en', 'close')).toBe('Cerrar');
    uxEn.close = original;
    for (const key of Object.keys(uxEs) as (keyof typeof uxEs)[]) expect(translateUx('en', key).trim()).not.toBe('');
  });
  it('la invitación inicial no roba foco y cerrar equivale a todas las sedes', async () => {
    scope(<FirstVisit />);
    expect(screen.getByText(uxEs.welcome)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(state()).toMatchObject({ selected: 'all', hasPreference: true });
    expect(localStorage.getItem(SITE_KEY)).toBe('all');
    expect(screen.queryByText(uxEs.welcome)).not.toBeInTheDocument();
  });
  it('en retorno de pago conserva ruta/parámetros y ofrece invitación discreta', async () => {
    scope(<FirstVisit />, '/pagos/9/resultado?payment_intent=pi_fixture&redirect_status=succeeded');
    expect(screen.queryByText(uxEs.welcome)).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Elegir sede' }));
    expect(state().path).toBe('/pagos/9/resultado?payment_intent=pi_fixture&redirect_status=succeeded');
  });
});

function Draft() {
  const blocked = useDraftSiteGuard(99, 1);
  return <form onSubmit={(e) => e.preventDefault()}><DraftSiteNotice blocked={blocked} /><fieldset disabled={blocked}>
    <label>Fecha<input type="date" defaultValue="2026-11-20" /></label><label>Nota<input defaultValue="Preferencia escrita" /></label><button>Confirmar</button>
  </fieldset></form>;
}
describe('Formularios y detalles', () => {
  it('invalida el recurso incompatible conservando fechas y texto', async () => {
    localStorage.setItem(SITE_KEY, '1');
    scope(<><SiteSelector /><Draft /></>);
    await screen.findByRole('option', { name: 'Hotel Hunahpú Atitlán' });
    await userEvent.setup().selectOptions(screen.getByRole('combobox'), '2');
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled();
    expect(screen.getByLabelText('Fecha')).toHaveValue('2026-11-20');
    expect(screen.getByLabelText('Nota')).toHaveValue('Preferencia escrita');
    expect(screen.getByRole('alert')).toHaveTextContent(uxEs.changed);
  });
  it('el detalle conserva la sede real hasta una acción explícita', async () => {
    localStorage.setItem(SITE_KEY, '2');
    scope(<ResourceSiteNotice siteId={1} name="Nombre real" />);
    const explore = await screen.findByRole('button', { name: 'Explorar esta sede' });
    expect(state().selected).toBe(2);
    await userEvent.setup().click(explore);
    expect(state().selected).toBe(1);
  });
});

describe('Teclado y menú móvil', () => {
  it('atrapa foco, bloquea scroll, cierra con Escape y devuelve foco', async () => {
    scope(<Navbar />);
    const user = userEvent.setup();
    const open = screen.getByRole('button', { name: uxEs.openMenu });
    await user.click(open);
    const dialog = screen.getByRole('dialog');
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    expect(document.body.style.overflow).toBe('hidden');
    for (let i = 0; i < 15; i++) { await user.tab(); expect(dialog.contains(document.activeElement)).toBe(true); }
    expect(within(dialog).queryByRole('combobox')).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(document.body.style.overflow).toBe('');
    expect(open).toHaveFocus();
  });
  it('no abre otro diálogo sobre un formulario modal activo', async () => {
    scope(<><Navbar /><div role="dialog" aria-modal="true">Formulario</div></>);
    await userEvent.setup().click(screen.getByRole('button', { name: uxEs.openMenu }));
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });
  it('desplegable explícito: Escape cierra y restaura el foco al control', async () => {
    renderWithProviders(<PublicDropdown label="Experiencias"><a href="/eventos">Eventos</a></PublicDropdown>);
    const summary = screen.getByText('Experiencias').closest('summary')!;
    await userEvent.setup().click(summary);
    const link = screen.getByRole('link', { name: 'Eventos' });
    link.focus();
    await userEvent.setup().keyboard('{Escape}');
    expect(summary).toHaveFocus();
    expect(summary.closest('details')).not.toHaveAttribute('open');
  });
});
