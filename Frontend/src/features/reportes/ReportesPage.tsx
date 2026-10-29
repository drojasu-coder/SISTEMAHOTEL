import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { LoadingNotice } from '@/components/ui/Feedback';
import { useAdminScope } from '@/features/admin-core/AdminScopeContext';
import { useAuth } from '@/features/auth/AuthContext';
import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { useUrlFilters } from '@/features/personal/useUrlFilters';
import { useLocale } from '@/i18n/LocaleContext';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { cn } from '@/lib/cn';
import { BarList, LineChart, daysBetween, type FilaBarra } from './charts';
import { DetalleReporte } from './DetalleReporte';
import { consultarPanorama, type EstadoConteo, type Panorama } from './panorama';
import { usePanoramaText, type TextosPanorama } from './textosPanorama';

const SECCIONES = ['resumen', 'habitaciones', 'restaurante', 'servicios', 'finanzas'] as const;
type Seccion = typeof SECCIONES[number];
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const shift = (iso: string, days: number) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };
const field = 'h-10 rounded-lg border border-neutro-300 bg-white px-3 text-sm text-neutro-900 focus:border-bronce-600 focus:outline-none focus:ring-2 focus:ring-bronce-600/30';
const BARRA_ESTADO: Record<string, string> = { aprobado: 'bg-exito-600', confirmada: 'bg-exito-600', finalizada: 'bg-info-600', completada: 'bg-info-600', usada: 'bg-info-600', pendiente: 'bg-advertencia-600', procesando: 'bg-advertencia-600', cotizacion: 'bg-advertencia-600', rechazado: 'bg-error-600', cancelada: 'bg-neutro-400', cancelado: 'bg-neutro-400', expirada: 'bg-neutro-400', anulada: 'bg-neutro-400', reembolsado: 'bg-info-600', reembolsado_parcial: 'bg-info-600' };

/** La sesión del panel se verifica primero; ninguna consulta se monta para otros roles. */
export function ReportesPage() {
  const { user } = useAuth();
  return user?.rol === 'admin' ? <Reportes /> : <ForbiddenPage />;
}

