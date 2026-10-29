import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client/http';
import { Button } from '@/components/ui/Button';
import { LoadingNotice } from '@/components/ui/Feedback';
import { useTextosConfig } from '@/features/configuracion/textos';
import { hotelDate } from '@/features/finanzas/common';
import { useLocale } from '@/i18n/LocaleContext';
import type { ConfiguracionReservasMesa } from '@/features/restaurante/types';

interface Iva { porcentaje_iva: string | number; updatedAt?: string }

const Group: React.FC<{ title: string; note?: string; children: React.ReactNode }> = ({ title, note, children }) => {
  const t = useTextosConfig();
  return <section aria-label={title} className="rounded-xl border border-neutro-200 bg-white p-4">
    <div className="flex items-center justify-between gap-2"><h2 className="font-sans text-base font-semibold text-neutro-900">{title}</h2>
      <span className="rounded-full border border-neutro-300 bg-neutro-100 px-2.5 py-0.5 text-xs font-medium text-neutro-600">{t.soloLectura}</span></div>
    <div className="mt-3">{children}</div>{note && <p className="mt-3 text-xs text-neutro-500">{note}</p>}
  </section>;
};
const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => <div><dt className="text-xs text-neutro-500">{label}</dt><dd className="mt-0.5 text-lg font-semibold tabular-nums text-neutro-900">{value}</dd></div>;
const Failed: React.FC<{ onRetry: () => void }> = ({ onRetry }) => { const t = useTextosConfig(); return <div role="alert" className="text-sm text-error-700">{t.error} <Button variant="secondary" size="sm" onClick={onRetry}>{t.reintentar}</Button></div>; };

/** Parámetros globales que el sistema expone hoy; todos son de consulta (el IVA se edita solo por revisión financiera). */
export const ConfiguracionPage: React.FC = () => {
  const t = useTextosConfig();
  const { locale } = useLocale();
  const iva = useQuery({ queryKey: ['config-iva'], retry: false, queryFn: async () => (await api.get<{ data: Iva }>('/configuraciones/iva')).data });
  const mesas = useQuery({ queryKey: ['config-mesas'], retry: false, queryFn: async () => (await api.get<{ data: ConfiguracionReservasMesa }>('/mesas/configuracion')).data });
  const pct = (v: string | number) => `${Number(v).toLocaleString(locale === 'en' ? 'en-US' : 'es-GT', { maximumFractionDigits: 2 })} %`;
  return (
    <div className="space-y-5">
      <header><p className="text-xs font-medium text-neutro-500">{t.categoria}</p><h1 className="font-sans text-2xl font-semibold text-neutro-900">{t.titulo}</h1><p className="text-sm text-neutro-500">{t.intro}</p></header>
      <div className="grid gap-4 lg:grid-cols-2">
        <Group title={t.impuestos} note={t.ivaNota}>
          {iva.isLoading ? <LoadingNotice label={t.cargando} /> : iva.isError || !iva.data ? <Failed onRetry={() => void iva.refetch()} />
            : <dl className="grid grid-cols-2 gap-3"><Row label={t.iva} value={pct(iva.data.porcentaje_iva)} />{iva.data.updatedAt && <Row label={t.actualizado} value={<span className="text-sm">{hotelDate(iva.data.updatedAt, locale)}</span>} />}</dl>}
        </Group>
        <Group title={t.restaurante} note={t.restauranteNota}>
          {mesas.isLoading ? <LoadingNotice label={t.cargando} /> : mesas.isError || !mesas.data ? <Failed onRetry={() => void mesas.refetch()} />
            : <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3"><Row label={t.apertura} value={mesas.data.apertura} /><Row label={t.cierre} value={mesas.data.cierre} /><Row label={t.ultimoInicio} value={mesas.data.ultima_hora_inicio} />
              <Row label={t.intervalo} value={t.minutos(mesas.data.intervalo_minutos)} /><Row label={t.duracion} value={t.minutos(mesas.data.duracion_minutos)} /></dl>}
        </Group>
      </div>
      <p className="text-xs text-neutro-500">{t.administrado}</p>
    </div>
  );
};
