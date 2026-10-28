/** Referencia de presentación. La configuración fiscal sigue perteneciendo al backend. */
export const MONEY_PRESENTATION = Object.freeze({ gtqPerUsd: 7.80 });
export function parseAmount(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim())) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}
const numberFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export type DisplayCurrency = 'GTQ' | 'USD';
/** Always receives the original GTQ amount. Conversion is presentation-only. */
export function formatDisplayMoney(value: unknown, currency: DisplayCurrency = 'GTQ', rate: number = MONEY_PRESENTATION.gtqPerUsd): string | null {
  const amount = parseAmount(value);
  if (amount === null || (currency !== 'GTQ' && currency !== 'USD')) return null;
  if (currency === 'USD' && (!Number.isFinite(rate) || rate <= 0)) return null;
  const display = currency === 'USD' ? amount / rate : amount;
  if (!Number.isFinite(display)) return null;
  return `${currency === 'USD' ? 'US$' : 'Q'}${numberFormat.format(display)}`;
}
/** Fixed GTQ formatter for processing amounts and historical financial records. */
export function formatGTQ(value: unknown): string | null {
  return formatDisplayMoney(value, 'GTQ');
}