function Reportes() {
  const p = usePanoramaText();
  const { locale } = useLocale();
  const { selectedSedeId, sedes } = useAdminScope();
  const { params, update } = useUrlFilters();
  const today = getTodayInGuatemala();
  const rawDesde = params.get('desde') ?? '', rawHasta = params.get('hasta') ?? '';
  const desde = ISO.test(rawDesde) ? rawDesde : `${today.slice(0, 7)}-01`;
  const hasta = ISO.test(rawHasta) ? rawHasta : today;
  const dias = daysBetween(desde, hasta);
  const valido = dias >= 1 && dias <= 366;
  const seccion = (SECCIONES as readonly string[]).includes(params.get('seccion') ?? '') ? params.get('seccion') as Seccion : 'resumen';
  const sucursal = selectedSedeId === 'all' ? undefined : selectedSedeId;
  const sedeNombre = sucursal ? sedes.find(s => s.id === sucursal)?.nombre ?? `#${sucursal}` : p.todasSedes;
  const query = useQuery({
    queryKey: ['reportes-panorama', desde, hasta, sucursal], queryFn: ({ signal }) => consultarPanorama({ desde, hasta, sucursal_id: sucursal }, signal),
    enabled: valido, retry: false, refetchOnWindowFocus: false,
  });
  const fmtDate = (k: string, monthly: boolean) => monthly ? new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-GT', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(new Date(`${k}-01T00:00:00Z`)) : k.slice(8) + '/' + k.slice(5, 7);
  const presets: { id: keyof TextosPanorama['presets']; range: [string, string] }[] = [
    { id: 'mes', range: [`${today.slice(0, 7)}-01`, today] }, { id: 'ultimos30', range: [shift(today, -29), today] },
    { id: 'proximos30', range: [today, shift(today, 29)] }, { id: 'anio', range: [`${today.slice(0, 4)}-01-01`, today] },
  ];
  const base = { desde, hasta };
  return (
    <div className="space-y-5">
      <header><p className="text-xs font-medium text-neutro-500">{p.categoria}</p><h1 className="font-sans text-2xl font-semibold text-neutro-900">{p.titulo}</h1></header>
      <div className="space-y-3 rounded-xl border border-neutro-200 bg-white p-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-neutro-600">{p.desde}<input type="date" className={cn(field, 'mt-1 block')} value={desde} max={hasta} onChange={e => update({ desde: e.target.value || null })} /></label>
          <label className="text-xs text-neutro-600">{p.hasta}<input type="date" className={cn(field, 'mt-1 block')} value={hasta} min={desde} onChange={e => update({ hasta: e.target.value || null })} /></label>
          <div role="group" aria-label={p.periodo} className="flex flex-wrap gap-2">{presets.map(({ id, range }) => {
            const active = range[0] === desde && range[1] === hasta;
            return <Button key={id} type="button" size="sm" variant={active ? 'primary' : 'secondary'} aria-pressed={active} onClick={() => update({ desde: range[0], hasta: range[1] })}>{p.presets[id]}</Button>;
          })}</div>
        </div>
        <p className="text-xs text-neutro-500">{p.sedeLabel(sedeNombre)} · {p.zona}</p>
        {!valido && <p role="alert" className="text-xs font-medium text-error-700">{p.fechasInvalidas}</p>}
      </div>
      <nav aria-label={p.navLabel} className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {SECCIONES.map(s => <button key={s} type="button" aria-current={s === seccion ? 'page' : undefined}
          onClick={() => update({ seccion: s === 'resumen' ? null : s, estado: null, reporte: null })}
          className={cn('whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors', s === seccion ? 'border-bronce-600 bg-bronce-600 text-white' : 'border-neutro-300 bg-white text-neutro-700 hover:bg-neutro-50')}>{p.secciones[s]}</button>)}
      </nav>
      {valido && (query.isLoading ? <LoadingNotice label={p.cargando} />
        : query.isError || !query.data ? <div role="alert" className="rounded-xl border border-error-600/20 bg-error-50 p-4 text-sm text-error-700">{p.error} <Button variant="secondary" size="sm" onClick={() => void query.refetch()}>{p.reintentar}</Button></div>
        : <Contenido seccion={seccion} data={query.data} base={base} sucursal={sucursal} fmtDate={fmtDate} />)}
    </div>
  );
}

