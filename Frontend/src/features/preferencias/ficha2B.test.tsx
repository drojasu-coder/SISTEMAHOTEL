import React from 'react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation, useNavigate } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import { LocaleProvider, LanguageSelector } from '@/i18n/LocaleContext';
import { PublicPreferencesProvider } from './PublicPreferences';
import { SITE_KEY } from './storage';
import { sedesApi } from '@/features/sedes/api/sedesApi';
import { amenidadesApi } from '@/features/amenidades/api/amenidadesApi';
import { actividadesApi } from '@/features/actividades/api/actividadesApi';
import { eventosApi } from '@/features/eventos/api/eventosApi';
import { CatalogoAmenidadesCliente } from '@/features/amenidades/components/CatalogoAmenidadesCliente';
import { CatalogoActividadesCliente } from '@/features/actividades/components/CatalogoActividadesCliente';
import { CatalogoSalonesList } from '@/features/eventos/components/CatalogoSalonesList';
import { ServiceMedia } from '@/components/shared/ServiceCard';
import { PageContainer, PageHeader } from '@/components/shared/PageContainer';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { DateField } from '@/components/ui/DateField';
import { Input } from '@/components/ui/Input';
import { Toast, ToastProvider, useToast } from '@/components/ui/Toast';
import { ApiError } from '@/api/client/http';

