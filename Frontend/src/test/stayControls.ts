import { expect } from 'vitest';
import { fireEvent, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export async function openStayEditor() {
  const user = userEvent.setup();
  const trigger = await screen.findByRole('button', { name: /^(Fechas de estancia|Stay dates)/ });
  await waitFor(() => expect(trigger).toBeEnabled());
  await user.click(trigger);
  const dialog = screen.getByRole('dialog');
  await user.click(within(dialog).getByText(/^(Introducir fechas con teclado|Enter dates with the keyboard)$/));
  await screen.findByLabelText(/^(Fecha de entrada \(check-in\)|Arrival date \(check-in\))$/);
  return dialog;
}
export async function setStayDates(arrival: string, departure: string) {
  const dialog = await openStayEditor();
  fireEvent.change(within(dialog).getByLabelText(/^(Fecha de entrada \(check-in\)|Arrival date \(check-in\))$/), { target: { value: arrival } });
  fireEvent.change(within(dialog).getByLabelText(/^(Fecha de salida \(check-out\)|Departure date \(check-out\))$/), { target: { value: departure } });
  await userEvent.setup().click(within(dialog).getByRole('button', { name: /^(Usar este rango|Use this range)$/ }));
}
export async function expectStayDates(arrival: string, departure: string) {
  const dialog = await openStayEditor();
  expect(within(dialog).getByLabelText(/^(Fecha de entrada \(check-in\)|Arrival date \(check-in\))$/)).toHaveValue(arrival);
  expect(within(dialog).getByLabelText(/^(Fecha de salida \(check-out\)|Departure date \(check-out\))$/)).toHaveValue(departure);
  await userEvent.setup().keyboard('{Escape}');
}
export function changeGuestCount(value: string, label = 'Número de huéspedes') {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}