function Contenido({ seccion, data, base, sucursal, fmtDate }: { seccion: Seccion; data: Panorama; base: { desde: string; hasta: string }; sucursal?: number; fmtDate: (k: string, m: boolean) => string }) {
  const p = usePanoramaText();
  const { locale } = useLocale();
  const nf = (n: number) => n.toLocaleString(locale === 'en' ? 'en-US' : 'es-GT');
  const money = (n: number) => `Q${n.toLocaleString(locale === 'en' ? 'en-US' : 'es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const moneyAxis = (n: number) => `Q${n.toLocaleString(locale === 'en' ? 'en-US' : 'es-GT', { maximumFractionDigits: 0 })}`;
  const chartLabels = { empty: p.vacio, table: p.tabla, period: p.periodo, total: p.colTotal, monthly: p.agrupadoMes };
  const q = `desde=${base.desde}&hasta=${base.hasta}`;
  const est = (e: string) => p.estadosGen[e] ?? e;
  const sum = (rows: { valor: number }[]) => rows.reduce((s, r) => s + r.valor, 0);
  const barrasEstado = (rows: EstadoConteo[], href?: (estado: string) => string): FilaBarra[] => rows.map(r => ({ clave: r.estado, etiqueta: est(r.estado), valor: r.valor, clase: BARRA_ESTADO[r.estado], href: href?.(r.estado) }));
  const h = data.habitaciones, s = data.servicios, f = data.finanzas;

  if (seccion === 'resumen') {
    const filas: { id: keyof TextosPanorama['modulos']; rows: EstadoConteo[]; to: string }[] = [
      { id: 'habitaciones', rows: h.estados_en_periodo.map(r => ({ estado: r.estado, valor: r.reservas })), to: '/admin/reservas?vista=todas' },
      { id: 'restaurante', rows: s.restaurante, to: '/admin/reservas-restaurante?vista=todas' }, { id: 'actividades', rows: s.actividades, to: '/admin/reservas-actividades?vista=todas' },
      { id: 'bienestar', rows: s.bienestar, to: '/admin/citas-spa?vista=historial' }, { id: 'eventos', rows: s.eventos, to: '/admin/reservas-evento?vista=historial' }, { id: 'amenidades', rows: s.amenidades, to: '/admin/reservas-amenidades' },
    ];
    return <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <LineChart titulo={p.creadasTitulo} descripcion={p.creadasDesc} desde={base.desde} hasta={base.hasta} formato={nf} etiquetaFecha={fmtDate} labels={chartLabels} series={[{ clave: 'c', etiqueta: p.reservas, datos: h.creadas_por_dia, clase: 'text-bronce-600' }]} />
        <LineChart titulo={p.cobradoTitulo} descripcion={p.cobradoDesc} desde={base.desde} hasta={base.hasta} formato={money} formatoEje={moneyAxis} etiquetaFecha={fmtDate} labels={chartLabels} series={[{ clave: 'g', etiqueta: p.cobrado, datos: f.cobrado_por_dia.map(x => ({ fecha: x.fecha, valor: x.valor })), clase: 'text-exito-600' }]} />
      </div>
      <section aria-label={p.resumenTabla} className="rounded-xl border border-neutro-200 bg-white p-4">
        <h2 className="font-sans text-sm font-semibold text-neutro-900">{p.resumenTabla}</h2><p className="text-xs text-neutro-500">{p.resumenTablaDesc}</p>
        <div className="mt-3 hidden overflow-x-auto md:block"><table className="w-full text-left text-sm">
          <thead className="text-xs text-neutro-500"><tr>{[p.colModulo, p.colBase, p.colTotal, p.colConfirmadas, p.colCanceladas, p.colOtras, ''].map((c, i) => <th key={i} scope="col" className="px-3 py-2 font-medium">{c || <span className="sr-only">{p.verRegistros}</span>}</th>)}</tr></thead>
          <tbody className="divide-y divide-neutro-100">{filas.map(({ id, rows, to }) => { const total = sum(rows), conf = rows.find(r => r.estado === 'confirmada')?.valor ?? 0, canc = rows.find(r => r.estado === 'cancelada')?.valor ?? 0;
            return <tr key={id}><th scope="row" className="px-3 py-2.5 font-medium text-neutro-900">{p.modulos[id]}</th><td className="px-3 py-2.5 text-xs text-neutro-600">{p.baseModulo[id]}</td>
              <td className="px-3 py-2.5 tabular-nums font-semibold">{nf(total)}</td><td className="px-3 py-2.5 tabular-nums">{nf(conf)}</td><td className="px-3 py-2.5 tabular-nums">{nf(canc)}</td><td className="px-3 py-2.5 tabular-nums">{nf(total - conf - canc)}</td>
              <td className="px-3 py-2.5"><Link to={to} className="whitespace-nowrap text-xs font-semibold text-bronce-700 underline">{p.verRegistros}</Link></td></tr>; })}</tbody></table></div>
        <ul className="mt-3 space-y-2 md:hidden">{filas.map(({ id, rows, to }) => { const total = sum(rows), conf = rows.find(r => r.estado === 'confirmada')?.valor ?? 0, canc = rows.find(r => r.estado === 'cancelada')?.valor ?? 0;
          return <li key={id} className="rounded-lg border border-neutro-200 p-3 text-sm"><div className="flex justify-between gap-2"><span className="font-semibold">{p.modulos[id]}</span><span className="font-semibold tabular-nums">{nf(total)}</span></div>
            <p className="text-xs text-neutro-500">{p.baseModulo[id]}</p><p className="mt-1 text-xs text-neutro-600">{p.colConfirmadas}: {nf(conf)} · {p.colCanceladas}: {nf(canc)} · {p.colOtras}: {nf(total - conf - canc)}</p>
            <Link to={to} className="mt-1 inline-block text-xs font-semibold text-bronce-700 underline">{p.verRegistros}</Link></li>; })}</ul>
      </section>
    </div>;
  }
  if (seccion === 'habitaciones') {
    return <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <LineChart titulo={p.creadasTitulo} descripcion={p.creadasDesc} desde={base.desde} hasta={base.hasta} formato={nf} etiquetaFecha={fmtDate} labels={chartLabels} series={[{ clave: 'c', etiqueta: p.reservas, datos: h.creadas_por_dia, clase: 'text-bronce-600' }]} />
        <LineChart titulo={p.llegadasTitulo} descripcion={p.llegadasDesc} desde={base.desde} hasta={base.hasta} formato={nf} etiquetaFecha={fmtDate} labels={chartLabels}
          series={[{ clave: 'l', etiqueta: p.llegadas, datos: h.llegadas_por_dia, clase: 'text-bronce-600' }, { clave: 's', etiqueta: p.salidas, datos: h.salidas_por_dia, clase: 'text-info-600', dash: '5 4' }]} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <BarList titulo={p.estadosTitulo} descripcion={p.estadosDesc} vacio={p.vacio} enlace={p.verRegistros} filas={h.estados_en_periodo.map(r => ({ clave: r.estado, etiqueta: est(r.estado), valor: r.reservas, clase: BARRA_ESTADO[r.estado], nota: money(r.importe), href: `/admin/reservas?vista=todas&estado=${r.estado}` }))} />
        {!sucursal && h.por_sede.length > 0 ? <BarList titulo={p.sedesTitulo} descripcion={p.sedesDesc} vacio={p.vacio} enlace={p.verRegistros} filas={h.por_sede.map(r => ({ clave: String(r.sucursal_id), etiqueta: r.sede, valor: r.reservas, texto: p.reservasN(r.reservas), nota: money(r.importe_vigente) }))} />
          : <BarList titulo={p.fisicoTitulo} descripcion={p.fisicoDesc} vacio={p.vacio} enlace={p.verRegistros} filas={h.estado_fisico_actual.map(r => ({ clave: r.estado, etiqueta: est(r.estado), valor: r.habitaciones, texto: p.habitacionesN(r.habitaciones) }))} />}
      </div>
      {!sucursal && h.por_sede.length > 0 && <BarList titulo={p.fisicoTitulo} descripcion={p.fisicoDesc} vacio={p.vacio} enlace={p.verRegistros} filas={h.estado_fisico_actual.map(r => ({ clave: r.estado, etiqueta: est(r.estado), valor: r.habitaciones, texto: p.habitacionesN(r.habitaciones) }))} />}
      <p className="text-xs text-neutro-500">{p.histNota}</p>
      <DetalleReporte kinds={['reservas-habitaciones']} filters={{ ...base, sucursal_id: sucursal }} />
    </div>;
  }
  if (seccion === 'restaurante') {
    return <div className="space-y-4">
      <BarList titulo={p.modulos.restaurante} descripcion={p.serviciosNota} vacio={p.vacio} enlace={p.verRegistros} filas={barrasEstado(s.restaurante, e => `/admin/reservas-restaurante?vista=todas&estado=${e}`)} />
      <DetalleReporte kinds={['reservas-restaurante']} filters={{ ...base, sucursal_id: sucursal }} />
    </div>;
  }
  if (seccion === 'servicios') {
    return <div className="space-y-4">
      <p className="text-xs text-neutro-500">{p.serviciosNota}</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <BarList titulo={p.modulos.actividades} vacio={p.vacio} enlace={p.verRegistros} filas={barrasEstado(s.actividades, e => `/admin/reservas-actividades?vista=todas&estado=${e}`)} />
        <BarList titulo={p.modulos.bienestar} vacio={p.vacio} enlace={p.verRegistros} filas={barrasEstado(s.bienestar)} />
        <BarList titulo={p.modulos.eventos} vacio={p.vacio} enlace={p.verRegistros} filas={barrasEstado(s.eventos)} />
        <BarList titulo={p.modulos.amenidades} descripcion={p.amenidadesSinDetalle} vacio={p.vacio} enlace={p.verRegistros} filas={barrasEstado(s.amenidades)} />
      </div>
      <DetalleReporte kinds={['actividades-bienestar', 'cotizaciones-eventos']} filters={{ ...base, sucursal_id: sucursal }} />
    </div>;
  }
  const cobrado = sum(f.cobrado_por_dia), aprob = f.pagos_por_estado.find(r => r.estado === 'aprobado');
  const enProceso = f.pagos_por_estado.filter(r => r.estado === 'pendiente' || r.estado === 'procesando').reduce((a, r) => a + r.cantidad, 0);
  const noComp = f.pagos_por_estado.filter(r => r.estado === 'rechazado' || r.estado === 'cancelado').reduce((a, r) => a + r.cantidad, 0);
  const kpi = (l: string, v: string, n = '') => <div className="rounded-xl border border-neutro-200 bg-white px-4 py-3"><p className="text-xs text-neutro-500">{l}</p><p className="mt-0.5 text-lg font-semibold tabular-nums text-neutro-900">{v}</p><p className="text-xs text-neutro-400">{n}</p></div>;
  return <div className="space-y-4">
    {sucursal && <p role="note" className="rounded-lg border border-info-600/20 bg-info-50 px-3 py-2 text-xs text-info-700">{p.sedeNoAplica}</p>}
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {kpi(p.kpi.cobrado, money(cobrado), p.kpi.cobradoNota)}{kpi(p.kpi.aprobados, nf(aprob?.cantidad ?? 0))}{kpi(p.kpi.enProceso, nf(enProceso), p.finNota.split('.')[0])}{kpi(p.kpi.noCompletados, nf(noComp))}
    </div>
    <LineChart titulo={p.cobradoTitulo} descripcion={p.cobradoDesc} desde={base.desde} hasta={base.hasta} formato={money} formatoEje={moneyAxis} etiquetaFecha={fmtDate} labels={chartLabels} series={[{ clave: 'g', etiqueta: p.cobrado, datos: f.cobrado_por_dia.map(x => ({ fecha: x.fecha, valor: x.valor })), clase: 'text-exito-600' }]} />
    <div className="grid gap-4 lg:grid-cols-2">
      <BarList titulo={p.pagosEstadoTitulo} descripcion={p.pagosEstadoDesc} vacio={p.vacio} enlace={p.verRegistros} filas={f.pagos_por_estado.map(r => ({ clave: r.estado, etiqueta: p.estadosPago[r.estado] ?? r.estado, valor: r.cantidad, clase: BARRA_ESTADO[r.estado], nota: money(r.importe), href: `/admin/pagos?estado=${r.estado}&${q}` }))} />
      <BarList titulo={p.facturasTitulo} descripcion={p.facturasDesc} vacio={p.vacio} enlace={p.verRegistros} filas={f.facturas_por_estado.map(r => ({ clave: r.estado, etiqueta: p.estadosFactura[r.estado] ?? r.estado, valor: r.cantidad, clase: BARRA_ESTADO[r.estado], nota: money(r.importe), href: `/admin/facturacion?estado=${r.estado}&${q}` }))} />
    </div>
    <section aria-label={p.reembolsosTitulo} className="rounded-xl border border-neutro-200 bg-white p-4"><h3 className="font-sans text-sm font-semibold">{p.reembolsosTitulo}</h3>
      {f.reembolsos.length === 0 ? <p role="status" className="mt-2 text-sm text-neutro-500">{p.reembolsosVacio}</p>
        : <><ul className="mt-2 space-y-1 text-sm">{f.reembolsos.map(r => <li key={r.estado} className="flex justify-between"><span>{r.estado} · {nf(r.cantidad)}</span><span className="font-semibold tabular-nums">{money(r.importe)}</span></li>)}</ul><p className="mt-2 text-xs text-advertencia-700">{p.reembolsosNota}</p></>}
    </section>
    <p className="text-xs text-neutro-500">{p.finNota}</p>
  </div>;
}
