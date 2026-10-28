import { useEffect, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet, FileText, Search } from 'lucide-react';
import { ApiError } from '@/api/client/http';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DateField } from '@/components/ui/DateField';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Table, type Column } from '@/components/ui/Table';
import { useAdminScope } from '@/features/admin-core/AdminScopeContext';
import { useAuth } from '@/features/auth/AuthContext';
import { useSedesQuery } from '@/features/sedes/hooks/useSedes';
import { useLocale } from '@/i18n/LocaleContext';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { reportesApi } from './reportesApi';
import { reportText } from './textos';
import { reportKinds, reportStates, type ReportKind, type ReportFilters, type ReportRecord, type ReportState } from './types';

function currentPeriod() {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return { desde: `${today.slice(0, 7)}-01`, hasta: today };
}
const showDate = (value: string) => value.split('-').reverse().join('/');
const sameFilters = (a: ReportFilters, b: ReportFilters) => a.desde === b.desde && a.hasta === b.hasta && a.sucursal_id === b.sucursal_id && a.estado === b.estado;

/** Existing panel session guard runs first. No report query mounts for any other role. */
export function ReportesPage() {
  const { user } = useAuth();
  return user?.rol === 'admin' ? <RoomReportCenter userId={user.id} /> : <ForbiddenPage />;
}

