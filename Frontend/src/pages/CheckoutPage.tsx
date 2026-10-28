import { useQueryClient } from '@tanstack/react-query';
import { verifyCartPayment } from '@/features/compra/verifyCartPayment';
import { PurchaseSteps } from '@/features/compra/PurchaseSteps';
import { AccountContact } from '@/features/compra/AccountContact';
import { CartExpiry } from '@/features/compra/CartExpiry';
import { usePublicTexts, TranslatedError, usePublicInterface } from '@/i18n/public';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  RefreshCw,
  ShoppingCart,
} from 'lucide-react';
import { ApiError } from '@/api/client/http';
import { pagosApi } from '@/features/pagos/api/pagosApi';

import { Button, buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { CARRITO_ROUTES } from '@/features/carrito/constants/routes';
import {
  useCarritoActualQuery,
  useCarritoItemsQuery,
} from '@/features/carrito/hooks/useCarritoPantalla';
import { RESERVAS_ROUTES } from '@/features/reservas';
import { ClienteCheckoutGate } from '@/features/pagos/components/ClienteCheckoutGate';
import { ListaArticulosCheckout } from '@/features/pagos/components/ListaArticulosCheckout';
import { ResumenCheckout } from '@/features/pagos/components/ResumenCheckout';
import { StripePaymentForm } from '@/features/pagos/components/StripePaymentForm';
import { PAGOS_ROUTES } from '@/features/pagos/constants/routes';
import {
  useIntentoActivoQuery,
  usePagoQuery,
  useResumenCheckoutQuery,
} from '@/features/pagos/hooks/useCheckoutQueries';
import { useCrearIntentoPago } from '@/features/pagos/hooks/useCrearIntentoPago';
import { formatearGTQ } from '@/features/pagos/textos';
import {
  clearCheckoutIdempotencyKey,
  getOrCreateCheckoutIdempotencyKey,
  getStoredCheckoutAttempt,
} from '@/features/pagos/utils/idempotency';
import { getStripe } from '@/features/pagos/utils/stripe';
import { LegalNotice } from '@/features/legal';

const MONTO_TOLERANCIA = 0.005;

function normalizarMonto(
  valor: number | string | null | undefined,
): number {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string' && valor.trim() !== '') {
    return Number(valor);
  }
  return Number.NaN;
}

function montosCoinciden(
  a: number | string | null | undefined,
  b: number | string | null | undefined,
): boolean {
  const montoA = normalizarMonto(a);
  const montoB = normalizarMonto(b);

  if (!Number.isFinite(montoA) || !Number.isFinite(montoB)) {
    return false;
  }
  return Math.abs(montoA - montoB) < MONTO_TOLERANCIA;
}

function esErrorHttp(error: unknown, status: number): boolean {
  return error instanceof ApiError && error.status === status;
}

function codigoError(error: unknown): string | undefined {
  return error instanceof ApiError ? error.code : undefined;
}

function esErrorCarritoNoDisponible(error: unknown): boolean {
  return (
    esErrorHttp(error, 409) &&
    ['CART_NOT_AVAILABLE', 'CART_NOT_ACTIVE', 'CART_NOT_FOUND'].includes(
      codigoError(error) ?? '',
    )
  );
}

function checkoutCopy(dictionary: object, key: string): string {
  const value = key.split('.').reduce<unknown>((node, part) => node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined, dictionary);
  return typeof value === 'string' ? value : '';
}

interface MensajeCheckout {
  tono: 'success' | 'info' | 'warning' | 'error';
  texto: string;
  titulo?: string;
  comprobar?: boolean;
  apiError?: unknown;
}

interface IntentoCreado {
  carritoId: number;
  pagoId: number;
  clientSecret: string;
  monto: number;
  moneda: string;
}

interface BloqueoMonto {
  anterior: number;
  actual: number;
}

const SinCarrito: React.FC<{ onActualizar: () => void; actualizando: boolean }> =
  ({ onActualizar, actualizando }) => { const textosCheckout = usePublicTexts('checkout'); return (
    <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <ShoppingCart className="size-12 text-neutro-400" aria-hidden="true" />
      <div className="flex max-w-md flex-col gap-1">
        <h2 className="text-lg font-serif font-semibold text-neutro-800">
          {textosCheckout.sinCarritoTitulo}
        </h2>
        <p className="text-xs text-neutro-600">
          {textosCheckout.sinCarritoDescripcion}
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          to={RESERVAS_ROUTES.NUEVA}
          className={buttonStyles({ className: 'w-full sm:w-auto' })}
        >
          {textosCheckout.reservar}
        </Link>
        <Link
          to={CARRITO_ROUTES.CARRITO}
          className={buttonStyles({
            variant: 'ghost',
            className: 'w-full sm:w-auto',
          })}
        >
          {textosCheckout.volverCarrito}
        </Link>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onActualizar}
        isLoading={actualizando}
        disabled={actualizando}
      >
        {!actualizando && <RefreshCw className="size-4" aria-hidden="true" />}
        {textosCheckout.actualizar}
      </Button>
    </Card>
  ); };

const CarritoVacioCheckout: React.FC<{
  onActualizar: () => void;
  actualizando: boolean;
}> = ({ onActualizar, actualizando }) => { const textosCheckout = usePublicTexts('checkout'); return (
  <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
    <ShoppingCart className="size-12 text-neutro-400" aria-hidden="true" />
    <div className="flex max-w-md flex-col gap-1">
      <h2 className="text-lg font-serif font-semibold text-neutro-800">
        {textosCheckout.carritoVacioTitulo}
      </h2>
      <p className="text-xs text-neutro-600">
        {textosCheckout.carritoVacioDescripcion}
      </p>
    </div>

    <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
      <Link
        to={RESERVAS_ROUTES.NUEVA}
        className={buttonStyles({ className: 'w-full sm:w-auto' })}
      >
        {textosCheckout.reservar}
      </Link>
      <Link
        to={RESERVAS_ROUTES.MIS_RESERVAS}
        className={buttonStyles({
          variant: 'ghost',
          className: 'w-full sm:w-auto',
        })}
      >
        <CalendarDays className="size-4" aria-hidden="true" />
        {textosCheckout.irMisReservas}
      </Link>
    </div>

    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onActualizar}
      isLoading={actualizando}
      disabled={actualizando}
    >
      {!actualizando && <RefreshCw className="size-4" aria-hidden="true" />}
      {textosCheckout.actualizar}
    </Button>
  </Card>
); };