const sites = [
  { id: 1, nombre: 'Hotel Hunapú Antigua', ciudad: 'Antigua Guatemala', activa: true },
  { id: 2, nombre: 'Hotel Hunahpú Atitlán', ciudad: 'Panajachel', activa: true },
];
function NavigationProbe() {
  const location = useLocation(); const navigate = useNavigate();
  return <><output aria-label="URL">{location.pathname}{location.search}{location.hash}</output><button onClick={() => navigate(-1)}>Atrás</button><button onClick={() => navigate(1)}>Adelante</button></>;
}
function mount(children: React.ReactNode, route = '/amenidades') {
  return renderWithProviders(<LocaleProvider><PublicPreferencesProvider><LanguageSelector /><NavigationProbe />{children}</PublicPreferencesProvider></LocaleProvider>, { route });
}
beforeEach(() => {
  localStorage.clear(); localStorage.setItem(SITE_KEY, '1');
  vi.spyOn(sedesApi, 'getAll').mockResolvedValue(sites as Awaited<ReturnType<typeof sedesApi.getAll>>);
  vi.spyOn(actividadesApi, 'getInstructores').mockResolvedValue([]);
});
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); localStorage.clear(); document.body.style.overflow = ''; });
const amenities = Array.from({ length: 12 }, (_, index) => ({ id: index + 1, nombre: `Piscina ${index + 1}`, sucursal_id: 2, aforo_maximo: 20, imagen_url: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' }));

describe('Filtros públicos por URL', () => {
  it('el estado de carga no publica un cero como si fuese el total recibido', async () => {
    let resolve!: (value: typeof amenities) => void;
    vi.spyOn(amenidadesApi, 'getAll').mockReturnValue(new Promise((done) => { resolve = done; }));
    mount(<CatalogoAmenidadesCliente />);
    expect(screen.getByRole('status', { name: 'Cargando catálogo…' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('0 amenidades mostradas')).not.toBeInTheDocument();
    await act(async () => resolve([]));
    expect(await screen.findByRole('heading', { name: 'No hay amenidades registradas' })).toBeInTheDocument();
  });
  it('permite conservar la sede actual y rechazar el contexto compartido sin borrar los filtros', async () => {
    vi.spyOn(amenidadesApi, 'getAll').mockResolvedValue([{ ...amenities[0], sucursal_id: 1 }]);
    mount(<CatalogoAmenidadesCliente />, '/amenidades?sede=2&q=Piscina&utm=conservar');
    await screen.findByText('Sede del enlace compartido');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Usar mi sede actual' }));
    expect(await screen.findByRole('heading', { name: 'Piscina 1' })).toBeInTheDocument();
    expect(localStorage.getItem(SITE_KEY)).toBe('1');
    expect(screen.getByLabelText('URL')).toHaveTextContent('sede=1');
    expect(screen.getByLabelText('URL')).toHaveTextContent('q=Piscina');
    expect(screen.getByLabelText('URL')).toHaveTextContent('utm=conservar');
  });
  it('no aplica silenciosamente la sede compartida; preserva página y parámetros ajenos al aplicarla', async () => {
    vi.spyOn(amenidadesApi, 'getAll').mockResolvedValue(amenities);
    mount(<CatalogoAmenidadesCliente />, '/amenidades?sede=2&q=Piscina&page=2&utm=externo');
    await screen.findByText('Sede del enlace compartido');
    expect(localStorage.getItem(SITE_KEY)).toBe('1');
    expect(screen.queryByRole('heading', { name: 'Piscina 10' })).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Aplicar sede del enlace' }));
    expect(await screen.findByRole('heading', { name: 'Piscina 10' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Piscina 1' })).not.toBeInTheDocument();
    expect(screen.getByText('12 amenidades mostradas')).toBeInTheDocument();
    expect(screen.getByLabelText('URL')).toHaveTextContent('page=2');
    expect(screen.getByLabelText('URL')).toHaveTextContent('utm=externo');
    expect(localStorage.getItem(SITE_KEY)).toBe('2');
  });
  it('la búsqueda reemplaza historial; paginación, atrás/adelante y recarga conservan filtros; limpiar mantiene sede', async () => {
    localStorage.setItem(SITE_KEY, '2');
    vi.spyOn(amenidadesApi, 'getAll').mockResolvedValue(amenities);
    const view = mount(<CatalogoAmenidadesCliente />, '/amenidades?utm=externo#catalogo');
    await screen.findByRole('heading', { name: 'Piscina 1' });
    const user = userEvent.setup();
    await user.type(screen.getByRole('searchbox'), 'Piscina');
    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(await screen.findByRole('heading', { name: 'Piscina 10' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Atrás' }));
    expect(await screen.findByRole('heading', { name: 'Piscina 1' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveValue('Piscina');
    await user.click(screen.getByRole('button', { name: 'Adelante' }));
    const url = screen.getByLabelText('URL').textContent!;
    view.unmount(); mount(<CatalogoAmenidadesCliente />, url);
    expect(await screen.findByRole('heading', { name: 'Piscina 10' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Restablecer filtros' }));
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.getByLabelText('URL')).not.toHaveTextContent('page=');
    expect(screen.getByLabelText('URL')).not.toHaveTextContent('q=');
    expect(screen.getByLabelText('URL')).toHaveTextContent('utm=externo');
    expect(screen.getByLabelText('URL')).toHaveTextContent('#catalogo');
    expect(localStorage.getItem(SITE_KEY)).toBe('2');
    expect(screen.getByRole('link', { name: 'Enlace a estos resultados' }).getAttribute('href')).toContain('sede=2');
  });
  it('valida página, sede y filtro desconocidos sin borrar parámetros ajenos', async () => {
    vi.spyOn(actividadesApi, 'getRecursos').mockResolvedValue([{ id: 1, nombre: 'Cancha', tipo: 'deporte', sucursal_id: 1, precio_hora: 100 }]);
    mount(<CatalogoActividadesCliente />, '/actividades?page=-9&sede=abc&tipo=inventado&utm=externo');
    await screen.findByRole('heading', { name: 'Cancha' });
    await waitFor(() => expect(screen.getByLabelText('URL')).toHaveTextContent('/actividades?utm=externo'));
    expect(screen.getByRole('combobox', { name: 'Filtrar por tipo' })).toHaveValue('');
  });
  it('el panel móvil tiene un solo juego de controles y restaura foco con Escape', async () => {
    vi.spyOn(actividadesApi, 'getRecursos').mockResolvedValue([{ id: 1, nombre: 'Cancha', tipo: 'deporte', sucursal_id: 1 }]);
    mount(<CatalogoActividadesCliente />, '/actividades');
    const button = screen.getByRole('button', { name: 'Filtros' });
    await userEvent.setup().click(button);
    const dialog = screen.getByRole('dialog', { name: 'Filtros' });
    expect(screen.getAllByRole('combobox', { name: 'Filtrar por tipo' })).toHaveLength(1);
    await within(dialog).findByRole('option', { name: 'deporte' });
    await userEvent.setup().selectOptions(within(dialog).getByRole('combobox'), 'deporte');
    await userEvent.setup().keyboard('{Escape}');
    expect(button).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Quitar filtro: deporte' })).toBeInTheDocument();
  });
  it('separa falta de datos, filtros sin resultados y fallo, con siguiente acción y reintento', async () => {
    const api = vi.spyOn(amenidadesApi, 'getAll').mockResolvedValue([]);
    const view = mount(<CatalogoAmenidadesCliente />);
    expect(await screen.findByRole('heading', { name: 'No hay amenidades registradas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar sedes' })).toBeInTheDocument();
    view.unmount(); api.mockRejectedValue(new ApiError(500, 'stack trace privado'));
    const failed = mount(<CatalogoAmenidadesCliente />);
    expect(await screen.findByRole('alert')).not.toHaveTextContent('stack trace privado');
    api.mockResolvedValue(amenities);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('heading', { name: 'Sin resultados con estos filtros' })).toBeInTheDocument();
    failed.unmount(); localStorage.setItem(SITE_KEY, '2');
    mount(<CatalogoAmenidadesCliente />, '/amenidades?q=noexiste');
    expect(await screen.findByRole('heading', { name: 'Sin resultados con estos filtros' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quitar filtro: noexiste' })).toBeInTheDocument();
  });
  it('las acciones de salón son enlaces/botones hermanos y los precios usan la referencia común', async () => {
    vi.spyOn(eventosApi, 'getSalones').mockResolvedValue([{ id: 9, nombre: 'Salón Jardín', sucursal_id: 1, tarifa_base: 780, capacidad_maxima: 30 }]);
    const view = mount(<CatalogoSalonesList />, '/eventos');
    await screen.findByRole('heading', { name: 'Salón Jardín' });
    expect(view.container.querySelector('a button, button a')).toBeNull();
    expect(screen.getByRole('link', { name: 'Ver salón' })).toHaveAttribute('href', '/eventos/salones/9');
    expect(screen.getByText(/US\$\s*100\.00/)).toBeInTheDocument();
  });
});

describe('Presentación compartida y accesibilidad', () => {
  it('conserva firmas exactas, ofrece fallback de error sin reintentos y acepta una URL renovada', () => {
    const props = { alt: 'Piscina', credits: { autor: 'Autora', licencia: 'CC BY 4.0', url: 'https://example.test/licencia' } };
    const view = renderWithProviders(<ServiceMedia {...props} src="https://example.test/foto?sig=original%2Bvalor" />);
    const image = screen.getByRole('img', { name: 'Piscina' });
    expect(image).toHaveAttribute('src', 'https://example.test/foto?sig=original%2Bvalor');
    expect(image).toHaveAttribute('loading', 'lazy');
    fireEvent.error(image);
    expect(screen.getByRole('img', { name: 'Imagen no disponible' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Autora' }).closest('figcaption')).not.toBeNull();
    view.rerender(<ServiceMedia {...props} src="https://example.test/foto?sig=renovada" />);
    expect(screen.getByRole('img', { name: 'Piscina' })).toHaveAttribute('src', 'https://example.test/foto?sig=renovada');
  });
  it('mapea estados por dominio y no convierte confirmación en pago; desconocidos no exponen el código', async () => {
    const diagnostic = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mount(<><StatusBadge domain="reservation" value="confirmada" /><StatusBadge domain="payment" value="aprobado" /><StatusBadge domain="reservation" value="internal_future_777" /></>);
    expect(screen.getByText('Confirmada')).toBeInTheDocument();
    expect(screen.getByText('Aprobado')).toBeInTheDocument();
    expect(screen.queryByText('internal_future_777')).not.toBeInTheDocument();
    expect(screen.getByText('Estado no disponible')).toBeInTheDocument();
    expect(diagnostic).toHaveBeenCalled();
    await userEvent.setup().selectOptions(screen.getByRole('combobox', { name: 'Idioma' }), 'en');
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Status unavailable')).toBeInTheDocument();
  });
  it('unifica el Field de Input y DateField asociando ayuda/error y conservando fechas ISO', () => {
    renderWithProviders(<><Input label="Nombre" hint="Ayuda" /><DateField label="Llegada" error="Revise la fecha" defaultValue="2030-01-01" required /></>);
    const date = screen.getByLabelText('Llegada');
    expect(date).toHaveValue('2030-01-01');
    expect(date).toHaveAttribute('aria-invalid', 'true');
    expect(document.getElementById(date.getAttribute('aria-describedby')!)).toHaveTextContent('Revise la fecha');
    expect(document.getElementById(screen.getByLabelText('Nombre').getAttribute('aria-describedby')!)).toHaveTextContent('Ayuda');
  });
  it('el Modal bloquea el cierre mientras está pendiente y devuelve foco al origen después', async () => {
    function Demo() { const [open, setOpen] = React.useState(false); const [busy, setBusy] = React.useState(false); return <><button onClick={() => setOpen(true)}>Abrir</button><Modal open={open} title="Reserva de Piscina" busy={busy} busyLabel="Enviando" onClose={() => setOpen(false)}><button onClick={() => setBusy(!busy)}>{busy ? 'Resolver' : 'Enviar'}</button></Modal></>; }
    renderWithProviders(<Demo />); const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Abrir' }));
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Resolver' })); await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Abrir' })).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });
  it('PageHeader admite contexto y migas sin duplicar h1; variante admin conserva ancho propio', () => {
    const view = renderWithProviders(<PageContainer variant="admin"><PageHeader eyebrow="Experiencias" title="Amenidades" description="Descripción" context={<p>Sede real</p>} breadcrumbs={<nav aria-label="Ruta">Inicio</nav>} /></PageContainer>);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(view.container.querySelector('section')).not.toHaveClass('max-w-7xl');
    expect(screen.getByRole('navigation', { name: 'Ruta' })).toBeInTheDocument();
  });
});

describe('Notificaciones', () => {
  it('muestra como máximo tres, pone el resto en cola y conserva errores importantes', () => {
    vi.useFakeTimers();
    function Demo() { const notify = useToast(); return <button onClick={() => [1, 2, 3, 4].forEach((n) => notify({ title: `Error ${n}`, tone: 'error' }))}>Notificar</button>; }
    renderWithProviders(<ToastProvider><Demo /></ToastProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Notificar' }));
    expect(screen.getAllByRole('alert')).toHaveLength(3);
    act(() => vi.advanceTimersByTime(60000));
    expect(screen.getAllByRole('alert')).toHaveLength(3);
    expect(screen.queryByText('Error 4')).not.toBeInTheDocument();
    fireEvent.click(within(screen.getAllByRole('alert')[0]).getByRole('button', { name: 'Cerrar' }));
    expect(screen.getByText('Error 4')).toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(3);
  });
  it('pausa el vencimiento durante lectura o foco', () => {
    vi.useFakeTimers(); const close = vi.fn();
    renderWithProviders(<Toast title="Información" tone="info" onClose={close} />);
    const toast = screen.getByRole('status');
    fireEvent.mouseEnter(toast); act(() => vi.advanceTimersByTime(20000)); expect(close).not.toHaveBeenCalled();
    fireEvent.mouseLeave(toast); fireEvent.focus(screen.getByRole('button', { name: 'Cerrar' })); act(() => vi.advanceTimersByTime(20000)); expect(close).not.toHaveBeenCalled();
    fireEvent.blur(screen.getByRole('button', { name: 'Cerrar' })); act(() => vi.advanceTimersByTime(7000)); expect(close).toHaveBeenCalledTimes(1);
  });
});
