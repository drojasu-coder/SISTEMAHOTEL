import { useId, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { DashboardTendencias } from './hooks/useAdminDashboard';
import type { dashboardText } from './dashboardText';

type Text = ReturnType<typeof dashboardText>;
type Locale = 'es' | 'en';

/**
 * Paleta de series validada (fondo blanco): orden fijo por estado, nunca por rango.
 * Las etiquetas usan tinta de texto; el color solo lo llevan las marcas.
 */
export const RESERVATION_SERIES = [
  { key: 'confirmada', color: '#9a5b22' },
  { key: 'pendiente', color: '#2a78d6' },
  { key: 'cancelada', color: '#1baf7a' },
  { key: 'otros', color: '#a8a29a' },
] as const;
const OCCUPANCY_COLOR = '#906438';

const formatDay = (locale: Locale, day: string, withYear = false) =>
  new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-GT', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}), timeZone: 'UTC' })
    .format(new Date(day + 'T00:00:00Z'));
const formatMonth = (locale: Locale, month: string, long = false) =>
  new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-GT', { month: long ? 'long' : 'short', year: long ? 'numeric' : '2-digit', timeZone: 'UTC' })
    .format(new Date(month + '-01T00:00:00Z'));
const formatPct = (locale: Locale, value: number) =>
  new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-GT', { maximumFractionDigits: 1 }).format(value) + '%';

/** Máximo de eje "limpio" (1, 2, 5 × 10ⁿ) por encima del valor más alto. */
const niceMax = (value: number, floor: number) => {
  const target = Math.max(value, floor);
  const magnitude = 10 ** Math.floor(Math.log10(target));
  const step = [1, 2, 5, 10].find((factor) => factor * magnitude >= target) ?? 10;
  return step * magnitude;
};

/** Panel de gráfica: título, subtítulo, control opcional y cuerpo. */
export function ChartPanel({ title, subtitle, control, children, className }: {
  title: string; subtitle?: string; control?: ReactNode; children: ReactNode; className?: string;
}) {
  const id = useId();
  return <section aria-labelledby={id} className={cn('min-w-0 rounded-xl border border-neutro-200 bg-white p-4 sm:p-5', className)}>
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 id={id} className="font-sans text-sm font-semibold text-neutro-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-neutro-600">{subtitle}</p>}
      </div>
      {control}
    </div>
    {children}
  </section>;
}

/** Control segmentado compacto para elegir el período de una gráfica. */
export function Segmented<T extends string | number>({ label, value, options, onChange }: {
  label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void;
}) {
  return <div role="group" aria-label={label} className="inline-flex rounded-lg bg-neutro-100 p-0.5">
    {options.map((option) => <button key={String(option.value)} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}
      className={cn('min-h-9 rounded-md px-3 text-xs font-medium transition-colors', value === option.value ? 'bg-white text-bronce-800 shadow-sm' : 'text-neutro-600 hover:text-neutro-900')}>
      {option.label}
    </button>)}
  </div>;
}

