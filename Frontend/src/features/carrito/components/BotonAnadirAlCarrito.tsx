import { usePublicInterface } from '@/i18n/public';
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Check, CircleCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/AuthContext';
import { CARRITO_ROUTES } from '../constants/routes';
import { carritoQueryKeys } from '../constants/queryKeys';
import { carritoApi, type TipoReferenciaConEstado } from '../api/carritoApi';
import { formatGTQ } from '@/features/mis-reservas/formato';
import { useAddReservaToCarrito } from '../hooks/useAddReservaToCarrito';
import { textosCarrito } from '../textos';
import type { TipoItemCarrito } from '../types';

export interface BotonAnadirAlCarritoProps {
  reservaId: number;
  /** Estado actual de la reserva en el frontend */
  reservaEstado: string;
  tipo_item?: TipoItemCarrito;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onSuccess?: () => void;
  publicInterface?: boolean;
  /** Indicación que solo aplica mientras la reserva todavía puede añadirse (se oculta si ya está pagada o en el carrito). */
  notaPagable?: React.ReactNode;
}

/** Estados terminales según backend que no pueden agregarse a un carrito */
const ESTADOS_TERMINALES = new Set([
  'cancelada',
  'cancelado',
  'expirada',
  'expirado',
  'pagada',
  'pagado',
  'usada',
  'usado',
  'completada',
  'completado',
  'finalizada',
  'finalizado',
]);

/**
 * Botón interactivo para añadir una reserva de habitación existente al carrito activo.
 *
 * Elegibilidad:
 * - Solo visible/activo para clientes autenticados.
 * - Deshabilitado si la reserva está en un estado terminal evidente.
 * - No asume campo pagado: el backend valida la condición financiera en resolveHabitacion.
 * - Impide envíos duplicados durante la ejecución.
 */