const PanelError: React.FC<{
  titulo: string;
  descripcion: React.ReactNode;
  onReintentar?: () => void;
  reintentando?: boolean;
}> = ({ titulo, descripcion, onReintentar, reintentando = false }) => { const textosCheckout = usePublicTexts('checkout'); return (
  <Card className="flex flex-col items-start gap-4">
    <Alert tone="error" title={titulo}>
      <p>{descripcion}</p>
    </Alert>
    <div className="flex flex-wrap items-center gap-3">
      {onReintentar && (
        <Button
          type="button"
          variant="primary"
          onClick={onReintentar}
          isLoading={reintentando}
          disabled={reintentando}
        >
          {!reintentando && (
            <RefreshCw className="size-4" aria-hidden="true" />
          )}
          {textosCheckout.reintentar}
        </Button>
      )}
      <Link
        to={CARRITO_ROUTES.CARRITO}
        className={buttonStyles({ variant: 'ghost' })}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {textosCheckout.volverCarrito}
      </Link>
    </div>
  </Card>
); };

const ContenidoCheckout: React.FC<{ userId: number }> = ({ userId }) => {
  const textosCheckout = usePublicTexts('checkout');
  const { p } = usePublicInterface();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const carritoQuery = useCarritoActualQuery(userId);
  const carrito = carritoQuery.data;
  const carritoValido =
    !carritoQuery.isError && carrito && carrito.usuario_id === userId
      ? carrito
      : null;
  const carritoAjeno = Boolean(
    !carritoQuery.isError && carrito && !carritoValido,
  );

  const itemsQuery = useCarritoItemsQuery(carritoValido?.id ?? null, userId);
  const items = itemsQuery.data?.items ?? [];
  const itemsValidos = Boolean(
    carritoValido &&
      itemsQuery.isSuccess &&
      items.every((item) => item.carrito_id === carritoValido.id),
  );
  const itemsListos = Boolean(itemsValidos && items.length > 0);

  const resumenQuery = useResumenCheckoutQuery(
    carritoValido?.id ?? null,
    userId,
    itemsListos,
  );
  const resumen = resumenQuery.data;
  const resumenListo = Boolean(resumenQuery.isSuccess && resumen);
  const cartSummaryMismatch = Boolean(resumen && itemsQuery.data && !montosCoinciden(itemsQuery.data.total, resumen.total));

  const intentoQuery = useIntentoActivoQuery(
    carritoValido?.id ?? null,
    userId,
    resumenListo,
  );
  const intentoServidor = intentoQuery.data ?? null;

  const [intentoCreado, setIntentoCreado] =
    useState<IntentoCreado | null>(null);
  const [pagoCreadoId, setPagoCreadoId] = useState<number | null>(null);
  const [confirmacionEnviada, setConfirmacionEnviada] = useState(false);
  const [conflictoCarrera, setConflictoCarrera] = useState(false);
  const [bloqueoMonto, setBloqueoMonto] = useState<BloqueoMonto | null>(null);
  const [mensaje, setMensaje] = useState<MensajeCheckout | null>(null);
  const [estadoIncierto, setEstadoIncierto] = useState(false);
  const [preparandoStripe, setPreparandoStripe] = useState(false);
  const [verificandoPago, setVerificandoPago] = useState(false);
  const verificandoRef = useRef(false);
  const ultimoCarrito = useRef<number | null>(null);
  const preparandoRef = useRef(false);
  const expiryCheckRef = useRef(false);
  const [expiryChecking, setExpiryChecking] = useState(false);

  const crearIntento = useCrearIntentoPago(userId);

  const carritoId = carritoValido?.id ?? null;
  const intentoCreadoValido =
    intentoCreado && intentoCreado.carritoId === carritoId
      ? intentoCreado
      : null;
  const pagoId =
    intentoServidor?.pago_id ??
    intentoCreadoValido?.pagoId ??
    pagoCreadoId ??
    null;
  const pagoQuery = usePagoQuery(pagoId, userId);
  const pago = pagoQuery.data;

  // Un carrito distinto no debe conservar avisos ni intentos de otro carrito.
  useEffect(() => {
    if (
      carritoId !== null &&
      ultimoCarrito.current !== null &&
      ultimoCarrito.current !== carritoId
    ) {
      setIntentoCreado(null);
      setPagoCreadoId(null);
      setConfirmacionEnviada(false);
      setConflictoCarrera(false);
      setBloqueoMonto(null);
      setMensaje(null);
      setEstadoIncierto(false);
    }

    if (carritoId !== null) {
      ultimoCarrito.current = carritoId;
    }
  }, [carritoId]);

  // Recupera el pago local asociado al intento guardado tras una recarga.
  // Así se puede verificar su estado aunque la consulta del intento falle.
  useEffect(() => {
    if (carritoId === null || pagoCreadoId !== null) return;

    const guardado = getStoredCheckoutAttempt(userId, carritoId);
    if (
      guardado?.pagoId &&
      Number.isSafeInteger(guardado.pagoId) &&
      guardado.pagoId > 0
    ) {
      setPagoCreadoId(guardado.pagoId);
    }
  }, [carritoId, userId, pagoCreadoId]);

  // El servidor es la fuente de verdad del intento recuperado.
  useEffect(() => {
    if (intentoQuery.data) {
      setPagoCreadoId(intentoQuery.data.pago_id);
      setIntentoCreado(null);
      setBloqueoMonto(null);
      setMensaje((actual) => (actual?.comprobar ? null : actual));
    }
  }, [intentoQuery.data]);

  // Si el pago quedó aprobado, la clave de este intento ya no debe reutilizarse.
  // Un intento cancelado no limpia la clave: la pantalla no debe habilitar otro
  // cobro hasta que el backend deje de reportarlo como intento vigente.
  useEffect(() => {
    if (
      pago?.estado === 'aprobado' &&
      carritoId !== null &&
      pago.carrito_id === carritoId
    ) {
      clearCheckoutIdempotencyKey(userId, carritoId);
    }

    // Un estado terminal del pago reemplaza cualquier aviso transitorio de
    // "confirmación enviada" o de error de creación.
    if (
      pago &&
      carritoId !== null &&
      pago.carrito_id === carritoId &&
      (pago.estado === 'aprobado' ||
        pago.estado === 'rechazado' ||
        pago.estado === 'cancelado')
    ) {
      setMensaje(null);
    }
  }, [pago?.estado, pago?.carrito_id, pago, carritoId, userId]);

  // Un 404 al listar artículos indica que el carrito dejó de existir. Se
  // reconsulta el carrito vigente; nunca se crea uno nuevo.
  useEffect(() => {
    if (itemsQuery.isError && esErrorHttp(itemsQuery.error, 404)) {
      void carritoQuery.refetch();
    }
  }, [itemsQuery.isError, itemsQuery.error, carritoQuery]);

  // El resumen deja de ser válido si el carrito venció o cambió de estado.
  useEffect(() => {
    if (
      resumenQuery.isError &&
      (esErrorHttp(resumenQuery.error, 404) ||
        esErrorCarritoNoDisponible(resumenQuery.error))
    ) {
      void carritoQuery.refetch();
    }
  }, [resumenQuery.isError, resumenQuery.error, carritoQuery]);

  const consultarEstado = async (skipPaymentReads = false) => {
    setMensaje(null);

    // Siempre se reconsulta el carrito, incluso cuando la consulta anterior
    // falló o no existía. Así el usuario puede recuperarse de un 404 sin que
    // la pantalla cree un carrito nuevo.
    const tareas: Array<Promise<unknown>> = [carritoQuery.refetch()];

    if (carritoValido) {
      if (itemsQuery.isSuccess || itemsQuery.isError) {
        tareas.push(itemsQuery.refetch());
      }

      if (resumenQuery.isSuccess || resumenQuery.isError) {
        tareas.push(resumenQuery.refetch());
      }

      if (resumenListo && !skipPaymentReads) {
        tareas.push(intentoQuery.refetch());
      }

      if (!skipPaymentReads && pagoId !== null && Number.isSafeInteger(pagoId) && pagoId > 0) {
        tareas.push(pagoQuery.refetch());
      }
    }

    await Promise.allSettled(tareas);
    setEstadoIncierto(false);
    setBloqueoMonto(null);
  };

  const prepararPago = async () => {
    if (
      !carritoValido ||
      expiryCheckRef.current ||
      cartSummaryMismatch ||
      !resumen ||
      resumen.saldo <= 0 ||
      intentoServidor ||
      intentoCreadoValido ||
      conflictoCarrera ||
      estadoIncierto ||
      crearIntento.isPending ||
      intentoQuery.isFetching ||
      pagoQuery.isFetching ||
      preparandoRef.current
    ) {
      return;
    }

    const carritoActual = carritoValido;
    const resumenActual = resumen;
    const montoActual = normalizarMonto(resumenActual.saldo);

    preparandoRef.current = true;
    setMensaje(null);
    setBloqueoMonto(null);
    setPreparandoStripe(true);

    try {
      if (!Number.isFinite(montoActual) || montoActual <= 0) {
        setMensaje({
          tono: 'warning',
          texto: 'errores.crear',
          comprobar: true,
        });
        return;
      }

      // No se crea un intento si el SDK no está disponible: se evita dejar un
      // pago en proceso que el usuario no pueda confirmar.
      const stripe = await getStripe();
      if (!stripe) {
        setMensaje({
          tono: 'warning',
          texto: 'pago.tarjetaNoDisponible',
        });
        return;
      }

      const resultadoClave = getOrCreateCheckoutIdempotencyKey(
        userId,
        carritoActual.id,
        montoActual,
      );

      if (resultadoClave.montoDifiere) {
        setBloqueoMonto({
          anterior: Number(resultadoClave.montoPrevio ?? 0),
          actual: montoActual,
        });
        return;
      }

      crearIntento.mutate(
        {
          carritoId: carritoActual.id,
          monto: montoActual,
          idempotencyKey: resultadoClave.key,
        },
        {
          onSuccess: (data) => {
            setPagoCreadoId(data.pago_id);

            if (data.estado !== 'procesando' || !data.client_secret) {
              setMensaje({
                tono: 'warning',
                titulo: 'pago.titulo',
                texto: 'pago.intentoSinDatos',
                comprobar: true,
              });
              void intentoQuery.refetch();
              return;
            }

            setIntentoCreado({
              carritoId: carritoActual.id,
              pagoId: data.pago_id,
              clientSecret: data.client_secret,
              monto: Number(data.monto),
              moneda: data.moneda,
            });
            setConfirmacionEnviada(false);
            setConflictoCarrera(false);
            setBloqueoMonto(null);
            setMensaje(null);
            setEstadoIncierto(false);

            void resumenQuery.refetch();
            void intentoQuery.refetch();
          },
          onError: (error) => {
            if (
              error instanceof ApiError &&
              error.status === 409 &&
              error.code === 'PAYMENT_EXCEEDS_BALANCE'
            ) {
              setConflictoCarrera(true);
              setMensaje(null);
              crearIntento.reset();
              void Promise.all([
                intentoQuery.refetch(),
                resumenQuery.refetch(),
              ]);
              return;
            }

            if (
              error instanceof ApiError &&
              error.status === 409 &&
              error.code === 'IDEMPOTENCY_CONFLICT'
            ) {
              setMensaje({
                tono: 'warning',
                titulo: 'errores.idempotenciaTitulo',
                texto: 'errores.idempotenciaDescripcion',
                comprobar: true,
              });
              return;
            }

            if (
              esErrorCarritoNoDisponible(error) ||
              esErrorHttp(error, 404)
            ) {
              setMensaje({
                tono: 'warning',
                texto: 'carritoNoDisponibleDescripcion',
                comprobar: true,
              });
              void carritoQuery.refetch();
              void intentoQuery.refetch();
              return;
            }

            if (error instanceof ApiError && error.status === 0) {
              setMensaje({
                tono: 'warning',
                texto: 'errores.crearRed',
                comprobar: true,
              });
              return;
            }

            if (error instanceof ApiError && error.status >= 500) {
              setMensaje({
                tono: 'warning',
                texto: 'errores.crear',
                comprobar: true,
              });
              void resumenQuery.refetch();
              return;
            }

            setMensaje({
              tono: 'warning',
              texto: 'errores.crear',
              apiError: error,
              comprobar: true,
            });
            void resumenQuery.refetch();
          },
        },
      );
    } catch {
      setMensaje({
        tono: 'warning',
        texto: 'errores.crear',
        comprobar: true,
      });
    } finally {
      preparandoRef.current = false;
      setPreparandoStripe(false);
    }
  };

  const verificarEstadoPago = async () => {
    if (verificandoRef.current) return;
    if (pagoId === null || !Number.isSafeInteger(pagoId) || pagoId <= 0) {
      await consultarEstado();
      return;
    }
    verificandoRef.current = true;
    setVerificandoPago(true);
    const expectedCartId = carritoId ?? ultimoCarrito.current;
    try {
      const verified = await pagosApi.verify(pagoId);
      if (!mounted.current) return;
      if (expectedCartId === null || verified.id !== pagoId || verified.carrito_id !== expectedCartId) throw new Error('Payment identity mismatch');
      await consultarEstado();
      const freshPayment = await pagoQuery.refetch();
      if (mounted.current && freshPayment.isSuccess && freshPayment.data?.id === pagoId && freshPayment.data.carrito_id === expectedCartId && freshPayment.data.estado === 'aprobado') {
        navigate(PAGOS_ROUTES.RESULTADO(pagoId), { replace: true });
      }
    } catch (error) {
      setEstadoIncierto(true);
      setMensaje({ tono: 'warning', texto: 'errores.recuperacionDescripcion', apiError: error, comprobar: true });
    } finally {
      verificandoRef.current = false;
      setVerificandoPago(false);
    }
  };

  const confirmacionEnviadaAlServidor = () => {
    setConfirmacionEnviada(true);
    setEstadoIncierto(false);
    setMensaje({
      tono: 'info',
      texto: 'estados.confirmacionEnviada',
    });
    void verificarEstadoPago();
  };

  const estadoConfirmacionIncierto = () => {
    setEstadoIncierto(true);
    setMensaje(null);
    void intentoQuery.refetch();
    void pagoQuery.refetch();
  };

  const comprobarEstado = () => {
    void verificarEstadoPago();
  };

  const errorCarrito = carritoQuery.isError
    ? esErrorHttp(carritoQuery.error, 403)
      ? textosCheckout.errores.acceso
      : <TranslatedError error={{ api: carritoQuery.error }} />
    : null;
  const errorArticulos = itemsQuery.isError
    ? esErrorHttp(itemsQuery.error, 403)
      ? textosCheckout.errores.acceso
      : <TranslatedError error={{ api: itemsQuery.error }} />
    : null;
  const errorResumen = resumenQuery.isError
    ? esErrorHttp(resumenQuery.error, 403)
      ? textosCheckout.errores.acceso
      : <TranslatedError error={{ api: resumenQuery.error }} />
    : null;

  const pagoDelCarrito =
    pago && carritoId !== null && pago.carrito_id === carritoId ? pago : null;
  const pagoAprobado = pagoDelCarrito?.estado === 'aprobado';
  const pagoRechazado = pagoDelCarrito?.estado === 'rechazado';
  const pagoCancelado = pagoDelCarrito?.estado === 'cancelado';

  const intentoRequiereConfirmacion =
    intentoServidor?.estado_intento === 'requiere_confirmacion';
  const intentoCancelado =
    intentoServidor?.estado_intento === 'cancelado' || pagoCancelado;
  const intentoProcesando =
    intentoServidor?.estado_intento === 'procesando';
  const intentoCompletado =
    intentoServidor?.estado_intento === 'completado_en_pasarela';

  const intentoParaFormulario =
    intentoRequiereConfirmacion && intentoServidor.client_secret
      ? {
          pagoId: intentoServidor.pago_id,
          clientSecret: intentoServidor.client_secret,
          monto: Number(intentoServidor.monto),
          moneda: intentoServidor.moneda,
          puedeConfirmar: intentoServidor.puede_confirmar,
        }
      : intentoCreadoValido && !intentoServidor
        ? {
            pagoId: intentoCreadoValido.pagoId,
            clientSecret: intentoCreadoValido.clientSecret,
            monto: intentoCreadoValido.monto,
            moneda: intentoCreadoValido.moneda,
            puedeConfirmar: true,
          }
        : null;

  const montoDifiere = Boolean(
    intentoParaFormulario &&
      resumen &&
      !montosCoinciden(intentoParaFormulario.monto, resumen.saldo),
  );

  const mostrarFormulario = Boolean(
    intentoParaFormulario &&
      !montoDifiere &&
      !cartSummaryMismatch &&
      intentoParaFormulario.moneda === 'GTQ' &&
      intentoParaFormulario.puedeConfirmar &&
      intentoParaFormulario.clientSecret &&
      !confirmacionEnviada && !verificandoPago &&
      !estadoIncierto &&
      !pagoAprobado &&
      !pagoRechazado &&
      !pagoCancelado &&
      !intentoCancelado &&
      !intentoProcesando &&
      !intentoCompletado,
  );

  const intentoIncompleto = Boolean(
    intentoRequiereConfirmacion && !intentoParaFormulario,
  );

  // El pago guardado es la única fuente cuando no hay intento activo ni una
  // respuesta de creación en esta pestaña. Su consulta también puede fallar.
  const pagoIdValido =
    pagoId !== null && Number.isSafeInteger(pagoId) && pagoId > 0;
  const pagoSoloGuardado =
    !intentoServidor && !intentoCreadoValido && pagoIdValido;
  const pagoGuardadoEnProceso = Boolean(
    pagoSoloGuardado &&
      (pagoDelCarrito?.estado === 'pendiente' ||
        pagoDelCarrito?.estado === 'procesando'),
  );

  const mostrarEstadoRecuperacion =
    !pagoAprobado &&
    !pagoRechazado &&
    !pagoCancelado &&
    ((intentoQuery.isError && !intentoCreadoValido) ||
      (confirmacionEnviada && pagoQuery.isError) ||
      (pagoSoloGuardado && pagoQuery.isError));

  const consultaIntentoEnCurso =
    !intentoServidor &&
    !intentoCreadoValido &&
    (intentoQuery.isPending || intentoQuery.isFetching);
  const consultaPagoEnCurso =
    pagoSoloGuardado && (pagoQuery.isPending || pagoQuery.isFetching);

  const mostrarCargandoIntento =
    !pagoAprobado &&
    !pagoRechazado &&
    !pagoCancelado &&
    !mostrarEstadoRecuperacion &&
    (consultaIntentoEnCurso || consultaPagoEnCurso);

  const mostrarCta =
    !cartSummaryMismatch &&
    !expiryChecking &&
    !pagoIdValido &&
    !intentoServidor &&
    !intentoCreadoValido &&
    !conflictoCarrera &&
    !bloqueoMonto &&
    !mostrarEstadoRecuperacion &&
    !mostrarCargandoIntento &&
    !estadoIncierto &&
    !mensaje?.comprobar &&
    !pagoAprobado &&
    !pagoRechazado &&
    !pagoCancelado &&
    !pagoGuardadoEnProceso;

  const sinSaldoPendiente = Boolean(resumen && resumen.saldo <= 0);

  const checkExpiry = async () => {
    const cart = carritoId ?? ultimoCarrito.current;
    if (cart === null || expiryCheckRef.current) return;
    expiryCheckRef.current = true;
    setExpiryChecking(true);
    try {
      const verification = await verifyCartPayment(queryClient, userId, cart, pagoIdValido ? pagoId : null);
      if (verification.paymentId !== null) setPagoCreadoId(verification.paymentId);
      await consultarEstado(true);
      setEstadoIncierto(verification.uncertain);
    } finally { expiryCheckRef.current = false; setExpiryChecking(false); }
  };

  return (
    <section
      aria-labelledby="titulo-checkout"
      className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8"
    >
      <PurchaseSteps current={1} allowCartReturn={!intentoServidor && !intentoCreadoValido && !pagoIdValido && !estadoIncierto} />
      <div className="flex flex-col gap-1.5">
        <p className="eyebrow">{textosCheckout.subtitulo}</p>
        <h1
          id="titulo-checkout"
          className="text-[2rem] leading-[2.375rem] text-neutro-900 md:text-[2.5rem] md:leading-[3rem]"
        >
          {textosCheckout.titulo}
        </h1>
        <p className="max-w-2xl text-sm text-neutro-600">
          {textosCheckout.descripcion}
        </p>
        {carritoValido && (
          <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-neutro-500">
            {textosCheckout.carritoNumero(carritoValido.id)}
          </p>
        )}
      </div>

      {carritoValido && <CartExpiry expiresAt={carritoValido.expira_en} onCheck={() => { void checkExpiry(); }} />}
      {cartSummaryMismatch && <Alert tone="error">{p('purchaseTotalsMismatch')}</Alert>}
      {intentoParaFormulario && intentoParaFormulario.moneda !== 'GTQ' && <Alert tone="error">{p('purchaseCurrencyMismatch')}</Alert>}
      {carritoQuery.isPending && (
        <div className="flex justify-center py-12">
          <LoadingNotice label={textosCheckout.cargandoCarrito} />
        </div>
      )}

      {carritoQuery.isError &&
        (esErrorHttp(carritoQuery.error, 404) ? (
          (pagoIdValido || estadoIncierto) ? <Card className="flex flex-col gap-4"><Alert tone="info">{p('purchaseExpiredPayment')}</Alert><Button variant="ghost" onClick={() => { void checkExpiry(); }}>{textosCheckout.comprobarEstado}</Button>{pagoIdValido && <Link className={buttonStyles()} to={PAGOS_ROUTES.RESULTADO(pagoId!)}>{textosCheckout.verResultado}</Link>}</Card> : <SinCarrito
            onActualizar={comprobarEstado}
            actualizando={carritoQuery.isFetching}
          />
        ) : (
          <PanelError
            titulo={textosCheckout.errores.carrito}
            descripcion={errorCarrito ?? textosCheckout.errores.carrito}
            onReintentar={comprobarEstado}
            reintentando={carritoQuery.isFetching}
          />
        ))}

      {carritoAjeno && (
        <PanelError
          titulo={textosCheckout.errores.acceso}
          descripcion={textosCheckout.errores.acceso}
          onReintentar={comprobarEstado}
          reintentando={carritoQuery.isFetching}
        />
      )}

      {carritoValido && itemsQuery.isPending && (
        <div className="flex justify-center py-12">
          <LoadingNotice label={textosCheckout.cargandoArticulos} />
        </div>
      )}

      {carritoValido &&
        itemsQuery.isError &&
        (esErrorHttp(itemsQuery.error, 404) ? (
          <PanelError
            titulo={textosCheckout.carritoNoDisponibleTitulo}
            descripcion={textosCheckout.carritoNoDisponibleDescripcion}
            onReintentar={comprobarEstado}
            reintentando={itemsQuery.isFetching}
          />
        ) : (
          <PanelError
            titulo={textosCheckout.errores.articulos}
            descripcion={errorArticulos ?? textosCheckout.errores.articulos}
            onReintentar={comprobarEstado}
            reintentando={itemsQuery.isFetching}
          />
        ))}

      {carritoValido && itemsQuery.isSuccess && !itemsValidos && (
        <PanelError
          titulo={textosCheckout.errores.acceso}
          descripcion={textosCheckout.errores.acceso}
          onReintentar={comprobarEstado}
          reintentando={itemsQuery.isFetching}
        />
      )}

      {carritoValido && itemsValidos && items.length === 0 && (
        <CarritoVacioCheckout
          onActualizar={comprobarEstado}
          actualizando={itemsQuery.isFetching}
        />
      )}

      {carritoValido && itemsListos && resumenQuery.isPending && (
        <div className="flex justify-center py-12">
          <LoadingNotice label={textosCheckout.cargandoResumen} />
        </div>
      )}

      {carritoValido &&
        itemsListos &&
        resumenQuery.isError && (
          <PanelError
            titulo={textosCheckout.errores.resumen}
            descripcion={errorResumen ?? textosCheckout.errores.resumen}
            onReintentar={comprobarEstado}
            reintentando={resumenQuery.isFetching}
          />
        )}

      {carritoValido &&
        itemsListos &&
        resumenListo &&
        resumen && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
            <div className="flex min-w-0 flex-col gap-6"><AccountContact /><ListaArticulosCheckout items={items} /></div>

            <div className="flex flex-col gap-6">
              <ResumenCheckout
                resumen={resumen}
                cantidadArticulos={items.length}
              />

              <Card className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <p className="eyebrow">{textosCheckout.pago.titulo}</p>
                  <h2 className="text-lg font-serif font-semibold text-neutro-900">
                    {textosCheckout.pago.titulo}
                  </h2>
                </div>

                {mensaje && (
                  <div className="flex flex-col items-start gap-3">
                    <Alert
                      tone={mensaje.tono}
                      title={mensaje.titulo ? checkoutCopy(textosCheckout, mensaje.titulo) : undefined}
                    >
                      {mensaje.apiError ? <TranslatedError error={{ api: mensaje.apiError }} /> : checkoutCopy(textosCheckout, mensaje.texto)}
                    </Alert>
                    <div className="flex flex-wrap gap-2">
                      {mensaje.comprobar && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={comprobarEstado}
                          disabled={verificandoPago}
                        >
                          <RefreshCw
                            className="size-4"
                            aria-hidden="true"
                          />
                          {textosCheckout.comprobarEstado}
                        </Button>
                      )}
                      {!mensaje.comprobar && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setMensaje(null)}
                        >
                          {textosCheckout.descartar}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {conflictoCarrera &&
                  !pagoAprobado &&
                  !pagoRechazado &&
                  !pagoCancelado && (
                    <div className="flex flex-col items-start gap-3">
                      <Alert
                        tone="warning"
                        title={textosCheckout.errores.conflictoTitulo}
                      >
                        <p>{textosCheckout.errores.conflictoDescripcion}</p>
                        {!intentoServidor && (
                          <p>{textosCheckout.errores.conflictoSinIntento}</p>
                        )}
                      </Alert>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={comprobarEstado}
                          disabled={verificandoPago}
                      >
                        <RefreshCw className="size-4" aria-hidden="true" />
                        {textosCheckout.comprobarEstado}
                      </Button>
                    </div>
                  )}

                {bloqueoMonto &&
                  !pagoAprobado &&
                  !pagoRechazado &&
                  !pagoCancelado && (
                    <div className="flex flex-col items-start gap-3">
                      <Alert
                        tone="warning"
                        title={textosCheckout.errores.montoDifiereTitulo}
                      >
                        <p>{textosCheckout.errores.montoDifiereDescripcion}</p>
                        <p>
                          {textosCheckout.errores.intentoMonto(
                            formatearGTQ(bloqueoMonto.anterior),
                          )}
                        </p>
                        <p>
                          {textosCheckout.errores.saldoActual(
                            formatearGTQ(bloqueoMonto.actual),
                          )}
                        </p>
                      </Alert>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={comprobarEstado}
                          disabled={verificandoPago}
                      >
                        <RefreshCw className="size-4" aria-hidden="true" />
                        {textosCheckout.comprobarEstado}
                      </Button>
                    </div>
                  )}

                {mostrarEstadoRecuperacion && (
                  <div className="flex flex-col items-start gap-3">
                    <Alert
                      tone="error"
                      title={textosCheckout.errores.recuperacionTitulo}
                    >
                      <p>{textosCheckout.errores.recuperacionDescripcion}</p>
                    </Alert>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={comprobarEstado}
                          isLoading={verificandoPago || intentoQuery.isFetching || pagoQuery.isFetching}
                      disabled={verificandoPago || intentoQuery.isFetching || pagoQuery.isFetching}
                    >
                      {textosCheckout.comprobarEstado}
                    </Button>
                  </div>
                )}

                {mostrarCargandoIntento && !mostrarEstadoRecuperacion && (
                  <LoadingNotice label={textosCheckout.cargandoIntento} />
                )}

                {!mostrarEstadoRecuperacion &&
                  !mostrarCargandoIntento &&
                  pagoAprobado && (
                    <div className="flex flex-col items-start gap-3">
                      <Alert tone="success" title={textosCheckout.estados.exitoTitulo}>
                        <p>{textosCheckout.estados.exitoDescripcion}</p>
                        {pago && (
                          <p>{textosCheckout.pago.importe}: {formatearGTQ(pago.monto)}</p>
                        )}
                      </Alert>
                      <div className="flex flex-wrap gap-2">
                        {pago && (
                          <Link
                            to={PAGOS_ROUTES.RESULTADO(pago.id)}
                            className={buttonStyles({ size: 'sm' })}
                          >
                            {textosCheckout.verResultado}
                          </Link>
                        )}
                        <Link
                          to={CARRITO_ROUTES.CARRITO}
                          className={buttonStyles({
                            variant: 'ghost',
                            size: 'sm',
                          })}
                        >
                          {textosCheckout.volverCarrito}
                        </Link>
                      </div>
                    </div>
                  )}

                {!mostrarEstadoRecuperacion &&
                  !mostrarCargandoIntento &&
                  !pagoAprobado &&
                  (pagoRechazado || pagoCancelado) && (
                    <div className="flex flex-col items-start gap-3">
                      <Alert
                        tone="warning"
                        title={
                          pagoCancelado
                            ? textosCheckout.estados.canceladoTitulo
                            : textosCheckout.estados.rechazadoTitulo
                        }
                      >
                        <p>
                          {pagoCancelado
                            ? textosCheckout.estados.canceladoDescripcion
                            : textosCheckout.estados.rechazadoDescripcion}
                        </p>
                      </Alert>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={comprobarEstado}
                          disabled={verificandoPago}
                        >
                          <RefreshCw className="size-4" aria-hidden="true" />
                          {textosCheckout.comprobarEstado}
                        </Button>
                        <Link
                          to={CARRITO_ROUTES.CARRITO}
                          className={buttonStyles({
                            variant: 'ghost',
                            size: 'sm',
                          })}
                        >
                          {textosCheckout.volverCarrito}
                        </Link>
                      </div>
                    </div>
                  )}

                {!mostrarEstadoRecuperacion &&
                  !mostrarCargandoIntento &&
                  !pagoAprobado &&
                  !pagoRechazado &&
                  !pagoCancelado &&
                  confirmacionEnviada && (
                    <div className="flex flex-col items-start gap-3">
                      <Alert
                        tone="info"
                        title={textosCheckout.estados.procesandoTitulo}
                      >
                        <p>{textosCheckout.estados.procesandoDescripcion}</p>
                      </Alert>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={comprobarEstado}
                          isLoading={verificandoPago || pagoQuery.isFetching || intentoQuery.isFetching}
                        disabled={verificandoPago || pagoQuery.isFetching || intentoQuery.isFetching}
                      >
                        {textosCheckout.comprobarEstado}
                      </Button>
                    </div>
                  )}

                {!mostrarEstadoRecuperacion &&
                  !mostrarCargandoIntento &&
                  !pagoAprobado &&
                  !pagoRechazado &&
                  !pagoCancelado &&
                  !confirmacionEnviada &&
                  estadoIncierto && (
                    <div className="flex flex-col items-start gap-3">
                      <Alert
                        tone="warning"
                        title={textosCheckout.errores.recuperacionTitulo}
                      >
                        <p>{textosCheckout.errores.confirmacionIncierta}</p>
                      </Alert>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={comprobarEstado}
                          disabled={verificandoPago}
                      >
                        <RefreshCw className="size-4" aria-hidden="true" />
                        {textosCheckout.comprobarEstado}
                      </Button>
                    </div>
                  )}

                {!mostrarEstadoRecuperacion &&
                  !mostrarCargandoIntento &&
                  !pagoAprobado &&
                  !pagoRechazado &&
                  !pagoCancelado &&
                  !confirmacionEnviada &&
                  !estadoIncierto &&
                  !mostrarFormulario &&
                  intentoCancelado && (
                    <div className="flex flex-col items-start gap-3">
                      <Alert
                        tone="warning"
                        title={textosCheckout.estados.canceladoTitulo}
                      >
                        <p>{textosCheckout.estados.canceladoDescripcion}</p>
                      </Alert>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={comprobarEstado}
                          disabled={verificandoPago}
                        >
                          <RefreshCw className="size-4" aria-hidden="true" />
                          {textosCheckout.comprobarEstado}
                        </Button>
                        <Link
                          to={CARRITO_ROUTES.CARRITO}
                          className={buttonStyles({
                            variant: 'ghost',
                            size: 'sm',
                          })}
                        >
                          {textosCheckout.volverCarrito}
                        </Link>
                      </div>
                    </div>
                  )}

                {!mostrarEstadoRecuperacion &&
                  !mostrarCargandoIntento &&
                  !pagoAprobado &&
                  !pagoRechazado &&
                  !pagoCancelado &&
                  !confirmacionEnviada &&
                  !estadoIncierto &&
                  intentoCompletado && (
                    <div className="flex flex-col items-start gap-3">
                      <Alert
                        tone="info"
                        title={textosCheckout.estados.completadoTitulo}
                      >
                        <p>{textosCheckout.estados.completadoDescripcion}</p>
                      </Alert>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={comprobarEstado}
                          disabled={verificandoPago}
                      >
                        {textosCheckout.comprobarEstado}
                      </Button>
                    </div>
                  )}

                {!mostrarEstadoRecuperacion &&
                  !mostrarCargandoIntento &&
                  !pagoAprobado &&
                  !pagoRechazado &&
                  !pagoCancelado &&
                  !confirmacionEnviada &&
                  !estadoIncierto &&
                  (intentoProcesando || pagoGuardadoEnProceso) && (
                    <div className="flex flex-col items-start gap-3">
                      <Alert
                        tone="info"
                        title={textosCheckout.estados.procesandoTitulo}
                      >
                        <p>{textosCheckout.estados.procesandoDescripcion}</p>
                      </Alert>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={comprobarEstado}
                          disabled={verificandoPago}
                      >
                        {textosCheckout.comprobarEstado}
                      </Button>
                    </div>
                  )}

                {!mostrarEstadoRecuperacion &&
                  !mostrarCargandoIntento &&
                  !pagoAprobado &&
                  !pagoRechazado &&
                  !pagoCancelado &&
                  !confirmacionEnviada &&
                  !estadoIncierto &&
                  montoDifiere &&
                  intentoParaFormulario && (
                    <div className="flex flex-col items-start gap-3">
                      <Alert
                        tone="warning"
                        title={textosCheckout.errores.montoDifiereTitulo}
                      >
                        <p>{textosCheckout.errores.montoDifiereDescripcion}</p>
                        <p>
                          {textosCheckout.errores.intentoMonto(
                            formatearGTQ(intentoParaFormulario.monto),
                          )}
                        </p>
                        <p>
                          {textosCheckout.errores.saldoActual(
                            formatearGTQ(resumen?.saldo),
                          )}
                        </p>
                      </Alert>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={comprobarEstado}
                          disabled={verificandoPago}
                        >
                          <RefreshCw className="size-4" aria-hidden="true" />
                          {textosCheckout.comprobarEstado}
                        </Button>
                        <Link
                          to={CARRITO_ROUTES.CARRITO}
                          className={buttonStyles({
                            variant: 'ghost',
                            size: 'sm',
                          })}
                        >
                          {textosCheckout.volverCarrito}
                        </Link>
                      </div>
                    </div>
                  )}

                {!mostrarEstadoRecuperacion &&
                  !mostrarCargandoIntento &&
                  !pagoAprobado &&
                  !pagoRechazado &&
                  !pagoCancelado &&
                  !confirmacionEnviada &&
                  !estadoIncierto &&
                  !montoDifiere &&
                  intentoParaFormulario &&
                  !intentoParaFormulario.puedeConfirmar && (
                    <div className="flex flex-col items-start gap-3">
                      <Alert tone="warning">
                        {textosCheckout.pago.intentoIncompleto}
                      </Alert>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={comprobarEstado}
                          disabled={verificandoPago}
                      >
                        {textosCheckout.comprobarEstado}
                      </Button>
                    </div>
                  )}

                {mostrarFormulario && intentoParaFormulario && (
                  <div className="flex flex-col gap-3">
                    <StripePaymentForm
                      blocked={expiryChecking || verificandoPago}
                      clientSecret={intentoParaFormulario.clientSecret}
                      monto={intentoParaFormulario.monto}
                      moneda={intentoParaFormulario.moneda}
                      pagoId={intentoParaFormulario.pagoId}
                      onConfirmacionEnviada={confirmacionEnviadaAlServidor}
                      onEstadoIncierto={estadoConfirmacionIncierto}
                    />
                    <LegalNotice />
                  </div>
                )}

                {!mostrarEstadoRecuperacion &&
                  !mostrarCargandoIntento &&
                  !pagoAprobado &&
                  !pagoRechazado &&
                  !pagoCancelado &&
                  !confirmacionEnviada &&
                  !estadoIncierto &&
                  !intentoCancelado &&
                  !intentoCompletado &&
                  !intentoProcesando &&
                  !montoDifiere &&
                  intentoIncompleto && (
                    <div className="flex flex-col items-start gap-3">
                      <Alert tone="warning">
                        {textosCheckout.pago.intentoIncompleto}
                      </Alert>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={comprobarEstado}
                          disabled={verificandoPago}
                      >
                        {textosCheckout.comprobarEstado}
                      </Button>
                    </div>
                  )}

                {!mostrarEstadoRecuperacion &&
                  !mostrarCargandoIntento &&
                  !pagoAprobado &&
                  !pagoRechazado &&
                  !pagoCancelado &&
                  !confirmacionEnviada &&
                  !estadoIncierto &&
                  !intentoCancelado &&
                  !intentoCompletado &&
                  !intentoProcesando &&
                  !intentoIncompleto &&
                  !intentoParaFormulario &&
                  sinSaldoPendiente && (
                    <div className="flex flex-col items-start gap-3">
                      <Alert
                        tone="success"
                        title={textosCheckout.pago.noSaldoTitulo}
                      >
                        {textosCheckout.pago.noSaldoDescripcion}
                      </Alert>
                      <Link
                        to={CARRITO_ROUTES.CARRITO}
                        className={buttonStyles({ variant: 'ghost', size: 'sm' })}
                      >
                        {textosCheckout.volverCarrito}
                      </Link>
                    </div>
                  )}

                {mostrarCta && !sinSaldoPendiente && (
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-neutro-600">
                      {textosCheckout.pago.crearIntento}
                    </p>
                    <Button
                      type="button"
                      size="lg"
                      className="w-full"
                      isLoading={preparandoStripe || crearIntento.isPending}
                      disabled={
                        preparandoStripe ||
                        crearIntento.isPending ||
                        resumenQuery.isFetching ||
                        intentoQuery.isFetching
                      }
                      onClick={() => {
                        void prepararPago();
                      }}
                    >
                      {!preparandoStripe && !crearIntento.isPending && (
                        <CreditCard className="size-4" aria-hidden="true" />
                      )}
                      {preparandoStripe || crearIntento.isPending
                        ? textosCheckout.pago.preparando
                        : textosCheckout.pago.preparar}
                    </Button>
                  </div>
                )}

                {!mostrarEstadoRecuperacion &&
                  !mostrarCargandoIntento &&
                  !pagoAprobado &&
                  !pagoRechazado &&
                  !pagoCancelado &&
                  !confirmacionEnviada &&
                  !estadoIncierto &&
                  !intentoCancelado &&
                  !intentoCompletado &&
                  !intentoProcesando &&
                  !intentoIncompleto &&
                  !intentoParaFormulario &&
                  !mostrarCta &&
                  !sinSaldoPendiente &&
                  !conflictoCarrera &&
                  !bloqueoMonto &&
                  !mensaje?.comprobar && (
                    <div className="flex flex-col items-start gap-3">
                      <Alert tone="error">
                        {textosCheckout.errores.crear}
                      </Alert>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={comprobarEstado}
                          disabled={verificandoPago}
                      >
                        <RefreshCw className="size-4" aria-hidden="true" />
                        {textosCheckout.comprobarEstado}
                      </Button>
                    </div>
                  )}
              </Card>
            </div>
          </div>
        )}

      <div className="flex flex-wrap gap-3">
        <Link
          to={CARRITO_ROUTES.CARRITO}
          className={buttonStyles({ variant: 'ghost' })}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {textosCheckout.volverCarrito}
        </Link>
      </div>
    </section>
  );
};

/**
 * Checkout del cliente autenticado.
 *
 * La ruta global se conecta fuera de este archivo. Visitar la pantalla solo
 * consulta datos; nunca crea ni confirma un intento de pago por sí sola.
 */
export const CheckoutPage: React.FC = () => (
  <ClienteCheckoutGate>
    {(user) => <ContenidoCheckout key={user.id} userId={user.id} />}
  </ClienteCheckoutGate>
);
