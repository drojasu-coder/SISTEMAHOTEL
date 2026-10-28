import { useAdminI18n } from '@/features/admin-core/i18n';
import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Search } from 'lucide-react';
import { MoneyReference } from '@/components/ui/MoneyReference';
import { formatGTQ, parseAmount } from '@/lib/money';
import { api } from '@/api/client/http';
import { getApiErrorMessage } from '@/api/errors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import { ShieldAlert } from 'lucide-react';

export interface ApiEnvelope<T> { success?: boolean; status?: string; data: T; message?: string }
export const readList = async <T,>(endpoint: string): Promise<T[]> => {
  const response = await api.get<ApiEnvelope<T[]>>(endpoint);
  if ((response.success !== true && response.status !== 'success') || response.success === false || !Array.isArray(response.data)) throw new Error('El servidor no devolvió una lista válida.');
  return response.data;
};
export const useAdminList = <T,>(key: string, endpoint: string, enabled = true) =>
  useQuery({ queryKey: ['admin-workbench', key], queryFn: () => readList<T>(endpoint), enabled });
export function useAdminSave(_key: string) {
  const client = useQueryClient();
  const inFlight = React.useRef(false);
  return useMutation({
    retry: false,
    mutationFn: async ({ endpoint, method, body }: { endpoint: string; method: 'POST' | 'PATCH' | 'DELETE'; body?: unknown }) => {
      if (inFlight.current) throw new Error('Hay una operación en curso. Espere antes de continuar.');
      inFlight.current = true;
      try {
        if (method === 'POST') return await api.post(endpoint, body);
        if (method === 'PATCH') return await api.patch(endpoint, body);
        return await api.delete(endpoint);
      } finally { inFlight.current = false; }
    },
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ['admin-workbench'] }); },
  });
}
export const money = (value: unknown) => formatGTQ(value) ?? '—';
/** GTQ uses the shared reference component; foreign amounts retain their recorded currency. */
export function AdminMoney({ amount, currency = 'GTQ' }: { amount: unknown; currency?: string }) {
  if (currency === 'GTQ') return <MoneyReference currency="GTQ" amount={amount} />;
  const parsed = parseAmount(amount);
  if (parsed === null || !/^[A-Z]{3}$/.test(currency)) return <span>—</span>;
  return <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: 'code' }).format(parsed)}</span>;
}
export const date = (value: unknown) => value ? String(value).slice(0, 10) : 'Sin registrar';
/** Muestra fechas reales en la zona horaria del hotel, sin confundir registro con emisión fiscal. */
export function formatHotelDate(value: unknown): string {
  if (!value) return 'Sin registrar';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }
  const timestamp = new Date(String(value));
  if (Number.isNaN(timestamp.getTime())) return 'Sin registrar';
  return new Intl.DateTimeFormat('es-GT', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Guatemala',
  }).format(timestamp);
}
export const lower = (value: unknown) => String(value ?? '').toLocaleLowerCase('es');
export const readableError = (value: unknown) => getApiErrorMessage(value);

export function AdminHeading({ category, title, subtitle, onReload, busy = false }: {
  category: string; title: string; subtitle: string; onReload?: () => void; busy?: boolean;
}) {
  const { t } = useAdminI18n();
  return <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="flex flex-col gap-2"><p className="eyebrow">{category}</p>
      <h1 className="font-serif text-3xl font-semibold text-neutro-900 sm:text-4xl">{title}</h1>
      <p className="max-w-3xl text-sm text-neutro-600">{subtitle}</p>
    </div>
    {onReload && <Button variant="secondary" type="button" onClick={onReload} disabled={busy} className="self-start">
      <RefreshCw className="mr-2 inline size-4" aria-hidden />{t("Actualizar")}</Button>}
  </header>;
}
export function StatCard({ label, value, help }: { label: string; value: React.ReactNode; help?: string }) {
  return <Card className="flex min-h-32 flex-col gap-2"><p className="text-xs font-semibold uppercase tracking-wide text-neutro-500">{label}</p>
    <div className="font-sans text-2xl font-semibold lining-nums tabular-nums text-neutro-900">{value}</div>
    {help && <p className="text-xs text-neutro-500">{help}</p>}
  </Card>;
}
export function SearchBox({ search, onSearch, placeholder = 'Buscar registros...' }: { search: string; onSearch: (s: string) => void; placeholder?: string }) {
  const { t } = useAdminI18n();
  const inputId = React.useId();
  return <div className="flex min-w-0 w-full flex-col gap-2">
    <label htmlFor={inputId} className="text-xs font-semibold text-neutro-700">{t("Buscar")}<span className="font-normal text-neutro-500">{t("(filtrado local)")}</span></label>
    <div className="relative">
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutro-500" />
      <input id={inputId} type="search" className="field-control pl-10" value={search} onChange={e => onSearch(e.target.value)} placeholder={t(placeholder)} />
    </div>
  </div>;
}
export function QueryPanel({ pending, error, retry, empty, filtered = false, children }: {
  pending: boolean; error: unknown; retry: () => void; empty: boolean; filtered?: boolean; children: React.ReactNode;
}) {
  const { t } = useAdminI18n();
  if (pending) return <Card><LoadingNotice label={t("Consultando datos del servidor...")} /></Card>;
  if (error) return <Card><Alert tone="error" title={t("No fue posible consultar los registros")}>{t(readableError(error))}</Alert><Button variant="ghost" className="mt-3" onClick={retry}>{t("Reintentar")}</Button></Card>;
  if (empty) return <Card className="py-10 text-center text-sm text-neutro-600">{filtered ? t("No hay registros que coincidan con los filtros.") : t("No hay registros disponibles.")}</Card>;
  return <>{children}</>;
}
export function ActionError({ error, success }: { error?: string | null; success?: string | null }) {
  const { t } = useAdminI18n();
  return <>{error && <Alert tone="error" title={t("No fue posible completar la operación")}>{t(error)}</Alert>}
    {success && <Alert tone="success" title={t("Operación completada")}>{success}</Alert>}</>;
}


/** Confirmación accesible para operaciones de estado y eliminaciones; reemplaza window.confirm. */
export function ConfirmActionModal({ open, title, description, target, confirmLabel, onClose, onConfirm, busy = false, destructive = true, error }: {
  open: boolean; title: string; description: string; target: string; confirmLabel: string;
  onClose: () => void; onConfirm: () => void; busy?: boolean; destructive?: boolean; error?: string | null;
}) {
  const { t } = useAdminI18n();
  return <Modal open={open} onClose={onClose} busy={busy} closeLabel={t('Cerrar')} title={t(title)} description={t("Revise la operación antes de continuar.")}>
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border border-neutro-200 bg-neutro-50 p-4">
        <p className="break-words text-sm font-semibold text-neutro-900">{target}</p>
        <p className="mt-2 text-sm leading-6 text-neutro-600">{t(description)}</p>
      </div>
      {error && <Alert tone="error" title={t("La operación no se pudo completar")}>{t(error)}</Alert>}
      {destructive && <p className="flex items-start gap-2 text-xs text-neutro-600"><ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{t("La operación puede afectar información relacionada. El servidor verificará las restricciones.")}</p>}
      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="ghost" disabled={busy} onClick={onClose}>{t("Cancelar")}</Button>
        <Button type="button" variant={destructive ? 'danger' : 'secondary'} isLoading={busy} onClick={onConfirm}>{busy ? t("Procesando...") : t(confirmLabel)}</Button>
      </div>
    </div>
  </Modal>;
}
