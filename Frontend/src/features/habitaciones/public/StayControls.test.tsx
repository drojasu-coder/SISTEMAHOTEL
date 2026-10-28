import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageSelector, LocaleProvider } from '@/i18n/LocaleContext';
import { StayDateRange } from './StayDateRange';
import { GuestCount } from './GuestCount';
import { readStayDraft, saveStayDraft } from './stayDraft';
import { roomReservationHref } from './roomSearch';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-28T05:30:00Z')); // Sigue siendo 27 en Guatemala.
  sessionStorage.clear(); localStorage.clear();
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
function Dates({ empty = false }: { empty?: boolean }) {
  const [range, setRange] = useState({ fecha_entrada: empty ? '' : '2026-11-10', fecha_salida: empty ? '' : '2026-11-12' });
  return <LocaleProvider><LanguageSelector /><StayDateRange value={range} onChange={setRange} /></LocaleProvider>;
}
async function day(iso: string) {
  const button = screen.getByRole('dialog').querySelector<HTMLButtonElement>(`[data-day="${iso}"]:not([data-outside]) button`)!;
  expect(button).not.toBeNull();
  await userEvent.setup().click(button);
}

describe('Estancia visual y huéspedes', () => {
  it('expone un solo control de estancia; selecciona un rango visual y conserva la otra fecha al editar', async () => {
    render(<Dates />); const user = userEvent.setup();
    expect(screen.queryByLabelText('Fecha de entrada (check-in)')).not.toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: /Fechas de estancia/ });
    expect(trigger).toHaveTextContent('2 noches'); await user.click(trigger);
    expect(screen.getByRole('dialog').querySelectorAll('.rdp-month')).toHaveLength(2);
    await day('2026-11-11'); // Cambia llegada, conserva salida 12.
    expect(within(screen.getByRole('dialog')).getByText(/1 noche/)).toBeInTheDocument();
    await day('2026-11-14');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Usar este rango' }));
    expect(trigger).toHaveTextContent('11 nov 2026'); expect(trigger).toHaveTextContent('14 nov 2026'); expect(trigger).toHaveTextContent('3 noches');
    expect(trigger).toHaveFocus();
  });
  it('usa hoy en Guatemala, impide fechas pasadas y salida igual o anterior, sin bloquear inventario', async () => {
    render(<Dates empty />); await userEvent.setup().click(screen.getByRole('button', { name: /Fechas de estancia/ }));
    const past = screen.getByRole('dialog').querySelector<HTMLButtonElement>('[data-day="2026-10-26"] button')!;
    expect(past).toBeDisabled();
    await day('2026-10-27');
    expect(screen.getByRole('dialog').querySelector('[data-day="2026-10-27"] button')).toHaveAttribute('aria-disabled', 'true');
    await day('2026-10-27');
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Usar este rango' })).toBeDisabled();
    await day('2026-10-28');
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Usar este rango' })).toBeEnabled();
    expect(screen.getByText(/El calendario permite elegir fechas/)).toBeInTheDocument();
  });
  it('adapta a un mes, permite teclado y Escape y devuelve el foco; traduce controles sin perder el rango', async () => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList);
    render(<Dates />); const user = userEvent.setup(); const trigger = screen.getByRole('button', { name: /Fechas de estancia/ });
    await user.click(trigger);
    expect(screen.getByRole('dialog').querySelectorAll('.rdp-month')).toHaveLength(1);
    const selected = screen.getByRole('dialog').querySelector<HTMLButtonElement>('[data-day="2026-11-10"] button')!;
    selected.focus(); await user.keyboard('{ArrowRight}'); expect(document.activeElement).not.toBe(selected);
    await user.keyboard('{Escape}'); expect(trigger).toHaveFocus();
    await user.selectOptions(screen.getByLabelText('Idioma'), 'en');
    expect(screen.getByRole('button', { name: /Stay dates/ })).toHaveTextContent('Nov 10, 2026');
    await user.click(screen.getByRole('button', { name: /Stay dates/ }));
    expect(screen.getByRole('dialog').querySelector('.rdp-root')).toHaveAttribute('lang', 'en');
    await user.click(within(screen.getByRole('dialog')).getByText('Enter dates with the keyboard'));
    fireEvent.change(screen.getByLabelText('Departure date (check-out)'), { target: { value: '2026-11-09' } });
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Use this range' })).toBeDisabled();
  });
  it('cuenta huéspedes con botones, respeta mínimo uno y no inventa un máximo de seis', async () => {
    function Guests() { const [value, set] = useState('1'); return <GuestCount value={value} onChange={set} label="Huéspedes" />; }
    render(<Guests />); const user = userEvent.setup();
    expect(screen.getByRole('button', { name: 'Disminuir huéspedes' })).toBeDisabled();
    for (let index = 0; index < 6; index++) await user.click(screen.getByRole('button', { name: 'Aumentar huéspedes' }));
    expect(screen.getByLabelText('Huéspedes')).toHaveValue(7);
    fireEvent.change(screen.getByLabelText('Huéspedes'), { target: { value: '-1' } });
    expect(screen.getByLabelText('Huéspedes')).toHaveValue(7);
    await user.click(screen.getByRole('button', { name: 'Disminuir huéspedes' }));
    expect(screen.getByLabelText('Huéspedes')).toHaveValue(6);
  });
  it('mantiene Tab dentro del diálogo incluso cuando todavía no se puede aplicar el rango', async () => {
    render(<Dates empty />); const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /^Fechas de estancia/ }));
    const dialog = screen.getByRole('dialog');
    const manual = within(dialog).getByRole('button', { name: 'Introducir fechas con teclado' });
    manual.focus();
    await user.keyboard('{Tab}');
    expect(within(dialog).getByRole('button', { name: 'Cerrar modal' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: /^Fechas de estancia/ })).toHaveFocus();
  });
  it('transfiere criterios al recorrido único, prioriza el enlace y no guarda sede ni importes', () => {
    saveStayDraft({ fecha_entrada: '2026-11-10', fecha_salida: '2026-11-12', numero_huespedes: '3' });
    const href = roomReservationHref(new URLSearchParams('numero_huespedes=2&total=1'), 1, { id: 7, tipo: { id: 2 } });
    expect(href).toContain('fecha_entrada=2026-11-10'); expect(href).toContain('numero_huespedes=2'); expect(href).not.toContain('total');
    expect(readStayDraft()).toEqual({ fecha_entrada: '2026-11-10', fecha_salida: '2026-11-12', numero_huespedes: '3' });
  });
});
