import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet } from 'lucide-react';
import { ApiError } from '@/api/client/http';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';
import { Table, type Column } from '@/components/ui/Table';
import { useAuth } from '@/features/auth/AuthContext';
import { useUrlFilters } from '@/features/personal/useUrlFilters';
import { useLocale } from '@/i18n/LocaleContext';
import { reportesApi } from './reportesApi';
import { reportText } from './textos';
import { usePanoramaText } from './textosPanorama';
import { reportStates, type ReportFilters, type ReportKind, type ReportRecord, type ReportState } from './types';

const showDate = (value: string) => value.split('-').reverse().join('/');
const field = 'h-10 rounded-lg border border-neutro-300 bg-white px-3 text-sm text-neutro-900 focus:border-bronce-600 focus:outline-none focus:ring-2 focus:ring-bronce-600/30';

/** Tabla de origen paginada con filtro de estado en la URL y descargas PDF/Excel del mismo filtro. */
export function DetalleReporte({ kinds, filters }: { kinds: readonly ReportKind[]; filters: Pick<ReportFilters, 'desde' | 'hasta' | 'sucursal_id'> }) {
  const { locale } = useLocale();
  const text = reportText(locale);
  const p = usePanoramaText();
  const { user } = useAuth();
  const { params, update } = useUrlFilters();
  const requested = params.get('reporte') as ReportKind | null;
  const kind = requested && kinds.includes(requested) ? requested : kinds[0];
  const estadoParam = params.get('estado');
  const estado = (reportStates[kind] as readonly string[]).includes(estadoParam ?? '') ? estadoParam as ReportState : undefined;
  const page = Math.max(1, Number(params.get('pagina')) || 1);
  const [downloading, setDownloading] = useState<'pdf' | 'xlsx' | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const applied: ReportFilters = { ...filters, estado };
  const query = useQuery({
    queryKey: ['reportes-detalle', kind, user?.id, applied, page], queryFn: ({ signal }) => reportesApi.consultar(applied, page, signal, kind),
    retry: false, refetchOnWindowFocus: false, gcTime: 0,
  });
  const report = query.data;
  const money = (n: number) => `Q${n.toLocaleString(locale === 'en' ? 'en-US' : 'es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const stateLabel = (s: string) => text[s as ReportState] ?? p.estadosGen[s] ?? s;
  const room = report?.reporte === 'reservas-habitaciones' ? report : null;
  const operational = report && report.reporte !== 'reservas-habitaciones' ? report : null;
  const total = room?.resumen.reservas ?? operational?.resumen.registros ?? 0;

  async function download(formato: 'pdf' | 'xlsx') {
    if (!report || downloading) return;
    setDownloading(formato); setMessage(null);
    try {
      await reportesApi.descargar({ desde: report.filtros.desde, hasta: report.filtros.hasta, sucursal_id: report.filtros.sucursal_id ?? undefined, estado: report.filtros.estado ?? undefined }, formato, report.reporte);
      setMessage({ ok: true, text: text.downloaded });
    } catch (error) { setMessage({ ok: false, text: error instanceof ApiError && error.code === 'REPORT_TOO_LARGE' ? error.message : text.downloadError }); }
    finally { setDownloading(null); }
  }
  const roomColumns: Column<Omit<ReportRecord, 'id'> & { id: string }>[] = [
    { key: 'id', label: text.id, render: r => `#${r.id}` }, { key: 'sede', label: text.site, render: r => r.sede }, { key: 'habitacion', label: text.room, render: r => r.habitacion },
    { key: 'tipo', label: text.type, render: r => r.tipo_habitacion }, { key: 'entrada', label: text.entry, render: r => showDate(r.fecha_entrada) }, { key: 'salida', label: text.exit, render: r => showDate(r.fecha_salida) },
    { key: 'estado', label: text.state, render: r => <span className="inline-flex rounded-full bg-neutro-100 px-2.5 py-1 text-xs font-medium">{stateLabel(r.estado)}</span> },
    { key: 'huespedes', label: text.guests, render: r => r.huespedes }, { key: 'noches', label: text.nights, render: r => r.noches_periodo },
    { key: 'importe', label: text.amount, render: r => <span className="whitespace-nowrap font-semibold tabular-nums">{money(r.importe_reservado)}</span> },
  ];
  return (
    <section aria-label={p.detalle} className="space-y-3 rounded-xl border border-neutro-200 bg-white p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="font-sans text-base font-semibold text-neutro-900">{p.detalle}</h2>
          <p className="text-xs text-neutro-500">{room ? text.criterion : text.operationalCriterion}</p></div>
        <div className="flex flex-wrap items-end gap-2">
          {kinds.length > 1 && <label className="text-xs text-neutro-600"><span className="sr-only">{p.detalleReporte}</span>
            <select aria-label={p.detalleReporte} className={field} value={kind} onChange={e => update({ reporte: e.target.value, estado: null })}>{kinds.map(k => <option key={k} value={k}>{text[k]}</option>)}</select></label>}
          <label className="text-xs text-neutro-600"><span className="sr-only">{p.estado}</span>
            <select aria-label={p.estado} className={field} value={estado ?? ''} onChange={e => update({ estado: e.target.value || null })}><option value="">{p.todosEstados}</option>{reportStates[kind].map(s => <option key={s} value={s}>{stateLabel(s)}</option>)}</select></label>
          <Button variant="secondary" size="sm" disabled={!report || query.isFetching || downloading !== null || total > 10000} isLoading={downloading === 'pdf'} onClick={() => void download('pdf')}><Download className="size-4" aria-hidden />PDF</Button>
          <Button variant="secondary" size="sm" disabled={!report || query.isFetching || downloading !== null || total > 10000} isLoading={downloading === 'xlsx'} onClick={() => void download('xlsx')}><FileSpreadsheet className="size-4" aria-hidden />Excel</Button>
        </div>
      </div>
      {message && <Alert tone={message.ok ? 'success' : 'error'}>{message.text}</Alert>}
      {query.isFetching && !report && <LoadingNotice label={p.cargando} />}
      {query.isError && <Alert tone="error" title={p.error}><Button variant="secondary" size="sm" onClick={() => void query.refetch()}>{p.reintentar}</Button></Alert>}
      {report && !query.isError && <div aria-busy={query.isFetching} className="space-y-3">
        {room && <dl className="grid grid-cols-2 gap-2 lg:grid-cols-4">{[[text.reservations, room.resumen.reservas], [text.nights, room.resumen.noches_periodo], [text.cancelled, room.resumen.canceladas], [text.amount, money(room.resumen.importe_reservado)]].map(([l, v]) =>
          <div key={String(l)} className="rounded-lg border border-neutro-200 px-3 py-2"><dt className="text-xs text-neutro-500">{l}</dt><dd className="text-lg font-semibold tabular-nums">{v}</dd></div>)}</dl>}
        {operational && <dl className="grid grid-cols-2 gap-2 lg:grid-cols-4">{operational.metricas.map(m => <div key={m.clave} className="rounded-lg border border-neutro-200 px-3 py-2">
          <dt className="text-xs text-neutro-500">{locale === 'en' ? m.etiqueta_en : m.etiqueta}</dt><dd className="text-lg font-semibold tabular-nums">{m.formato === 'importe' ? money(operational.resumen[m.clave]) : operational.resumen[m.clave]}</dd></div>)}</dl>}
        <p className="text-xs leading-relaxed text-neutro-500">{room ? `${text.moneyNote} ${text.guestsNote}` : locale === 'en' ? operational?.nota_en : operational?.nota}</p>
        <div className="overflow-hidden">
          {room && (room.registros.length ? <Table rows={room.registros.map(r => ({ ...r, id: String(r.id) }))} columns={roomColumns} caption={text['reservas-habitaciones']} /> : <p role="status" className="rounded-xl border border-dashed border-neutro-300 py-8 text-center text-sm text-neutro-500">{text.empty}</p>)}
          {operational && (operational.registros.length ? <Table<Record<string, string | number | null> & { id: string }> rows={operational.registros.map(r => ({ ...r, id: r.referencia }))} caption={text[operational.reporte]}
            columns={operational.columnas.map(c => ({ key: c.clave, label: locale === 'en' ? c.etiqueta_en : c.etiqueta, render: r => { const v = r[c.clave]; return v == null ? '—' : c.formato === 'importe' ? money(Number(v)) : c.formato === 'fecha' ? showDate(String(v)) : c.clave === 'estado' ? stateLabel(String(v)) : c.clave === 'tipo_servicio' ? text[v as 'experiencia' | 'alquiler' | 'bienestar'] ?? String(v) : String(v); } }))} />
            : <p role="status" className="rounded-xl border border-dashed border-neutro-300 py-8 text-center text-sm text-neutro-500">{text.operationalEmpty}</p>)}
        </div>
        <Pagination page={report.paginacion.pagina} totalPages={report.paginacion.total_paginas} onChange={n => update({ pagina: String(n) })} disabled={query.isFetching || downloading !== null} labels={{ page: text.page, of: text.of, previous: text.previous, next: text.next }} />
        <p className="text-xs text-neutro-500">{total > 10000 ? text.operationalLimit : text.operationalExport}</p>
      </div>}
    </section>
  );
}
