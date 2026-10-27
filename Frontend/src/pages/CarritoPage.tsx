import { useQueryClient } from '@tanstack/react-query';
import { verifyCartPayment } from '@/features/compra/verifyCartPayment';
import { groupItems, itemTypeLabel } from '@/features/compra/itemGroups';
import { PurchaseSteps } from '@/features/compra/PurchaseSteps';
import { CartExpiry } from '@/features/compra/CartExpiry';
import { useCartPaymentLock } from '@/features/compra/useCartPaymentLock';
import { usePublicInterface } from '@/i18n/public';
import { usePublicTexts, TranslatedError } from '@/i18n/public';
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Plus, RefreshCw } from 'lucide-react';
import { ApiError } from '@/api/client/http';

import { Button, buttonStyles } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { RESERVAS_ROUTES } from '@/features/reservas';
import type { CarritoItem } from '@/features/carrito/types';
import { ClienteCarritoGate } from '@/features/carrito/components/ClienteCarritoGate';
import { CarritoError } from '@/features/carrito/components/CarritoError';
import { CarritoItemCard } from '@/features/carrito/components/CarritoItemCard';
import { CarritoVacio } from '@/features/carrito/components/CarritoVacio';
import { ConfirmarRetiroModal } from '@/features/carrito/components/ConfirmarRetiroModal';
import { ResumenCarrito } from '@/features/carrito/components/ResumenCarrito';
import {
  codigoErrorCarrito,
  esErrorHttp,
  useCarritoActualQuery,
  useCarritoItemsQuery,
} from '@/features/carrito/hooks/useCarritoPantalla';
import { useRetirarItemCarrito } from '@/features/carrito/hooks/useRetirarItemCarrito';


interface MensajeCarrito {
  tono: 'success' | 'info' | 'warning';
  texto: 'retiroExito' | 'retiroArticuloAusente' | 'retiroCarritoVencido' | 'retiroSinAcceso' | 'retiroRed' | 'retiroError';
  /** Ofrece una consulta manual cuando el resultado de la retirada es incierto. */
  comprobar?: boolean;
}

interface ErrorConsulta {
  titulo: string;
  descripcion: React.ReactNode;
}

function describirErrorConsulta(
  error: unknown,
  titulo: string,
  textosCarrito: ReturnType<typeof usePublicTexts<'carrito'>>,
): ErrorConsulta {
  if (esErrorHttp(error, 403)) {
    return {
      titulo: textosCarrito.errorAccesoTitulo,
      descripcion: textosCarrito.errorAccesoDescripcion,
    };
  }

  if (esErrorHttp(error, 0)) {
    return {
      titulo: textosCarrito.errorConexionTitulo,
      descripcion: textosCarrito.errorConexionDescripcion,
    };
  }

  return { titulo, descripcion: <TranslatedError error={{ api: error }} /> };
}

function describirErrorRetiro(error: unknown): MensajeCarrito {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return {
        tono: 'warning',
        texto: 'retiroRed',
        comprobar: true,
      };
    }

    if (error.status === 403) {
      return {
        tono: 'warning',
        texto: 'retiroSinAcceso',
        comprobar: true,
      };
    }

    if (error.status === 409) {
      return {
        tono: 'warning',
        texto: 'retiroCarritoVencido',
      };
    }

    if (error.status === 404) {
      return codigoErrorCarrito(error) === 'CART_ITEM_NOT_FOUND'
        ? {
            tono: 'info',
            texto: 'retiroArticuloAusente',
          }
        : {
            tono: 'warning',
            texto: 'retiroCarritoVencido',
          };
    }

    if (error.status >= 500) {
      return {
        tono: 'warning',
        texto: 'retiroError',
        comprobar: true,
      };
    }
  }

  return {
    tono: 'warning',
    texto: 'retiroError',
    comprobar: true,
  };
}