function DataTable({ summary, head, rows }: { summary: string; head: string[]; rows: (string | number)[][] }) {
  return <details className="mt-3 text-xs text-neutro-600">
    <summary className="inline-flex min-h-9 cursor-pointer items-center underline-offset-2 hover:underline">{summary}</summary>
    <div className="mt-2 max-h-60 overflow-auto rounded-md border border-neutro-200">
      <table className="w-full text-left">
        <thead className="sticky top-0 bg-neutro-50"><tr>{head.map((cell) => <th key={cell} scope="col" className="px-3 py-2 font-semibold text-neutro-700">{cell}</th>)}</tr></thead>
        <tbody className="divide-y divide-neutro-100">{rows.map((row, index) => <tr key={index}>{row.map((cell, i) => <td key={i} className={cn('px-3 py-1.5', i > 0 && 'tabular-nums')}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  </details>;
}

/** Eje Y con 3 marcas y rejilla fina; el contenido se dibuja encima. */
function Plot({ max, format, height = 176, children, labels }: {
  max: number; format: (value: number) => string; height?: number; children: ReactNode; labels: ReactNode;
}) {
  const ticks = [max, max / 2, 0];
  return <div className="flex gap-2">
    <div className="flex shrink-0 flex-col justify-between text-right text-[11px] tabular-nums text-neutro-500" style={{ height }} aria-hidden="true">
      {ticks.map((tick) => <span key={tick} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0 leading-none">{format(tick)}</span>)}
    </div>
    <div className="min-w-0 flex-1">
      <div className="relative" style={{ height }}>
        {ticks.map((tick) => <div key={tick} aria-hidden="true" className="absolute inset-x-0 border-t border-neutro-200" style={{ top: `${(1 - tick / max) * 100}%` }} />)}
        {children}
      </div>
      {labels}
    </div>
  </div>;
}

function Tooltip({ left, children }: { left: number; children: ReactNode }) {
  return <div role="status" className="pointer-events-none absolute bottom-full z-10 mb-2 w-max max-w-56 -translate-x-1/2 rounded-md bg-neutro-900 px-2.5 py-1.5 text-xs text-white shadow-soft"
    style={{ left: `clamp(4.5rem, ${left}%, calc(100% - 4.5rem))` }}>{children}</div>;
}

/** Ocupación diaria prevista (estancias confirmadas / inventario actual). */
export function OccupancyForecast({ data, total, locale, text }: { data: DashboardTendencias['ocupacion_prevista']; total: number; locale: Locale; text: Text }) {
  const [hover, setHover] = useState<number | null>(null);
  const values = data.map((day) => day.porcentaje ?? 0);
  const peak = Math.max(0, ...values);
  if (!total || peak === 0) {
    return <p role="status" className="flex h-44 items-center justify-center rounded-lg bg-neutro-50 px-4 text-center text-sm text-neutro-600">{text.forecastEmpty(data.length)}</p>;
  }
  const max = niceMax(peak, 5);
  const step = data.length > 45 ? 14 : 7;
  const peakIndex = values.indexOf(peak);
  const summary = `${text.forecastTitle}: ${formatDay(locale, data[0].fecha)} – ${formatDay(locale, data[data.length - 1].fecha)}. ${locale === 'en' ? 'Peak' : 'Máximo'} ${formatPct(locale, peak)} (${formatDay(locale, data[peakIndex].fecha)}).`;
  return <>
    <Plot max={max} format={(value) => formatPct(locale, value)} labels={
      <div className="relative mt-1.5 h-4 text-[11px] text-neutro-500" aria-hidden="true">
        {data.map((day, index) => index % step === 0 && <span key={day.fecha} className="absolute -translate-x-1/2 whitespace-nowrap first:translate-x-0" style={{ left: `${((index + 0.5) / data.length) * 100}%` }}>{formatDay(locale, day.fecha)}</span>)}
      </div>}>
      <div role="img" aria-label={summary} className="absolute inset-0 flex items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
        {data.map((day, index) => {
          const height = ((day.porcentaje ?? 0) / max) * 100;
          return <div key={day.fecha} className="flex h-full min-w-0 flex-1 items-end justify-center" onMouseEnter={() => setHover(index)}>
            <div className={cn('w-full max-w-6 rounded-t-[4px] transition-opacity', hover !== null && hover !== index && 'opacity-60')}
              style={{ height: day.habitaciones ? `max(${height}%, 3px)` : 0, background: OCCUPANCY_COLOR }} />
          </div>;
        })}
        {hover !== null && <Tooltip left={((hover + 0.5) / data.length) * 100}>
          <span className="font-semibold">{formatDay(locale, data[hover].fecha, true)}</span><br />
          {text.chartRooms(data[hover].habitaciones, total, formatPct(locale, data[hover].porcentaje ?? 0))}
        </Tooltip>}
      </div>
    </Plot>
    <DataTable summary={text.showTable} head={[text.date, text.rooms, text.occupancyPct]}
      rows={data.filter((day) => day.habitaciones > 0).map((day) => [formatDay(locale, day.fecha, true), day.habitaciones, formatPct(locale, day.porcentaje ?? 0)])} />
  </>;
}

/** Reservas registradas por mes, apiladas por estado. */
export function MonthlyReservations({ data, locale, text }: { data: DashboardTendencias['reservas_por_mes']; locale: Locale; text: Text }) {
  const [hover, setHover] = useState<number | null>(null);
  const peak = Math.max(0, ...data.map((month) => month.total));
  const labelOf = (key: typeof RESERVATION_SERIES[number]['key']) => key === 'otros' ? text.others : text[key];
  // Solo se listan los estados presentes en el período; los colores no cambian.
  const series = RESERVATION_SERIES.filter((serie) => data.some((month) => month[serie.key] > 0));
  if (peak === 0) {
    return <p role="status" className="flex h-44 items-center justify-center rounded-lg bg-neutro-50 px-4 text-center text-sm text-neutro-600">{text.monthlyEmpty}</p>;
  }
  const max = niceMax(peak, 4);
  const total = data.reduce((sum, month) => sum + month.total, 0);
  return <>
    <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutro-700">
      {series.map((serie) => <li key={serie.key} className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="size-2.5 rounded-sm" style={{ background: serie.color }} />{labelOf(serie.key)}
        <span className="tabular-nums text-neutro-500">{data.reduce((sum, month) => sum + month[serie.key], 0)}</span>
      </li>)}
    </ul>
    <Plot max={max} format={(value) => String(Math.round(value * 10) / 10)} labels={
      <div className="mt-1.5 flex gap-[2px] text-[11px] text-neutro-500" aria-hidden="true">
        {data.map((month) => <span key={month.mes} className="min-w-0 flex-1 truncate text-center">{formatMonth(locale, month.mes)}</span>)}
      </div>}>
      <div role="img" aria-label={`${text.monthlyTitle}: ${total}. ${series.map((serie) => `${labelOf(serie.key)} ${data.reduce((sum, month) => sum + month[serie.key], 0)}`).join(', ')}.`}
        className="absolute inset-0 flex items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
        {data.map((month, index) => <div key={month.mes} className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end" onMouseEnter={() => setHover(index)}>
          {month.total > 0 && <span className="mb-1 text-[11px] font-semibold tabular-nums text-neutro-700">{month.total}</span>}
          <div className={cn('flex w-full max-w-6 flex-col-reverse gap-[2px] transition-opacity', hover !== null && hover !== index && 'opacity-60')} style={{ height: `${(month.total / max) * 100}%` }}>
            {series.map((serie) => month[serie.key] > 0 && <div key={serie.key} className="w-full last:rounded-t-[4px]" style={{ flexGrow: month[serie.key], background: serie.color }} />)}
          </div>
        </div>)}
        {hover !== null && <Tooltip left={((hover + 0.5) / data.length) * 100}>
          <span className="font-semibold capitalize">{formatMonth(locale, data[hover].mes, true)}</span>
          {series.map((serie) => <span key={serie.key} className="flex items-center gap-1.5"><span className="size-2 rounded-sm" style={{ background: serie.color }} />{labelOf(serie.key)}: {data[hover][serie.key]}</span>)}
          <span className="mt-0.5 block border-t border-white/20 pt-0.5">{text.total}: {data[hover].total}</span>
        </Tooltip>}
      </div>
    </Plot>
    <DataTable summary={text.showTable} head={[text.month, ...series.map((serie) => labelOf(serie.key)), text.total]}
      rows={data.map((month) => [formatMonth(locale, month.mes, true), ...series.map((serie) => month[serie.key]), month.total])} />
  </>;
}

/** Distribución del estado físico registrado de las habitaciones (no equivale a estancias). */
export function RoomStatus({ items, total, locale }: { items: { label: string; value: number; color: string }[]; total: number; locale: Locale }) {
  const visible = items.filter((item) => item.value > 0);
  return <div>
    <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-neutro-100" role="img"
      aria-label={visible.map((item) => `${item.label}: ${item.value}`).join(', ')}>
      {visible.map((item) => <div key={item.label} style={{ flexGrow: item.value, background: item.color }} />)}
    </div>
    <ul className="mt-4 space-y-2.5">
      {items.map((item) => <li key={item.label} className="flex items-center justify-between gap-3 text-sm">
        <span className="inline-flex min-w-0 items-center gap-2 text-neutro-700"><span aria-hidden="true" className="size-2.5 shrink-0 rounded-sm" style={{ background: item.color }} />{item.label}</span>
        <span className="tabular-nums text-neutro-900"><strong className="font-semibold">{item.value}</strong>
          <span className="ml-2 inline-block w-12 text-right text-xs text-neutro-500">{total ? formatPct(locale, (item.value * 100) / total) : '—'}</span></span>
      </li>)}
    </ul>
  </div>;
}
