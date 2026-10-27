import React from 'react';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getApiErrorMessage } from '@/api/errors';

export const OperationsTitle: React.FC<{ overline: string; title: string; description: string; children?: React.ReactNode }> = ({ overline, title, description, children }) => (
  <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="space-y-2">
      <p className="eyebrow">{overline}</p>
      <h1 className="font-serif text-3xl font-semibold text-neutro-900 md:text-4xl">{title}</h1>
      <p className="max-w-2xl text-sm text-neutro-600">{description}</p>
    </div>
    {children}
  </header>
);

export const OperationsState: React.FC<{ loading: boolean; error: unknown; retry: () => void }> = ({ loading, error, retry }) => {
  if (loading) return <Card className="flex justify-center py-12"><LoadingNotice label="Consultando registros del hotel..." /></Card>;
  if (error) return (
    <Card className="space-y-4 p-6">
      <Alert tone="error" title="No fue posible consultar los registros">{getApiErrorMessage(error)}</Alert>
      <Button variant="secondary" onClick={retry}>Volver a intentar</Button>
    </Card>
  );
  return null;
};

export const Metric: React.FC<{ label: string; value: string | number; detail?: string }> = ({ label, value, detail }) => (
  <Card className="space-y-2 p-5">
    <p className="text-xs font-medium uppercase tracking-wide text-neutro-500">{label}</p>
    <p className="font-serif text-2xl font-semibold text-neutro-900">{value}</p>
    {detail && <p className="text-xs text-neutro-500">{detail}</p>}
  </Card>
);

export const StatusPill: React.FC<{ value: string }> = ({ value }) => {
  const normalized = value.toLowerCase();
  const palette = ['aprobado', 'pagada', 'activo', 'confirmada', 'completada'].includes(normalized)
    ? 'border-selva-200 bg-selva-50 text-selva-800'
    : ['cancelada', 'rechazado', 'anulada', 'inactivo'].includes(normalized)
      ? 'border-rojo-200 bg-rojo-50 text-rojo-700'
      : 'border-neutro-200 bg-neutro-100 text-neutro-700';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${palette}`}>{value}</span>;
};

export const EmptyRecords: React.FC<{ message?: string }> = ({ message = 'No hay registros que coincidan con la búsqueda.' }) => (
  <Card className="py-10 text-center text-sm text-neutro-600">{message}</Card>
);
