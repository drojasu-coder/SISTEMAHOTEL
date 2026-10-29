import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

export interface SerieLinea { clave: string; etiqueta: string; datos: { fecha: string; valor: number }[]; clase: string; dash?: string }

const addDays = (iso: string, n: number) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000) + 1;
/** Rellena los días sin datos con cero; en períodos largos agrupa por mes para mantener legible la gráfica. */
export function expandir(datos: { fecha: string; valor: number }[], desde: string, hasta: string) {
  const total = daysBetween(desde, hasta);
  const monthly = total > 92;
  const map = new Map<string, number>();
  for (const d of datos) { const k = monthly ? d.fecha.slice(0, 7) : d.fecha; map.set(k, (map.get(k) ?? 0) + d.valor); }
  const keys: string[] = [];
  if (monthly) { for (let m = desde.slice(0, 7); m <= hasta.slice(0, 7); m = addDays(`${m}-15`, 30).slice(0, 7)) keys.push(m); }
  else for (let i = 0; i < total; i++) keys.push(addDays(desde, i));
  return { monthly, puntos: keys.map(k => ({ clave: k, valor: map.get(k) ?? 0 })) };
}

/** Gráfica de líneas SVG con tooltip por cursor/teclado, leyenda y tabla equivalente. */
export function LineChart({ titulo, descripcion, series, desde, hasta, formato, formatoEje, etiquetaFecha, labels }: {
  titulo: string; descripcion?: string; series: SerieLinea[]; desde: string; hasta: string;
  formato: (n: number) => string; formatoEje?: (n: number) => string; etiquetaFecha: (k: string, monthly: boolean) => string;
  labels: { empty: string; table: string; period: string; total: string; monthly: string };
}) {
  const [hover, setHover] = useState<number | null>(null);
  const box = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(320);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const read = () => setWidth(Math.max(240, Math.round(el.clientWidth) - 34));
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(read); ro.observe(el); return () => ro.disconnect();
  }, []);
  const expanded = useMemo(() => series.map(s => ({ ...s, ...expandir(s.datos, desde, hasta) })), [series, desde, hasta]);
  const n = expanded[0]?.puntos.length ?? 0;
  const monthly = expanded[0]?.monthly ?? false;
  const max = Math.max(1, ...expanded.flatMap(s => s.puntos.map(p => p.valor)));
  const pow = 10 ** Math.floor(Math.log10(max));
  const top = max <= 4 ? Math.ceil(max) : ([1, 2, 2.5, 5, 10].map(m => m * pow).find(v => v >= max) ?? max);
  const W = width, H = 190, L = 52, R = 12, T = 10, B = 24;
  const x = (i: number) => L + (n <= 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (n - 1));
  const y = (v: number) => T + (H - T - B) * (1 - v / top);
  const empty = expanded.every(s => s.puntos.every(p => p.valor === 0));
  const ticks = [0, top / 2, top];
  const labelIdx = n <= 1 ? [0] : [0, Math.floor((n - 1) / 2), n - 1];
  const move = (clientX: number, rect: DOMRect) => { const px = ((clientX - rect.left) / rect.width) * W; setHover(n <= 1 ? 0 : Math.max(0, Math.min(n - 1, Math.round(((px - L) / (W - L - R)) * (n - 1))))); };
  return (
    <figure ref={box} className="min-w-0 overflow-hidden rounded-xl border border-neutro-200 bg-white p-4">
      <figcaption className="mb-2"><h3 className="font-sans text-sm font-semibold text-neutro-900">{titulo}</h3><p className="text-xs text-neutro-500">{descripcion}{monthly ? ` ${labels.monthly}` : ''}</p></figcaption>
      {series.length > 1 && <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutro-600">{expanded.map(s => <li key={s.clave} className="flex items-center gap-1.5"><svg width="22" height="8" aria-hidden><line x1="0" y1="4" x2="22" y2="4" strokeWidth="2.5" strokeDasharray={s.dash} className={cn('stroke-current', s.clase)} /></svg>{s.etiqueta}</li>)}</ul>}
      {empty ? <p role="status" className="rounded-lg border border-dashed border-neutro-300 p-6 text-center text-sm text-neutro-500">{labels.empty}</p> : <>
        <div className="relative">
          {hover !== null && <div role="status" className="pointer-events-none absolute right-0 top-0 z-10 rounded-md border border-neutro-200 bg-white px-2 py-1 text-xs shadow">
            <p className="font-semibold">{etiquetaFecha(expanded[0].puntos[hover].clave, monthly)}</p>
            {expanded.map(s => <p key={s.clave} className="text-neutro-600">{s.etiqueta}: <span className="font-semibold text-neutro-900">{formato(s.puntos[hover].valor)}</span></p>)}</div>}
          <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block touch-pan-y" role="img" aria-label={`${titulo}. ${labels.period}`}
            onMouseMove={e => move(e.clientX, e.currentTarget.getBoundingClientRect())} onMouseLeave={() => setHover(null)} onTouchStart={e => move(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}>
            {ticks.map(t => <g key={t}><line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className="stroke-neutro-200" strokeWidth="1" /><text x={L - 6} y={y(t) + 3} textAnchor="end" className="fill-neutro-500 text-[11px]">{(formatoEje ?? formato)(t)}</text></g>)}
            {labelIdx.map((i, k) => <text key={i} x={x(i)} y={H - 6} textAnchor={k === 0 ? 'start' : k === labelIdx.length - 1 && n > 1 ? 'end' : 'middle'} className="fill-neutro-500 text-[11px]">{etiquetaFecha(expanded[0].puntos[i].clave, monthly)}</text>)}
            {expanded.map(s => <g key={s.clave} className={s.clase}>
              <polyline fill="none" strokeWidth="2" strokeLinejoin="round" strokeDasharray={s.dash} className="stroke-current" points={s.puntos.map((p, i) => `${x(i)},${y(p.valor)}`).join(' ')} />
              {n <= 40 && s.puntos.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.valor)} r={hover === i ? 4 : 2.5} className="fill-white stroke-current" strokeWidth="2" />)}
            </g>)}
            {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} className="stroke-neutro-300" strokeDasharray="3 3" />}
          </svg>
        </div>
        <details className="mt-2 text-xs text-neutro-600"><summary className="cursor-pointer font-medium text-bronce-700">{labels.table}</summary>
          <div className="mt-2 max-h-56 overflow-auto"><table className="w-full text-left"><thead><tr><th scope="col" className="py-1 pr-3">{labels.period}</th>{expanded.map(s => <th key={s.clave} scope="col" className="py-1 pr-3">{s.etiqueta}</th>)}</tr></thead>
            <tbody>{expanded[0].puntos.map((p, i) => ({ p, i })).filter(({ i }) => expanded.some(s => s.puntos[i].valor > 0)).map(({ p, i }) => <tr key={p.clave} className="border-t border-neutro-100"><td className="py-1 pr-3">{etiquetaFecha(p.clave, monthly)}</td>{expanded.map(s => <td key={s.clave} className="py-1 pr-3 tabular-nums">{formato(s.puntos[i].valor)}</td>)}</tr>)}</tbody></table></div></details>
      </>}
    </figure>
  );
}