export const BotonAnadirAlCarrito: React.FC<BotonAnadirAlCarritoProps> = ({
  reservaId,
  reservaEstado,
  tipo_item = 'habitacion',
  variant = 'primary',
  size = 'md',
  className,
  onSuccess,
  publicInterface = false,
  notaPagable,
}) => {
  const { p } = usePublicInterface();
  const { user } = useAuth();
  const esTerminalPrevio = ESTADOS_TERMINALES.has(reservaEstado.toLowerCase());
  // Estado financiero real (pagada, en proceso, ya en el carrito) para evento, actividad y bienestar:
  // el estado operativo «confirmada» no indica si la reserva ya se pagó.
  const tipoConEstado = (['evento', 'actividad', 'bienestar'] as const).includes(tipo_item as TipoReferenciaConEstado)
    ? (tipo_item as TipoReferenciaConEstado) : null;
  const estadoQuery = useQuery({
    queryKey: carritoQueryKeys.estadoReferencia(tipo_item, reservaId, user?.id),
    queryFn: ({ signal }) => carritoApi.getEstadoReferencia(tipoConEstado!, reservaId, signal),
    enabled: Boolean(tipoConEstado) && user?.rol === 'cliente' && reservaId > 0 && !esTerminalPrevio,
    staleTime: 0,
    retry: false,
  });
  const estadoFinanciero = estadoQuery.data?.estado;
  const { anadirAlCarrito, isLoading, feedback, limpiarFeedback } =
    useAddReservaToCarrito({
      tipo_item,
      onSuccess: () => onSuccess?.(),
    });

  // Solo clientes pueden utilizar el carrito de compras
  if (user?.rol !== 'cliente') {
    return null;
  }

  const esTerminal = esTerminalPrevio;
  type ClaveTexto = 'cartRefPaid' | 'cartRefPartial' | 'cartRefProcessing' | 'cartRefInCart' | 'goCart' | 'cartRefDeposit' | 'cartRefPartialLabel' | 'cartRefProcessingLabel' | 'cartRefAmountPaid' | 'cartRefAmountProcessing' | 'cartRefBalance';
  const txt = (key: ClaveTexto, es: string) => (publicInterface ? p(key) : es);
  const enlaceCarrito = (label: string) => (
    <Link to={CARRITO_ROUTES.CARRITO} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-bronce-300 bg-white px-3 py-2 text-xs font-semibold text-bronce-700 transition-colors hover:bg-bronce-50">
      <ShoppingCart className="size-3.5" aria-hidden="true" /><span>{label}</span>
    </Link>
  );
  const etiqueta = (texto: string, completo: boolean) => (
    <span className={'inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ' + (completo ? 'border-exito-600/20 bg-exito-50 text-exito-700' : 'border-bronce-300 bg-bronce-50 text-bronce-800')}>
      {completo ? <CircleCheck className="size-3.5" aria-hidden="true" /> : <Clock className="size-3.5" aria-hidden="true" />}{texto}
    </span>
  );
  // Importes del evento tal como los calcula el servidor; el frontend no deduce saldos.
  const montos = estadoQuery.data?.montos;
  const detalleMontos = montos && (
    <dl className="grid grid-cols-[auto_auto] justify-start gap-x-3 gap-y-0.5 text-xs text-neutro-600">
      {montos.aprobado > 0 && <><dt>{txt('cartRefAmountPaid', textosCarrito.montoPagado)}</dt><dd className="font-semibold tabular-nums text-neutro-900">{formatGTQ(montos.aprobado)}</dd></>}
      {montos.en_proceso > 0 && <><dt>{txt('cartRefAmountProcessing', textosCarrito.montoEnProceso)}</dt><dd className="font-semibold tabular-nums text-neutro-900">{formatGTQ(montos.en_proceso)}</dd></>}
      <dt>{txt('cartRefBalance', textosCarrito.saldoPendiente)}</dt><dd className="font-semibold tabular-nums text-neutro-900">{formatGTQ(montos.saldo)}</dd>
    </dl>
  );

  // Totalmente pagada: nunca se ofrece otra acción de carrito o cobro.
  if (estadoFinanciero === 'pagada') {
    return <div className="flex flex-col gap-1.5" role="status">{etiqueta(txt('cartRefPaid', textosCarrito.referenciaPagada), true)}{detalleMontos}</div>;
  }
  // Anticipo o pago parcial: hay dinero aprobado pero no se afirma que esté pagada; no se ofrece añadirla de nuevo.
  if (estadoFinanciero === 'anticipo_pagado' || estadoFinanciero === 'pago_parcial') {
    return (
      <div className="flex flex-col gap-1.5" role="status">
        {etiqueta(estadoFinanciero === 'anticipo_pagado' ? txt('cartRefDeposit', textosCarrito.referenciaAnticipo) : txt('cartRefPartialLabel', textosCarrito.referenciaPagoParcialEtiqueta), false)}
        {detalleMontos}
        <p className="text-xs text-neutro-500">{txt('cartRefPartial', textosCarrito.referenciaPagoParcial)}</p>
      </div>
    );
  }
  // Pago en procesamiento o incierto: se conserva el bloqueo y no se ofrece un segundo cobro.
  if (estadoFinanciero === 'procesando') {
    return (
      <div className="flex flex-col gap-2" role="status">
        {etiqueta(txt('cartRefProcessingLabel', textosCarrito.referenciaProcesandoEtiqueta), false)}
        {detalleMontos}
        <p className="text-xs text-neutro-600">{txt('cartRefProcessing', textosCarrito.referenciaProcesando)}</p>
        <div>{enlaceCarrito(txt('goCart', textosCarrito.irAlCarrito))}</div>
      </div>
    );
  }
  // Ya está en el carrito activo: se dirige al carrito en lugar de volver a añadirla.
  if (estadoFinanciero === 'en_carrito') {
    return (
      <div className="flex flex-col gap-1.5">
        <div>{enlaceCarrito(txt('goCart', textosCarrito.irAlCarrito))}</div>
        <p className="text-xs text-neutro-500">{txt('cartRefInCart', textosCarrito.referenciaEnCarrito)}</p>
      </div>
    );
  }
  // Mientras se consulta el estado no se permite añadir (evita un clic sobre una reserva ya pagada).
  const consultando = Boolean(tipoConEstado) && estadoQuery.isLoading;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoading && !esTerminal) {
      anadirAlCarrito(reservaId);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant={variant}
          size={size}
          onClick={handleClick}
          isLoading={isLoading}
          disabled={isLoading || esTerminal || consultando}
          className={className}
          aria-label={(publicInterface ? p('addCart') : textosCarrito.anadirAlCarrito)}
        >
          <ShoppingCart className="size-4" aria-hidden="true" />
          <span>
            {isLoading
              ? (publicInterface ? p('addingCart') : textosCarrito.anadiendoAlCarrito)
              : (publicInterface ? p('addCart') : textosCarrito.anadirAlCarrito)}
          </span>
        </Button>

        {feedback?.verCarrito && (
          <Link
            to={CARRITO_ROUTES.CARRITO}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-bronce-300 bg-white px-3 py-2 text-xs font-semibold text-bronce-700 transition-colors hover:bg-bronce-50"
          >
            <Check className="size-3.5" aria-hidden="true" />
            <span>{(publicInterface ? p('viewCart') : textosCarrito.verCarrito)}</span>
          </Link>
        )}
      </div>

      {!esTerminal && notaPagable}

      {esTerminal && (
        <p className="text-xs text-neutro-500">
          {(publicInterface ? p('ineligibleCart') : textosCarrito.noElegibleEstado)}
        </p>
      )}

      {feedback && (
        <div className="flex flex-col gap-1.5 pt-1">
          <Alert tone={feedback.tono}>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium">{publicInterface && feedback.publicKey ? p(feedback.publicKey) : <span lang="es">{feedback.texto}</span>}</p>
              {feedback.tono === 'success' && (
                <p className="text-[0.6875rem] text-neutro-500">
                  {(publicInterface ? p('addedCartNote') : textosCarrito.anadirExitoNota)}
                </p>
              )}
            </div>
          </Alert>

          {feedback.esIncierto && (
            <div className="flex items-center gap-2">
              <Link
                to={CARRITO_ROUTES.CARRITO}
                className="text-xs font-semibold text-bronce-700 underline hover:text-bronce-800"
              >
                {(publicInterface ? p('viewCart') : textosCarrito.verCarrito)}
              </Link>
              <button
                type="button"
                onClick={limpiarFeedback}
                className="text-xs text-neutro-500 hover:text-neutro-700"
              >
                {(publicInterface ? p('dismiss') : textosCarrito.descartar)}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
