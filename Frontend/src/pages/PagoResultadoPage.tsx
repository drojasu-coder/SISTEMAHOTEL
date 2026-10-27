import { useQuery } from '@tanstack/react-query';
import { carritoApi } from '@/features/carrito/api/carritoApi';
import { PurchaseReservations } from '@/features/compra/PurchaseReservations';
import { PurchaseSteps } from '@/features/compra/PurchaseSteps';
import { TranslatedError, usePublicInterface } from '@/i18n/public';
import { usePublicTexts } from '@/i18n/public';
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldAlert, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';

import { useAuth } from '@/features/auth/AuthContext';
import {
  usePagoResultado,
  PagoResultadoCard,
} from '@/features/pagos';

export const PagoResultadoPage: React.FC = () => {
  const textosPagos = usePublicTexts('pagos');
  const { p } = usePublicInterface();
  const { id } = useParams<{ id: string }>();
  const pagoId = Number(id);

  const { user } = useAuth();
  const {
    pago,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    isCliente,
    isAuthLoading,
    isValidId,
    pollingPaused,
  } = usePagoResultado(pagoId);

  const currentCart = useQuery({ queryKey: ['purchase-result-current-cart', user?.id, pago?.id], queryFn: carritoApi.getCurrent, enabled: isCliente && Boolean(pago?.carrito_id) && (pago?.estado === 'rechazado' || pago?.estado === 'cancelado'), retry: false, staleTime: 0 });
  const allowReturnCheckout = Boolean(pago && pago.carrito_id !== null && currentCart.isSuccess && !currentCart.isFetching && !currentCart.isError && currentCart.data?.estado === 'activo' && currentCart.data?.id === pago.carrito_id && currentCart.data?.usuario_id === user?.id);

  // 1. Estado de carga de autenticación
  if (isAuthLoading) {
    return (
      <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-16">
        <LoadingNotice label={p('sessionChecking')} />
      </div>
    );
  }

  // 2. Restricción de acceso para rol cliente
  if (!isCliente) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <Card className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-advertencia-100 text-advertencia-700">
            <ShieldAlert className="size-8" aria-hidden="true" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-neutro-900">
            {textosPagos.accesoRestringidoTitulo}
          </h1>
          <p className="text-sm text-neutro-600">
            {textosPagos.accesoRestringidoMensaje}
          </p>
          {!user && (
            <Link
              to="/login"
              className="mt-2 inline-flex min-h-11 items-center justify-center rounded-md bg-selva-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-selva-700"
            >
              {textosPagos.botonIniciarSesion}
            </Link>
          )}
        </Card>
      </div>
    );
  }

  // 3. Identificador de pago no válido
  if (!isValidId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <Card className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-error-100 text-error-700">
            <AlertCircle className="size-8" aria-hidden="true" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-neutro-900">
            {textosPagos.idInvalidoTitulo}
          </h1>
          <p className="text-sm text-neutro-600">
            {textosPagos.idInvalidoMensaje}
          </p>
          <Link
            to="/mis-reservas"
            className="mt-2 inline-flex min-h-11 items-center justify-center rounded-md bg-selva-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-selva-700"
          >
            {textosPagos.botonMisReservas}
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <PurchaseSteps current={2} />
      <header className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-bold text-neutro-900">
          {textosPagos.tituloPagina}
        </h1>
        <p className="text-sm text-neutro-600">
          {textosPagos.subtituloPagina}
        </p>
      </header>

      {/* Estado de carga */}
      {isLoading && (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <LoadingNotice label={p('purchaseDetailsLoading')} />
        </Card>
      )}

      {/* Estado de error con reintento */}
      {isError && (
        <Alert tone="error" title={textosPagos.errorCargaTitulo}>
          <div className="flex flex-col gap-3">
            <p className="text-xs"><TranslatedError error={{ api: error }} /></p>
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                className="bg-white text-error-700 hover:bg-error-50"
              >
                <RefreshCw className="size-3.5" aria-hidden="true" />
                {textosPagos.botonReintentar}
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* Resultado de la transacción */}
      {pago && !isLoading && !isError && (
        <>
          <PagoResultadoCard key={`${user?.id}:${pago.id}`} pago={pago} allowReturnCheckout={allowReturnCheckout} pollingPaused={pollingPaused} />
          {(pago.estado === 'pendiente' || pago.estado === 'procesando') && <Button variant="ghost" onClick={() => { void refetch(); }} disabled={isFetching}>{textosPagos.botonReintentar}</Button>}
          <PurchaseReservations key={`${user?.id}:${pago.id}`} payment={pago} />
        </>
      )}
    </div>
  );
};
