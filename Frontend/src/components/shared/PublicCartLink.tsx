import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useCarritoActualQuery, useCarritoItemsQuery, esErrorHttp } from '@/features/carrito/hooks/useCarritoPantalla';
import { useLocale } from '@/i18n/LocaleContext';
/** Artículos = referencias del arreglo items, igual que el resumen de CarritoPage. */
export const PublicCartLink: React.FC = () => {
  const { user, status } = useAuth();
  const { t } = useLocale();
  const clientId = status === 'authenticated' && user?.rol === 'cliente' ? user.id : 0;
  const cart = useCarritoActualQuery(clientId);
  const items = useCarritoItemsQuery(cart.isSuccess ? cart.data?.id : undefined, clientId);
  if (!clientId) return null;
  const empty = esErrorHttp(cart.error, 404) && ['ACTIVE_CART_NOT_FOUND', 'CART_NOT_FOUND'].includes((cart.error as { code?: string }).code ?? '');
  const malformed = items.isSuccess && !Array.isArray(items.data?.items);
  const error = (!empty && cart.isError) || items.isError || malformed;
  const loading = !error && !empty && (cart.isPending || items.isPending);
  const count = !error && !loading && !empty ? items.data?.items?.length ?? 0 : 0;
  const label = error ? t('cartError') : loading ? t('cartLoading') : t('cartCount').replace('{count}', String(count)).replace('{item}', t(count === 1 ? 'cartItem' : 'cartItems'));
  return <Link to="/carrito" aria-label={label} aria-busy={loading} title={label} className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-md px-2 text-bronce-700 hover:bg-bronce-50">
    <ShoppingCart className="size-5" aria-hidden="true" />
    {count > 0 && <span aria-hidden="true" className="rounded-full bg-bronce-600 px-1.5 py-0.5 text-[11px] font-bold text-white">{count}</span>}
    {(error || loading) && <span aria-hidden="true" className="text-xs">{error ? '!' : '…'}</span>}
  </Link>;
};
