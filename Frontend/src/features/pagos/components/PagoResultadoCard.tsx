import { useState } from 'react';
import { MoneyReference } from '@/components/ui/MoneyReference';
import { usePublicInterface } from '@/i18n/public';
import { Button } from '@/components/ui/Button';
import { usePublicTexts } from '@/i18n/public';
import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,

  AlertTriangle,
  XCircle,
  RotateCcw,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
  Calendar,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Feedback';
import { Spinner } from '@/components/ui/Button';
import { RESERVAS_ROUTES } from '@/features/reservas/constants/routes';
import { PAGOS_ROUTES } from '../constants/routes';

import type { Pago } from '../types';

export interface PagoResultadoCardProps {
  pago: Pago;
  allowReturnCheckout?: boolean;
  pollingPaused?: boolean;
}

export const PagoResultadoCard: React.FC<PagoResultadoCardProps> = ({ pago, allowReturnCheckout = false, pollingPaused = false }) => {
  const { p, locale } = usePublicInterface();
  const [copied, setCopied] = useState<'success' | 'error' | null>(null);
  const textosPagos = usePublicTexts('pagos');
  const isAprobado = pago.estado === 'aprobado';
  const isProcesando = pago.estado === 'procesando' || pago.estado === 'pendiente';
  const isRechazado = pago.estado === 'rechazado';
  const isCancelado = pago.estado === 'cancelado';
  const isReembolsado =
    pago.estado === 'reembolsado' || pago.estado === 'reembolsado_parcial';

  return (
    <Card className="flex flex-col gap-6 p-6 sm:p-8">
      {/* Encabezado según estado */}
      <div className="flex flex-col items-center text-center">
        {isAprobado && (
          <div className="flex size-16 items-center justify-center rounded-full bg-exito-100 text-exito-700">
            <CheckCircle2 className="size-10" aria-hidden="true" />
          </div>
        )}

        {isProcesando && !pollingPaused && (
          <div className="flex size-16 items-center justify-center rounded-full bg-selva-50 text-selva-600">
            <Spinner className="size-10 text-selva-600" />
          </div>
        )}

        {isRechazado && (
          <div className="flex size-16 items-center justify-center rounded-full bg-error-100 text-error-700">
            <AlertTriangle className="size-10" aria-hidden="true" />
          </div>
        )}

        {isCancelado && (
          <div className="flex size-16 items-center justify-center rounded-full bg-neutro-100 text-neutro-600">
            <XCircle className="size-10" aria-hidden="true" />
          </div>
        )}

        {isReembolsado && (
          <div className="flex size-16 items-center justify-center rounded-full bg-info-100 text-info-700">
            <RotateCcw className="size-10" aria-hidden="true" />
          </div>
        )}

        <h2 className="mt-4 font-serif text-2xl font-bold text-neutro-900 sm:text-3xl">
          {textosPagos.estados[pago.estado] ?? p('purchaseUnknown')}
        </h2>

        <p className="mt-1.5 max-w-lg text-sm text-neutro-600">
          {isAprobado && textosPagos.mensajeAprobado}
          {isProcesando && textosPagos.mensajeProcesando}
          {isRechazado && textosPagos.mensajeRechazado}
          {isCancelado && textosPagos.mensajeCancelado}
          {isReembolsado && textosPagos.mensajeReembolsado}
        </p>

        {isProcesando && !pollingPaused && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-selva-50 px-3 py-1 text-xs font-medium text-selva-700">
            <RefreshCw className="size-3 animate-spin" aria-hidden="true" />
            <span>{textosPagos.avisoPollingActivo}</span>
          </div>
        )}
      </div>

      {/* Mensaje de error para pagos rechazados */}
      {isRechazado && pago.mensaje_error && (
        <Alert tone="error">
          <p lang="es" className="text-xs">{pago.mensaje_error}</p>
        </Alert>
      )}

      {pollingPaused && isProcesando && <Alert tone="warning">{p('purchasePollingPaused')}</Alert>}
      <div><Button variant="ghost" onClick={() => { void (async () => { try { await navigator.clipboard.writeText(`${locale === 'en' ? 'Payment' : 'Pago'} #${pago.id}`); setCopied('success'); } catch { setCopied('error'); } })(); }}>{p('purchaseCopy')}</Button>{copied && <p role="status" className="text-xs">{p(copied === 'success' ? 'purchaseCopied' : 'purchaseCopyError')}</p>}</div>
      {/* Datos históricos del pago; no se reconstruyen con catálogo actual. */}
      <div className="rounded-xl border border-neutro-200 bg-neutro-50 p-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutro-500">
          {textosPagos.detalleTitulo}
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <span className="text-xs text-neutro-500">{textosPagos.codigoPago}</span>
            <p className="font-mono text-base font-bold text-neutro-900">
              #{pago.id}
            </p>
          </div>

          <div>
            <span className="text-xs text-neutro-500">{isAprobado ? p('purchaseChargedAmount') : p('purchaseRecordedAmount')}</span>
            <p className="font-serif text-lg font-bold text-selva-700">
              {pago.moneda === 'GTQ' ? <MoneyReference currency="GTQ" amount={pago.monto} /> : `${pago.moneda} ${pago.monto}`} <small>{pago.moneda}</small>
            </p>
          </div>

          <div>
            <span className="text-xs text-neutro-500">{textosPagos.metodo}</span>
            <p className="text-sm font-semibold capitalize text-neutro-800">
              {locale === 'es' ? pago.metodo : ({ tarjeta: 'Card', efectivo: 'Cash', transferencia: 'Bank transfer' }[pago.metodo] ?? pago.metodo)}
            </p>
          </div>

          <div>
            <span className="text-xs text-neutro-500">{textosPagos.estado}</span>
            <p className="text-sm font-semibold capitalize text-neutro-800">
              {locale === 'es' ? pago.estado : textosPagos.estados[pago.estado] ?? p('purchaseUnknown')}
            </p>
          </div>

          {pago.carrito_id !== null && (
            <div>
              <span className="text-xs text-neutro-500">{p('purchaseCart')}</span>
              <p className="flex items-center gap-1.5 text-xs font-medium text-neutro-800">
                <ShoppingBag className="size-3.5 text-neutro-500" />
                {textosPagos.origenCarrito(pago.carrito_id)}
              </p>
            </div>
          )}

          {pago.reserva_habitacion_id !== null && (
            <div>
              <span className="text-xs text-neutro-500">{p('purchaseView')}</span>
              <p className="flex items-center gap-1.5 text-xs font-medium text-neutro-800">
                <Calendar className="size-3.5 text-neutro-500" />
                {textosPagos.origenReserva(pago.reserva_habitacion_id)}
              </p>
            </div>
          )}

          {pago.id_transaccion_externo && (
            <div className="sm:col-span-2">
              <span className="text-xs text-neutro-500">
                {textosPagos.referenciaExterna}
              </span>
              <p className="font-mono text-xs text-neutro-700">
                {pago.id_transaccion_externo}
              </p>
            </div>
          )}

          {pago.fecha_pago && (
            <div>
              <span className="text-xs text-neutro-500">{textosPagos.fecha}</span>
              <p className="text-xs text-neutro-700">{pago.fecha_pago}</p>
            </div>
          )}
        </div>
      </div>

      {/* Botones de acción y navegación */}
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
        {/* Desde pago rechazado o cancelado: regresar al checkout para consultar el estado real */}
        {allowReturnCheckout && (isRechazado || isCancelado) && (
          <Link
            to={PAGOS_ROUTES.CHECKOUT}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-selva-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-selva-700"
          >
            <span>{textosPagos.botonRegresarCheckout}</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        )}

        {/* Desde pago aprobado */}
        {isAprobado && (
          <div className="flex flex-wrap items-center gap-3">
            {pago.reserva_habitacion_id !== null && (
              <Link
                to={RESERVAS_ROUTES.DETALLE(pago.reserva_habitacion_id)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-selva-600 bg-white px-4 py-3 text-sm font-semibold text-selva-700 transition-colors hover:bg-selva-50"
              >
                {textosPagos.botonVerReserva}
              </Link>
            )}

            <Link
              to={RESERVAS_ROUTES.MIS_RESERVAS}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-selva-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-selva-700"
            >
              {textosPagos.botonMisReservas}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        )}

        {(isProcesando || isRechazado || isCancelado || !textosPagos.estados[pago.estado]) && <Link to={RESERVAS_ROUTES.MIS_RESERVAS} className="inline-flex min-h-11 items-center font-semibold text-bronce-700 underline">{textosPagos.botonMisReservas}</Link>}

        {/* Desde reembolsado */}
        {isReembolsado && (
          <Link
            to={RESERVAS_ROUTES.MIS_RESERVAS}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-selva-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-selva-700"
          >
            {textosPagos.botonMisReservas}
          </Link>
        )}
      </div>
    </Card>
  );
};
