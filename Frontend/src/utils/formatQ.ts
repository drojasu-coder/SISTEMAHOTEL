const formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formatea un monto en moneda local (quetzales, Q) con dos decimales.
 * Lanza RangeError si el valor no es finito (garantiza que el backend es
 * quien calcula y valida los valores financieros, nunca el cliente).
 */
export function formatQ(amount: number): string {
  if (!Number.isFinite(amount)) {
    throw new RangeError('El monto debe ser un número finito');
  }
  return `Q${formatter.format(amount)}`;
}
