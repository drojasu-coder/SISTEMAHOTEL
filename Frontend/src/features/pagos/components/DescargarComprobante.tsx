import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { usePublicInterface, usePublicTexts } from '@/i18n/public';
import { pagosApi } from '../api/pagosApi';
import { formatGTQ } from '../textos';

/**
 * Descarga autenticada del comprobante interno PDF de un pago aprobado.
 * El servidor vuelve a comprobar pertenencia y estado en cada descarga.
 */
export const DescargarComprobanteButton: React.FC<{ pagoId: number; label?: string }> = ({ pagoId, label }) => {
  const textosPagos = usePublicTexts('pagos');
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState(false);

  const descargar = async () => {
    setDescargando(true);
    setError(false);
    try {
      await pagosApi.descargarComprobante(pagoId);
    } catch {
      setError(true);
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="secondary" onClick={() => void descargar()} disabled={descargando} aria-busy={descargando}>
        <Download className="size-4" aria-hidden="true" />
        <span>{descargando ? textosPagos.descargandoComprobante : label ?? textosPagos.descargarComprobante}</span>
      </Button>
      {error && <Alert tone="error">{textosPagos.errorComprobante}</Alert>}
    </div>
  );
};

/** Comprobantes de los pagos aprobados que incluyen una reserva del cliente. */
export const ComprobantesReserva: React.FC<{ tipoItem: string; referenciaId: number }> = ({ tipoItem, referenciaId }) => {
  const textosPagos = usePublicTexts('pagos');
  const { locale } = usePublicInterface();
  const query = useQuery({
    queryKey: ['pagos', 'comprobantes', tipoItem, referenciaId],
    queryFn: ({ signal }) => pagosApi.comprobantesDeReserva(tipoItem, referenciaId, signal),
    retry: false,
  });

  if (query.isPending) return <LoadingNotice label={textosPagos.comprobantesCargando} />;
  if (query.isError) {
    return (
      <Alert tone="error">
        <p>{textosPagos.comprobantesError}</p>
        <Button type="button" variant="ghost" size="sm" onClick={() => void query.refetch()}>{textosPagos.reintentar}</Button>
      </Alert>
    );
  }
  // Sin pagos aprobados no se ofrece ninguna descarga.
  if (!query.data.length) return null;

  const fecha = (value: string) =>
    new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-GT', { timeZone: 'America/Guatemala', dateStyle: 'medium' }).format(new Date(value));
  const monto = (value: number, moneda: string) => (moneda === 'GTQ' ? formatGTQ(value) : `${moneda} ${value.toFixed(2)}`);

  return (
    <section className="rounded-xl border border-neutro-200 bg-neutro-50 p-5" aria-labelledby={`comprobantes-${tipoItem}-${referenciaId}`}>
      <h2 id={`comprobantes-${tipoItem}-${referenciaId}`} className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutro-500">
        {textosPagos.comprobantesTitulo}
      </h2>
      <p className="mb-4 text-xs text-neutro-600">{textosPagos.notaComprobante}</p>
      <ul className="flex flex-col gap-4">
        {query.data.map((pago) => (
          <li key={pago.id} className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <span className="text-sm text-neutro-800">{textosPagos.comprobantePago(pago.id, fecha(pago.fecha_pago), monto(pago.monto, pago.moneda))}</span>
            <DescargarComprobanteButton pagoId={pago.id} />
          </li>
        ))}
      </ul>
    </section>
  );
};