const ContenidoCarrito: React.FC<{ userId: number }> = ({ userId }) => {
  const textosCarrito = usePublicTexts('carrito');
  const { p, locale } = usePublicInterface();
  const retiringRef = useRef(false);
  const queryClient = useQueryClient();
  const [knownPaymentId, setKnownPaymentId] = useState<number | null>(null);
  const [uncertainPayment, setUncertainPayment] = useState(false);
  const carritoQuery = useCarritoActualQuery(userId);
  const carrito = carritoQuery.data;
  // Una consulta en error no debe seguir presentando el carrito que quedó en
  // caché: el estado vigente es desconocido hasta que el servidor responda.
  const carritoValido =
    !carritoQuery.isError && carrito && carrito.usuario_id === userId
      ? carrito
      : null;
  const carritoAjeno = Boolean(
    !carritoQuery.isError && carrito && !carritoValido,
  );

  const itemsQuery = useCarritoItemsQuery(
    carritoValido?.id ?? null,
    userId,
  );
  const retirar = useRetirarItemCarrito(userId);
  const paymentLock = useCartPaymentLock(carritoValido?.id ?? null, userId);

  const [itemAConfirmar, setItemAConfirmar] =
    useState<CarritoItem | null>(null);
  const [mensaje, setMensaje] = useState<MensajeCarrito | null>(null);
  const ultimoCarritoId = useRef<number | null>(null);

  const { refetch: refetchCarrito } = carritoQuery;
  const { refetch: refetchItems } = itemsQuery;

  // Si aparece un carrito distinto, se descartan los avisos del anterior. Si el
  // carrito simplemente vence, el aviso de expiración se conserva.
  useEffect(() => {
    const idActual = carritoValido?.id ?? null;

    if (
      idActual !== null &&
      ultimoCarritoId.current !== null &&
      ultimoCarritoId.current !== idActual
    ) {
      setMensaje(null);
      setItemAConfirmar(null);
      setKnownPaymentId(null);
      setUncertainPayment(false);
    }

    if (idActual !== null) {
      ultimoCarritoId.current = idActual;
    }
  }, [carritoValido?.id]);

  // Un 404 al listar artículos significa que el carrito dejó de existir. Se
  // vuelve a consultar el carrito vigente; nunca se crea uno nuevo.
  useEffect(() => {
    if (itemsQuery.isError && esErrorHttp(itemsQuery.error, 404)) {
      void refetchCarrito();
    }
  }, [itemsQuery.isError, itemsQuery.error, refetchCarrito]);

  // Una confirmación abierta no debe sobrevivir a un cambio de carrito.
  useEffect(() => {
    if (itemAConfirmar && (itemAConfirmar.carrito_id !== carritoValido?.id || paymentLock.locked)) {
      setItemAConfirmar(null);
    }
  }, [carritoValido?.id, itemAConfirmar, paymentLock.locked]);

  const items = itemsQuery.data?.items ?? [];
  const datosInvalidos = Boolean(
    carritoValido &&
      itemsQuery.data &&
      items.some((item) => item.carrito_id !== carritoValido.id),
  );

  const sinCarritoActivo =
    carritoQuery.isError && esErrorHttp(carritoQuery.error, 404);
  const carritoError = carritoQuery.isError && !sinCarritoActivo;
  const itemsSinCarrito =
    itemsQuery.isError && esErrorHttp(itemsQuery.error, 404);
  const itemsError = itemsQuery.isError && !itemsSinCarrito;

  const errorCarrito = carritoError
    ? describirErrorConsulta(
        carritoQuery.error,
        textosCarrito.errorCarritoTitulo,
        textosCarrito,
      )
    : null;
  const errorArticulos = itemsError
    ? describirErrorConsulta(
        itemsQuery.error,
        textosCarrito.errorArticulosTitulo,
        textosCarrito,
      )
    : null;

  const consultarEstado = () => {
    void refetchCarrito();
    if (carritoValido) {
      void refetchItems();
    }
  };

  const checkExpiry = async () => {
    const cart = carritoValido?.id ?? ultimoCarritoId.current;
    if (cart === null) return;
    const verification = await verifyCartPayment(queryClient, userId, cart, paymentLock.attempt.data?.pago_id ?? knownPaymentId);
    setKnownPaymentId(verification.paymentId);
    setUncertainPayment(verification.uncertain);
    consultarEstado();
  };

  const abrirConfirmacion = (item: CarritoItem) => {
    if (paymentLock.locked) return;
    setMensaje(null);
    setItemAConfirmar(item);
  };

  const cerrarConfirmacion = () => {
    if (!retirar.isPending) {
      setItemAConfirmar(null);
    }
  };

  const confirmarRetiro = () => {
    if (
      paymentLock.locked ||
      retiringRef.current ||
      !itemAConfirmar ||
      !carritoValido ||
      retirar.isPending ||
      itemAConfirmar.carrito_id !== carritoValido.id
    ) {
      if (
        itemAConfirmar &&
        carritoValido &&
        itemAConfirmar.carrito_id !== carritoValido.id
      ) {
        setItemAConfirmar(null);
      }
      return;
    }

    if (carritoValido.expira_en && new Date(carritoValido.expira_en).getTime() <= Date.now()) { consultarEstado(); return; }
    retiringRef.current = true;
    const carritoId = carritoValido.id;
    const itemId = itemAConfirmar.id;

    retirar.mutate(
      { carritoId, itemId },
      {
        onSettled: () => { retiringRef.current = false; },
        onSuccess: () => {
          setItemAConfirmar(null);
          setMensaje({
            tono: 'success',
            texto: 'retiroExito',
          });
        },
        onError: (error) => {
          setItemAConfirmar(null);
          setMensaje(describirErrorRetiro(error));
        },
      },
    );
  };

  return (
    <section
      aria-labelledby="titulo-carrito"
      className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8"
    >
      <PurchaseSteps current={0} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow">{textosCarrito.subtitulo}</p>
          <h1
            id="titulo-carrito"
            className="text-[2rem] leading-[2.375rem] text-neutro-900 md:text-[2.5rem] md:leading-[3rem]"
          >
            {textosCarrito.titulo}
          </h1>
          <p className="max-w-2xl text-sm text-neutro-600">
            {textosCarrito.descripcion}
          </p>
          {carritoValido && (
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-neutro-500">
              {textosCarrito.carritoNumero(carritoValido.id)}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            to="/habitaciones"
            className={buttonStyles({ className: 'w-full sm:w-auto' })}
          >
            <Plus className="size-4" aria-hidden="true" />
            {textosCarrito.reservar}
          </Link>
          <Link
            to={RESERVAS_ROUTES.MIS_RESERVAS}
            className={buttonStyles({
              variant: 'ghost',
              className: 'w-full sm:w-auto',
            })}
          >
            <CalendarDays className="size-4" aria-hidden="true" />
            {textosCarrito.irMisReservas}
          </Link>
        </div>
      </div>

      {mensaje && (
        <div className="flex flex-col items-start gap-3">
          <Alert tone={mensaje.tono}>{textosCarrito[mensaje.texto]}</Alert>
          <div className="flex flex-wrap gap-2">
            {mensaje.comprobar && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={consultarEstado}
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                {textosCarrito.comprobarEstado}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMensaje(null)}
            >
              {textosCarrito.descartar}
            </Button>
          </div>
        </div>
      )}

      {carritoValido && <CartExpiry expiresAt={carritoValido.expira_en} onCheck={() => { void checkExpiry(); }} />}
      {paymentLock.locked && carritoValido && <Alert tone="info"><p>{p('purchaseLocked')}</p><Link to="/checkout" className="inline-flex min-h-11 items-center font-semibold underline">{p('purchaseRecover')}</Link></Alert>}
      {carritoQuery.isPending && (
        <div className="flex justify-center py-12">
          <LoadingNotice label={textosCarrito.cargandoCarrito} />
        </div>
      )}

      {sinCarritoActivo && (knownPaymentId !== null || uncertainPayment) && <Alert tone="info"><p>{p('purchaseExpiredPayment')}</p><Button variant="ghost" onClick={() => { void checkExpiry(); }}>{textosCarrito.comprobarEstado}</Button>{knownPaymentId !== null && <Link className="inline-flex min-h-11 items-center underline" to={`/pagos/${knownPaymentId}/resultado`}>{p('purchaseRecover')}</Link>}</Alert>}
      {sinCarritoActivo && knownPaymentId === null && !uncertainPayment && (
        <CarritoVacio
          titulo={textosCarrito.sinCarritoTitulo}
          descripcion={textosCarrito.sinCarritoDescripcion}
          onActualizar={consultarEstado}
          actualizando={carritoQuery.isFetching}
        />
      )}

      {carritoError && errorCarrito && (
        <CarritoError
          titulo={errorCarrito.titulo}
          descripcion={errorCarrito.descripcion}
          onReintentar={consultarEstado}
          reintentando={carritoQuery.isFetching}
        />
      )}

      {carritoAjeno && (
        <CarritoError
          titulo={textosCarrito.errorCarritoTitulo}
          descripcion={textosCarrito.errorAccesoDescripcion}
          onReintentar={consultarEstado}
          reintentando={carritoQuery.isFetching}
        />
      )}

      {carritoValido && itemsQuery.isPending && (
        <div className="flex justify-center py-12">
          <LoadingNotice label={textosCarrito.cargandoArticulos} />
        </div>
      )}

      {carritoValido && itemsSinCarrito && (
        <CarritoVacio
          titulo={textosCarrito.carritoNoDisponibleTitulo}
          descripcion={textosCarrito.carritoNoDisponibleDescripcion}
          onActualizar={consultarEstado}
          actualizando={carritoQuery.isFetching || itemsQuery.isFetching}
        />
      )}

      {carritoValido && itemsError && errorArticulos && (
        <CarritoError
          titulo={errorArticulos.titulo}
          descripcion={errorArticulos.descripcion}
          onReintentar={consultarEstado}
          reintentando={itemsQuery.isFetching}
        />
      )}

      {carritoValido && datosInvalidos && (
        <CarritoError
          titulo={textosCarrito.errorArticulosTitulo}
          descripcion={textosCarrito.errorAccesoDescripcion}
          onReintentar={consultarEstado}
          reintentando={itemsQuery.isFetching}
        />
      )}

      {carritoValido &&
        itemsQuery.isSuccess &&
        !datosInvalidos &&
        items.length === 0 && (
          <CarritoVacio
            titulo={textosCarrito.carritoVacioTitulo}
            descripcion={textosCarrito.carritoVacioDescripcion}
            onActualizar={consultarEstado}
            actualizando={itemsQuery.isFetching}
          />
        )}

      {carritoValido &&
        itemsQuery.isSuccess &&
        !datosInvalidos &&
        items.length > 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            <div className="flex flex-col gap-4">
              <p className="text-xs text-neutro-500">
                {textosCarrito.articulos(items.length)}
              </p>
              {groupItems(items).map((group) => <section key={group.type} className="flex flex-col gap-3"><h2 className="font-serif text-xl">{itemTypeLabel(group.type, locale)}</h2><ul className="flex flex-col gap-4">
                {group.entries.map((item) => (
                  <li key={item.id}>
                    <CarritoItemCard
                      item={item}
                      onRetirar={abrirConfirmacion}
                      retiroBloqueado={retirar.isPending || paymentLock.locked}
                    />
                  </li>
                ))}
              </ul></section>)}
            </div>

            <ResumenCarrito
              total={itemsQuery.data?.total}
              cantidadArticulos={items.length}
            />
          </div>
        )}

      <ConfirmarRetiroModal
        item={itemAConfirmar}
        pendiente={retirar.isPending}
        onCancelar={cerrarConfirmacion}
        onConfirmar={confirmarRetiro}
      />
    </section>
  );
};

/**
 * Carrito del cliente autenticado.
 *
 * La ruta global se conecta fuera de este archivo. La pantalla consulta el
 * carrito vigente y sus artículos; visitarla nunca crea un carrito.
 */
export const CarritoPage: React.FC = () => (
  <ClienteCarritoGate>
    {(user) => <ContenidoCarrito key={user.id} userId={user.id} />}
  </ClienteCarritoGate>
);
