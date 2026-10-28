import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocaleProvider, useLocale } from '@/i18n/LocaleContext';
import { PublicTopBar } from '@/components/shared/PublicTopBar';
import { MoneyReference } from '@/components/ui/MoneyReference';
import { CurrencySelector } from './CurrencySelector';
import { CURRENCY_KEY, LANGUAGE_KEY, initialCurrency } from './storage';
import { AdminMoney } from '@/features/admin-core/workbench';
import { ResumenCheckout } from '@/features/pagos/components/ResumenCheckout';

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });
function mount() {
  return render(<MemoryRouter><LocaleProvider><PublicTopBar /><Routes>
    <Route path="/" element={<><MoneyReference amount="1250.00" /><Link to="/carrito">Carrito</Link></>} />
    <Route path="/carrito" element={<MoneyReference amount="500.00" />} />
  </Routes></LocaleProvider></MemoryRouter>);
}
describe('Preferencia monetaria global independiente del idioma', () => {
  it.each([null, '', 'eur', 'usd', 'USD<script>', 'es'])('usa GTQ para preferencia ausente o inválida %s', saved => expect(initialCurrency(saved)).toBe('GTQ'));
  it('empieza en GTQ y solo muestra Q aunque el idioma sea inglés', () => {
    localStorage.setItem(LANGUAGE_KEY, 'en'); mount();
    expect(screen.getByRole('combobox', { name: 'Display currency' })).toHaveValue('GTQ');
    expect(screen.getByText('Q1,250.00')).toBeInTheDocument();
    expect(screen.queryByText('US$160.26')).not.toBeInTheDocument();
  });
  it('persiste USD, mantiene la navegación y restaura la preferencia al remontar', async () => {
    const view = mount(); const user = userEvent.setup();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Moneda de visualización' }), 'USD');
    expect(screen.getByText('US$160.26')).toBeInTheDocument();
    expect(screen.queryByText('Q1,250.00')).not.toBeInTheDocument();
    expect(localStorage.getItem(CURRENCY_KEY)).toBe('USD');
    await user.click(screen.getByRole('link', { name: 'Carrito' }));
    expect(screen.getByText('US$64.10')).toBeInTheDocument();
    view.unmount(); mount();
    expect(screen.getByRole('combobox', { name: 'Moneda de visualización' })).toHaveValue('USD');
    expect(screen.getByText('US$160.26')).toBeInTheDocument();
  });
  it('idioma y moneda cambian independientemente y volver a GTQ restaura el valor base exacto', async () => {
    mount(); const user = userEvent.setup();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Moneda de visualización' }), 'USD');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Idioma' }), 'en');
    expect(screen.getByText('US$160.26')).toBeInTheDocument();
    expect(localStorage.getItem(CURRENCY_KEY)).toBe('USD');
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('en');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Display currency' }), 'GTQ');
    expect(screen.getByText('Q1,250.00')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });
  it('ofrece un control nativo con etiqueta y foco de teclado junto al idioma', async () => {
    mount(); const user = userEvent.setup();
    await user.tab(); await user.tab();
    expect(screen.getByRole('combobox', { name: 'Moneda de visualización' })).toHaveFocus();
    expect(screen.getByRole('option', { name: 'GTQ (Q)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'USD (US$)' })).toBeInTheDocument();
  });
  it('permite elegir en memoria cuando localStorage no está disponible', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    mount(); await userEvent.setup().selectOptions(screen.getByRole('combobox', { name: 'Moneda de visualización' }), 'USD');
    expect(screen.getByText('US$160.26')).toBeInTheDocument();
  });
  it('atiende cambios de moneda de otra pestaña sin cambiar el idioma', () => {
    mount(); localStorage.setItem(CURRENCY_KEY, 'USD');
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: CURRENCY_KEY, newValue: 'USD' })));
    expect(screen.getByText('US$160.26')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Idioma' })).toHaveValue('es');
    localStorage.removeItem(CURRENCY_KEY);
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: CURRENCY_KEY, newValue: null })));
    expect(screen.getByText('Q1,250.00')).toBeInTheDocument();
  });
  it('no modifica documentos financieros al elegir USD y aclara el cobro en el resumen', async () => {
    render(<LocaleProvider><CurrencySelector /><div aria-label="Registro financiero"><AdminMoney amount={1250} /></div><ResumenCheckout resumen={{ total: 1250, saldo: 750, aprobado: 500, anticipo_requerido: 250 }} cantidadArticulos={1} /></LocaleProvider>);
    await userEvent.setup().selectOptions(screen.getByRole('combobox', { name: 'Moneda de visualización' }), 'USD');
    expect(screen.getByLabelText('Registro financiero')).toHaveTextContent('Q1,250.00');
    expect(screen.getByText('US$160.26')).toBeInTheDocument();
    expect(screen.getByText(/El cobro se procesa en GTQ/)).toBeInTheDocument();
    expect(screen.getByText('US$96.15')).toBeInTheDocument();
  });
  it('no cambia campos o datos de formularios al seleccionar una moneda', () => {
    function Form() { const { currency } = useLocale(); return <><CurrencySelector /><input aria-label="Comensales" defaultValue="4" /><output>{currency}</output></>; }
    render(<LocaleProvider><Form /></LocaleProvider>);
    fireEvent.change(screen.getByLabelText('Comensales'), { target: { value: '7' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'USD' } });
    expect(screen.getByLabelText('Comensales')).toHaveValue('7');
  });
});