export interface FilaBarra { clave: string; etiqueta: string; valor: number; texto?: string; clase?: string; href?: string; nota?: string }
/** Barras horizontales con el valor siempre visible como texto (alternativa accesible integrada). */
export function BarList({ titulo, descripcion, filas, vacio, enlace }: { titulo: string; descripcion?: string; filas: FilaBarra[]; vacio: string; enlace: string }) {
  const max = Math.max(1, ...filas.map(f => f.valor));
  return (
    <section aria-label={titulo} className="rounded-xl border border-neutro-200 bg-white p-4">
      <h3 className="font-sans text-sm font-semibold text-neutro-900">{titulo}</h3>{descripcion && <p className="text-xs text-neutro-500">{descripcion}</p>}
      {filas.length === 0 ? <p role="status" className="mt-3 rounded-lg border border-dashed border-neutro-300 p-4 text-center text-sm text-neutro-500">{vacio}</p>
        : <ul className="mt-3 space-y-2.5">{filas.map(f => <li key={f.clave}>
          <div className="flex items-baseline justify-between gap-3 text-sm"><span className="min-w-0 truncate text-neutro-700">{f.etiqueta}</span>
            <span className="shrink-0 font-semibold tabular-nums text-neutro-900">{f.texto ?? f.valor}</span></div>
          <div className="mt-1 h-2 rounded-full bg-neutro-100" aria-hidden><div className={cn('h-2 rounded-full', f.clase ?? 'bg-bronce-600')} style={{ width: `${Math.max(f.valor > 0 ? 3 : 0, (f.valor / max) * 100)}%` }} /></div>
          {(f.nota || f.href) && <p className="mt-0.5 flex justify-between gap-2 text-xs text-neutro-500"><span>{f.nota}</span>{f.href && <Link to={f.href} className="shrink-0 font-semibold text-bronce-700 underline">{enlace}</Link>}</p>}
        </li>)}</ul>}
    </section>
  );
}
