import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { ApiError } from '@/api/client/http';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/AuthContext';
import { usePublicInterface } from '@/i18n/public';
import { CARRITO_ROUTES } from '../constants/routes';
import { useAddReservaToCarrito } from '../hooks/useAddReservaToCarrito';
import type { TipoItemCarrito } from '../types';

/**
 * Prepara el carrito apenas se confirma una reserva pagable: una sola petición por reserva (sin doble envío),
 * "ya estaba en el carrito" cuenta como éxito y, si la incorporación falla, la reserva creada se conserva y se
 * ofrece reintentar únicamente ese paso. No cobra nada: el pago lo inicia el cliente desde el carrito.
 */
export const CarritoAutomatico: React.FC<{ reservaId: number; reservaEstado?: string; tipo_item: TipoItemCarrito }> = ({ reservaId, reservaEstado, tipo_item }) => {
  const terminal = ['cancelada', 'cancelado', 'expirada', 'pagada', 'pagado', 'completada', 'finalizada', 'usada'].includes((reservaEstado ?? '').toLowerCase());
  const { p } = usePublicInterface();
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const started = useRef<number | null>(null);
  const { anadirAlCarrito, isLoading, feedback } = useAddReservaToCarrito({
    tipo_item,
    onSuccess: () => setReady(true),
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'CART_ITEM_ALREADY_EXISTS') setReady(true);
      else setFailed(true);
    },
  });

  useEffect(() => {
    if (user?.rol !== 'cliente' || terminal || started.current === reservaId) return;
    started.current = reservaId;
    setReady(false);
    setFailed(false);
    anadirAlCarrito(reservaId);
  }, [reservaId, user?.rol, terminal, anadirAlCarrito]);


  if (user?.rol !== 'cliente' || terminal) return null;
  if (failed) {
    return <div className="space-y-2"><Alert tone={feedback?.tono ?? 'warning'}><p className="text-xs">{feedback?.publicKey ? p(feedback.publicKey) : p('cartLinkFailed')}</p></Alert>
      <p className="text-xs text-neutro-600">{p('cartLinkFailed')}</p>
      <Button type="button" className="w-full justify-center gap-2" onClick={() => { setFailed(false); setReady(false); anadirAlCarrito(reservaId); }}><ShoppingCart className="size-4" aria-hidden="true" />{p('addCart')}</Button></div>;
  }
  if (!ready || isLoading) return <LoadingNotice label={p('addingCart')} />;
  return <div className="space-y-2">
    <p className="text-xs text-neutro-600">{p('reservedInCart')} {p('paymentNotCharged')}</p>
    <Link to={CARRITO_ROUTES.CARRITO} className={buttonStyles({ className: 'w-full justify-center gap-2' })}><ShoppingCart className="size-4" aria-hidden="true" />{p('continueToPayment')}</Link>
  </div>;
};