function RoomReportCenter({ userId }: { userId: number }) {
  const { locale } = useLocale();
  const text = reportText(locale);
  const { selectedSedeId } = useAdminScope();
  const sites = useSedesQuery({ retry: false });
  const [draft, setDraft] = useState<ReportFilters>(() => ({ ...currentPeriod(), sucursal_id: selectedSedeId === 'all' ? undefined : selectedSedeId }));
  const [applied, setApplied] = useState<ReportFilters | null>(null);
  const [kind, setKind] = useState<ReportKind>('reservas-habitaciones');
  const [appliedKind, setAppliedKind] = useState<ReportKind>('reservas-habitaciones');
  const [page, setPage] = useState(1);
  const [validation, setValidation] = useState(false);
  const [downloading, setDownloading] = useState<'pdf' | 'xlsx' | null>(null);
  const [downloadMessage, setDownloadMessage] = useState<'success' | 'error' | null>(null);
  const [downloadDetail, setDownloadDetail] = useState<string | null>(null);
  useEffect(() => {
    setDraft(value => ({ ...value, sucursal_id: selectedSedeId === 'all' ? undefined : selectedSedeId }));
  }, [selectedSedeId]);
  const query = useQuery({
    queryKey: ['reportes', appliedKind, userId, applied, page],
    queryFn: ({ signal }) => reportesApi.consultar(applied!, page, signal, appliedKind), enabled: applied !== null,
    retry: false, refetchOnWindowFocus: false, gcTime: 0,
  });
  const report = query.data;
  const money = (amount: number) => `Q${amount.toLocaleString(locale === 'en' ? 'en-US' : 'es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const stateLabel = (state: string) => text[state as ReportState] ?? state;
  const dirty = applied && (!sameFilters(draft, applied) || kind !== appliedKind);
  const roomReport = report?.reporte === 'reservas-habitaciones' ? report : null;
  const operationalReport = report && report.reporte !== 'reservas-habitaciones' ? report : null;
  const totalRecords = roomReport?.resumen.reservas ?? operationalReport?.resumen.registros ?? 0;
  function submit(event: FormEvent) {
    event.preventDefault();
    const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
    const days = (Date.parse(draft.hasta) - Date.parse(draft.desde)) / 86400000 + 1;
    if (!validDate(draft.desde) || !validDate(draft.hasta) || days < 1 || days > 366) { setValidation(true); return; }
    setValidation(false);
    setDownloadMessage(null);
    if (applied && sameFilters(draft, applied) && page === 1 && kind === appliedKind) void query.refetch();
    else { setApplied({ ...draft }); setAppliedKind(kind); setPage(1); }
  }
  async function download(formato: 'pdf' | 'xlsx') {
    if (!report || query.isFetching || downloading !== null) return;
    setDownloading(formato); setDownloadMessage(null); setDownloadDetail(null);
    try {
      await reportesApi.descargar({ desde: report.filtros.desde, hasta: report.filtros.hasta,
        sucursal_id: report.filtros.sucursal_id ?? undefined, estado: report.filtros.estado ?? undefined }, formato, report.reporte);
      setDownloadMessage('success');
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) {
        setDownloadMessage('error');
        if (error instanceof ApiError && error.code === 'REPORT_TOO_LARGE') setDownloadDetail(error.message);
      }
    } finally { setDownloading(null); }
  }
  const columns: Column<Omit<ReportRecord, 'id'> & { id: string }>[] = [
    { key: 'id', label: text.id, render: row => `#${row.id}` },
    { key: 'sede', label: text.site, render: row => row.sede },
    { key: 'habitacion', label: text.room, render: row => row.habitacion },
    { key: 'tipo', label: text.type, render: row => row.tipo_habitacion },
    { key: 'entrada', label: text.entry, render: row => showDate(row.fecha_entrada) },
    { key: 'salida', label: text.exit, render: row => showDate(row.fecha_salida) },
    { key: 'estado', label: text.state, render: row => <span className="inline-flex rounded-full bg-neutro-100 px-2.5 py-1 text-xs font-medium">{stateLabel(row.estado)}</span> },
    { key: 'huespedes', label: text.guests, render: row => row.huespedes },
    { key: 'noches', label: text.nights, render: row => row.noches_periodo },
    { key: 'importe', label: text.amount, render: row => <span className="whitespace-nowrap font-semibold tabular-nums">{money(row.importe_reservado)}</span> },
  ];
  return <div className="space-y-6">
    <header className="flex items-start gap-3">
      <span className="rounded-xl bg-bronce-50 p-3 text-bronce-700"><FileText className="size-6" aria-hidden="true" /></span>
      <div><p className="text-xs font-semibold uppercase tracking-wider text-bronce-700">HOTEL HUNAHPÚ</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-neutro-900 sm:text-3xl">{text.center}</h1>
        <p className="mt-2 max-w-3xl text-sm text-neutro-600">{text.intro}</p></div>
    </header>
    <Card><form onSubmit={submit} aria-label={text.applied} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Select label={text.report} value={kind} onChange={e => { setKind(e.target.value as ReportKind); setDraft(value => ({ ...value, estado: undefined })); }}>
          {reportKinds.map(value => <option key={value} value={value}>{text[value]}</option>)}
        </Select>
        <Select label={text.site} value={draft.sucursal_id ?? 'all'} loading={sites.isLoading} onChange={e => setDraft({ ...draft, sucursal_id: e.target.value === 'all' ? undefined : Number(e.target.value) })}>
          <option value="all">{text.allSites}</option>{sites.data?.map(site => <option key={site.id} value={site.id}>{site.nombre}</option>)}
        </Select>
        <Select label={text.state} value={draft.estado ?? ''} onChange={e => setDraft({ ...draft, estado: e.target.value ? e.target.value as ReportState : undefined })}>
          <option value="">{text.allStates}</option>{reportStates[kind].map(state => <option key={state} value={state}>{stateLabel(state)}</option>)}
        </Select>
        <DateField label={text.from} value={draft.desde} required onChange={e => setDraft({ ...draft, desde: e.target.value })} />
        <DateField label={text.to} value={draft.hasta} required min={draft.desde || undefined} onChange={e => setDraft({ ...draft, hasta: e.target.value })} />
        <div className="flex items-end"><Button type="submit" className="w-full" isLoading={Boolean(applied && query.isFetching)} disabled={downloading !== null}><Search className="size-4" aria-hidden="true" />{text.consult}</Button></div>
      </div>
      <p className="text-xs text-neutro-600">{text.periodHint}</p>
      <p className="max-w-4xl text-xs leading-relaxed text-neutro-600">{kind === 'reservas-habitaciones' ? text.criterion : text.operationalCriterion}</p>
      {validation && <Alert tone="error">{text.datesError}</Alert>}
      {sites.isError && <Alert tone="warning">{text.sitesError} <Button variant="text" size="sm" onClick={() => void sites.refetch()}>{text.retry}</Button></Alert>}
    </form></Card>
    {dirty && <Alert tone="warning">{text.draft}</Alert>}
    {!applied && <Card><p className="py-8 text-center text-sm text-neutro-600">{text.initial}</p></Card>}
    {applied && query.isFetching && <LoadingNotice label={appliedKind === 'reservas-habitaciones' ? text.loading : text.operationalLoading} />}
    {query.isError && <Alert tone="error" title={text.error}><Button variant="secondary" onClick={() => void query.refetch()}>{text.retry}</Button></Alert>}
    {report && !query.isError && <section aria-label={text.results} className="space-y-4" aria-busy={query.isFetching}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h2 className="font-serif text-xl font-semibold">{text[report.reporte]}</h2>
          <p className="mt-1 text-sm text-neutro-600">{text.applied}: {report.filtros.sucursal_id === null ? text.allSites : report.sede} · {showDate(report.filtros.desde)} - {showDate(report.filtros.hasta)} · {report.filtros.estado ? stateLabel(report.filtros.estado) : text.allStates}</p>
          <p className="mt-1 text-xs text-neutro-500">{text.generated}: {new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-GT', { timeZone: 'America/Guatemala', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(report.generado))} (Guatemala)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={query.isFetching || downloading !== null || totalRecords > 10000} isLoading={downloading === 'pdf'} onClick={() => void download('pdf')}><Download className="size-4" aria-hidden="true" />{text.downloadPdf}</Button>
          <Button variant="secondary" disabled={query.isFetching || downloading !== null || totalRecords > 10000} isLoading={downloading === 'xlsx'} onClick={() => void download('xlsx')}><FileSpreadsheet className="size-4" aria-hidden="true" />{text.downloadExcel}</Button>
        </div>
      </div>
      <p className="text-xs text-neutro-600">{roomReport ? (totalRecords > 10000 ? text.limit : text.exportHint) : (totalRecords > 10000 ? text.operationalLimit : text.operationalExport)}</p>
      {downloadMessage && <Alert tone={downloadMessage === 'error' ? 'error' : 'success'}>{downloadMessage === 'error' ? downloadDetail ?? text.downloadError : text.downloaded}</Alert>}
      {roomReport && <><dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[[text.reservations, roomReport.resumen.reservas], [text.guests, roomReport.resumen.huespedes], [text.nights, roomReport.resumen.noches_periodo], [text.amount, money(roomReport.resumen.importe_reservado)]].map(([label, value]) =>
          <Card key={label} className="border-l-2 border-l-bronce-600"><dt className="text-xs text-neutro-600">{label}</dt><dd className="mt-2 text-2xl font-semibold tabular-nums text-neutro-900">{value}</dd></Card>)}
      </dl>
      <p className="text-sm text-neutro-600">{text.cancelled}: <strong>{roomReport.resumen.canceladas}</strong> · {text.cancelledAmount}: <strong>{money(roomReport.resumen.importe_cancelado)}</strong></p>
      <Card><p className="mb-2 text-xs leading-relaxed text-neutro-600">{text.moneyNote}</p><p className="text-xs leading-relaxed text-neutro-600">{text.guestsNote}</p></Card></>}
      {operationalReport && <>
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {operationalReport.metricas.map(metric => <Card key={metric.clave} className="border-l-2 border-l-bronce-600">
            <dt className="text-xs text-neutro-600">{locale === 'en' ? metric.etiqueta_en : metric.etiqueta}</dt>
            <dd className="mt-2 text-2xl font-semibold tabular-nums text-neutro-900">{metric.formato === 'importe' ? money(operationalReport.resumen[metric.clave]) : operationalReport.resumen[metric.clave]}</dd>
          </Card>)}
        </dl>
        <Card><p className="mb-2 text-xs leading-relaxed text-neutro-600">{locale === 'en' ? operationalReport.criterio_en : operationalReport.criterio}</p>
          <p className="text-xs leading-relaxed text-neutro-600">{locale === 'en' ? operationalReport.nota_en : operationalReport.nota}</p></Card>
      </>}
      <Card className="overflow-hidden">
        {roomReport && (roomReport.registros.length ? <Table rows={roomReport.registros.map(row => ({ ...row, id: String(row.id) }))} columns={columns} caption={text.title} /> : <p role="status" className="py-10 text-center text-sm text-neutro-600">{text.empty}</p>)}
        {operationalReport && (operationalReport.registros.length ? <Table<Record<string, string | number | null> & { id: string }> rows={operationalReport.registros.map(row => ({ ...row, id: row.referencia }))} columns={operationalReport.columnas.map(column => ({ key: column.clave, label: locale === 'en' ? column.etiqueta_en : column.etiqueta,
          render: row => { const value = row[column.clave]; return value == null ? '—' : column.formato === 'importe' ? money(Number(value)) : column.formato === 'fecha' ? showDate(String(value)) : column.clave === 'estado' ? stateLabel(String(value)) : column.clave === 'tipo_servicio' ? text[value as 'experiencia' | 'alquiler' | 'bienestar'] ?? String(value) : String(value); },
        }))} caption={text[operationalReport.reporte]} /> : <p role="status" className="py-10 text-center text-sm text-neutro-600">{text.operationalEmpty}</p>)}
        <div className="mt-4"><Pagination page={report.paginacion.pagina} totalPages={report.paginacion.total_paginas} onChange={setPage} disabled={query.isFetching || downloading !== null} labels={{ page: text.page, of: text.of, previous: text.previous, next: text.next }} /></div>
      </Card>
    </section>}
  </div>;
}
