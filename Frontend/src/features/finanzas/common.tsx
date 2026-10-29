import { formatDisplayMoney } from '@/lib/money';
import { cn } from '@/lib/cn';
import { useLocale } from '@/i18n/LocaleContext';
import { useTextosFinanzas } from './textos';

/**
 * Importe tal como se registró: en quetzales sin conversión de visualización
 * (los importes financieros no cambian con la preferencia de moneda del sitio)
 * y, en otra moneda, con su código.
 */
export function Amount({ amount, currency = 'GTQ', className }: { amount: unknown; currency?: string; className?: string }) {
  const { locale } = useLocale();
  let text: string;
  if (currency === 'GTQ') text = formatDisplayMoney(amount, 'GTQ') ?? '—';
  else {
    const n = Number(amount);
    text = Number.isFinite(n) && /^[A-Z]{3}$/.test(currency) ? new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-GT', { style: 'currency', currency, currencyDisplay: 'code' }).format(n) : '—';
  }
  return <span className={cn('tabular-nums', className)}>{text}</span>;
}

const PAGO_CLASES: Record<string, string> = {
  aprobado: 'border-exito-600/20 bg-exito-50 text-exito-700',
  pendiente: 'border-advertencia-600/20 bg-advertencia-50 text-advertencia-700',
  procesando: 'border-advertencia-600/20 bg-advertencia-50 text-advertencia-700',
  rechazado: 'border-error-600/20 bg-error-50 text-error-700',
  cancelado: 'border-neutro-300 bg-neutro-100 text-neutro-600',
  reembolsado: 'border-info-600/20 bg-info-50 text-info-700',
  reembolsado_parcial: 'border-info-600/20 bg-info-50 text-info-700',
};
/** Estado real del pago; uno desconocido se muestra tal cual y nunca como aprobado. */
export function EstadoPagoBadge({ estado }: { estado: string }) {
  const t = useTextosFinanzas();
  return <span className={cn('inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold', PAGO_CLASES[estado] ?? 'border-neutro-300 bg-neutro-100 text-neutro-700')}>{t.estados[estado] ?? estado}</span>;
}

export function EstadoFacturaBadge({ estado }: { estado: string }) {
  const t = useTextosFinanzas();
  const cls = estado === 'pagada' ? 'border-exito-600/20 bg-exito-50 text-exito-700' : estado === 'anulada' ? 'border-error-600/20 bg-error-50 text-error-700' : 'border-advertencia-600/20 bg-advertencia-50 text-advertencia-700';
  return <span className={cn('inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold', cls)}>{t.estadosF[estado] ?? estado}</span>;
}

/** Referencia del proveedor de pago enmascarada: solo los últimos caracteres. */
export const maskReference = (value: string | null | undefined) => (value ? `…${value.slice(-8)}` : '—');

/** Fecha (AAAA-MM-DD) y fecha y hora en la zona del hotel. */
export const hotelDay = (value: string | null | undefined) => value ? new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value)) : '';
export const hotelDateTime = (value: string | null | undefined, locale: string) => value ? new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-GT', { timeZone: 'America/Guatemala', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
export const hotelDate = (value: string | null | undefined, locale: string) => value ? new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-GT', { timeZone: 'America/Guatemala', dateStyle: 'medium' }).format(new Date(value)) : '—';
