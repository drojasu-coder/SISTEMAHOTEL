import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminScopeProvider, useAdminScope } from './AdminScopeContext';

const session = vi.hoisted(() => ({ user: { id: 7, rol: 'recepcionista' } }));
vi.mock('@/features/auth/AuthContext', () => ({ useAuth: () => session }));
const json = (value: unknown, status = 200) => new Response(JSON.stringify({ data: value }), { status, headers: { 'content-type': 'application/json' } });
function Probe() {
  const scope = useAdminScope();
  return <><output aria-label="selected">{scope.selectedSedeId}</output><output aria-label="sites">{scope.sedes.map(s => s.nombre).join(',')}</output>
    <output aria-label="error">{String(scope.isErrorSedes)}</output>
    <button onClick={() => scope.setSelectedSedeId(5)}>Authorized</button><button onClick={() => scope.setSelectedSedeId(6)}>Unauthorized</button>
    <button onClick={scope.refetchSedes}>Retry</button></>;
}
function mount() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><AdminScopeProvider><Probe /></AdminScopeProvider></QueryClientProvider>);
}
beforeEach(() => {
  sessionStorage.clear();
  vi.stubGlobal('fetch', vi.fn(async () => json({ global: false, sedes: [{ id: 5, nombre: 'Sede propia', activa: true }] })));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe('Ámbito compartido del panel', () => {
  it('usa metadatos privados y rechaza una selección ajena', async () => {
    mount(); await screen.findByText('Sede propia');
    fireEvent.click(screen.getByText('Authorized')); expect(screen.getByLabelText('selected')).toHaveTextContent('5');
    fireEvent.click(screen.getByText('Unauthorized')); expect(screen.getByLabelText('selected')).toHaveTextContent('5');
    expect(vi.mocked(fetch).mock.calls.every(([url]) => String(url).includes('/admin/alcance'))).toBe(true);
  });
  it('descarta una sede guardada cuando ya no está autorizada, incluso con alcance vacío', async () => {
    sessionStorage.setItem('hunahpu.admin.scope.sede.v1:7', '6');
    vi.mocked(fetch).mockResolvedValueOnce(json({ global: false, sedes: [] }));
    mount();
    await waitFor(() => expect(sessionStorage.getItem('hunahpu.admin.scope.sede.v1:7')).toBe('all'));
    expect(screen.getByLabelText('selected')).toHaveTextContent('all');
  });
  it('presenta una avería de alcance y permite recuperarla sin usar el catálogo público', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json({ message: 'Unavailable' }, 500)); mount();
    await waitFor(() => expect(screen.getByLabelText('error')).toHaveTextContent('true'));
    expect(screen.getByLabelText('sites')).toBeEmptyDOMElement();
    fireEvent.click(screen.getByText('Retry')); await screen.findByText('Sede propia');
    expect(screen.getByLabelText('error')).toHaveTextContent('false');
  });
});
