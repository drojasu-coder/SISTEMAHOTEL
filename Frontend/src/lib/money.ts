/** Referencia de presentación. La configuración fiscal sigue perteneciendo al backend. */
export const MONEY_PRESENTATION = Object.freeze({ gtqPerUsd: 7.80 });
export function parseAmount(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim())) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}
const numberFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function formatGTQ(value: unknown): string | null {
  const amount = parseAmount(value);
  return amount === null ? null : `Q${numberFormat.format(amount)}`;
}
export function formatReferenceMoney(value: unknown, locale: 'es' | 'en', rate: number = MONEY_PRESENTATION.gtqPerUsd): string | null {
  const amount = parseAmount(value);
  if (amount === null || !Number.isFinite(rate) || rate <= 0) return null;
  const usd = amount / rate;
  if (!Number.isFinite(usd)) return null;
  const number = numberFormat;
  const space = locale === 'es' ? ' ' : '';
  return `Q${space}${number.format(amount)} · ≈ US$${space}${number.format(usd)}`;
}
