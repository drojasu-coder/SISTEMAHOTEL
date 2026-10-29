import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, CalendarCheck, Users } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { UtensilsCrossed } from 'lucide-react';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { MoneyReference } from '@/components/ui/MoneyReference';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import { cn } from '@/lib/cn';
import { useMenuQuery, useRestaurantesQuery } from '../hooks/useReservasMesa';
import { useMenuCopy } from '../menuCopy';
import { CATEGORIAS_MENU, type CategoriaMenu, type ProductoMenu, type Restaurante } from '../types';

/**
 * Identidad del restaurante de la sede activa. La carta (informativa) se abre en un diálogo
 * con "Ver carta"; un enlace directo a #carta la abre al cargar la página.
 */
export function RestauranteMenu({ media, tablesHref }: { media?: ReactNode; tablesHref?: string } = {}) {
  const copy = useMenuCopy();
  const scope = usePublicPreferences();
  const query = useRestaurantesQuery();
  const location = useLocation();
  const navigate = useNavigate();
  const restaurantes = Array.isArray(query.data) ? query.data : [];
  const restaurante = typeof scope.selected === 'number' ? restaurantes.find((item) => item.sucursal_id === scope.selected) : undefined;
  const [cartaAbierta, setCartaAbierta] = useState(false);
  const restauranteId = restaurante?.id;

  // Compatibilidad con enlaces a #carta: abre el diálogo en lugar de desplazar la página.
  useEffect(() => { if (location.hash === '#carta' && restauranteId) setCartaAbierta(true); }, [location.hash, restauranteId]);
  // Otra sede u otro restaurante: nunca se muestra la carta anterior (la primera carga no cierra nada).
  const anterior = useRef(restauranteId);
  useEffect(() => {
    if (anterior.current !== undefined && anterior.current !== restauranteId) setCartaAbierta(false);
    anterior.current = restauranteId;
  }, [restauranteId]);

  const cerrarCarta = () => {
    setCartaAbierta(false);
    if (location.hash === '#carta') navigate({ pathname: location.pathname, search: location.search }, { replace: true });
  };

  if (query.isPending || scope.status === 'loading') return <LoadingNotice label={copy('loadingMenu')} />;
  if (query.isError) {
    return <Alert tone="error" title={copy('loadError')}>
      <Button variant="ghost" size="sm" onClick={() => { void query.refetch(); }}>{copy('retry')}</Button>
    </Alert>;
  }

  if (scope.selected === 'all') {
    return <section aria-labelledby="restaurantes-titulo" className="surface space-y-4 p-4 sm:p-6">
      <div>
        <p className="eyebrow text-bronce-700">{copy('sectionEyebrow')}</p>
        <h2 id="restaurantes-titulo" className="text-xl font-semibold text-neutro-900">{copy('ourRestaurants')}</h2>
        <p className="text-sm text-neutro-600">{copy('chooseSite')}</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {restaurantes.map((item) => <li key={item.id} className="flex flex-col gap-3 rounded-lg border border-neutro-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-semibold text-neutro-900" lang="es">{item.nombre}</p>
            <p className="text-sm text-neutro-600" lang="es">{item.Sucursal?.nombre}</p>
            {item.mesas && <p className="text-xs text-neutro-500">{copy('tablesSummary', { tables: item.mesas.total, seats: item.mesas.plazas })}</p>}
          </div>
          <Button variant="secondary" size="sm" onClick={() => scope.choose(item.sucursal_id)}>{copy('viewMenu')}</Button>
        </li>)}
      </ul>
    </section>;
  }

  if (!restaurante) return <Alert tone="info"><p>{copy('noRestaurant')}</p></Alert>;
  // Presentación del restaurante de la sede: fotografía y datos en un mismo bloque equilibrado.
  return <section aria-labelledby="restaurante-titulo" className="surface grid overflow-hidden md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
    {media && <div className="min-w-0 self-center">{media}</div>}
    <div className="flex min-w-0 flex-col justify-center gap-4 p-5 sm:p-8">
      <div className="space-y-2">
        <p className="eyebrow text-bronce-700">{copy('sectionEyebrow')}</p>
        <h2 id="restaurante-titulo" className="font-serif text-3xl font-semibold leading-tight text-neutro-900" lang="es">{restaurante.nombre}</h2>
        {restaurante.descripcion && <p className="text-sm leading-relaxed text-neutro-600" lang="es">{restaurante.descripcion}</p>}
      </div>
      {restaurante.mesas && <p className="inline-flex items-center gap-2 text-sm text-neutro-700">
        <Users className="size-4 text-bronce-600" aria-hidden="true" />{copy('tablesSummary', { tables: restaurante.mesas.total, seats: restaurante.mesas.plazas })}
      </p>}
      <div className="flex flex-wrap gap-3 border-t border-neutro-200 pt-4">
        <Button variant="secondary" aria-haspopup="dialog" onClick={() => setCartaAbierta(true)}>
          <BookOpen className="size-4" aria-hidden="true" />{copy('viewMenu')}
        </Button>
        {tablesHref && <a href={tablesHref} className={cn(buttonStyles({ variant: 'primary' }), 'gap-2')}>
          <CalendarCheck className="size-4" aria-hidden="true" />{copy('tablesTitle')}
        </a>}
      </div>
    </div>
    {cartaAbierta && <Modal open presentation="service" title={`${copy('menuTitle')} · ${restaurante.nombre}`} description={copy('priceNote')} closeLabel={copy('close')} onClose={cerrarCarta}>
      <RestauranteCarta key={restaurante.id} restaurante={restaurante} />
    </Modal>}
  </section>;
}

/** Contenido de la carta (dentro del diálogo): categorías seleccionables y tarjetas en dos columnas. */
function RestauranteCarta({ restaurante }: { restaurante: Restaurante }) {
  const copy = useMenuCopy();
  const menu = useMenuQuery(restaurante.id);
  const [categoria, setCategoria] = useState<CategoriaMenu | 'all'>('all');
  const productos = Array.isArray(menu.data) ? menu.data : [];
  const presentes = CATEGORIAS_MENU.filter((cat) => productos.some((item) => item.categoria === cat));
  const visibles = presentes.filter((cat) => categoria === 'all' || cat === categoria);

  return <div className="space-y-4">
    {menu.isPending && <LoadingNotice label={copy('loadingMenu')} />}
    {menu.isError && <Alert tone="error" title={copy('loadError')}>
      <Button variant="ghost" size="sm" onClick={() => { void menu.refetch(); }}>{copy('retry')}</Button>
    </Alert>}
    {menu.isSuccess && <>
      <div role="group" aria-label={copy('categories')} className="sticky top-0 z-10 -mx-1 flex flex-wrap gap-2 bg-white px-1 pb-2">
        {(['all', ...presentes] as const).map((cat) => {
          const count = cat === 'all' ? productos.length : productos.filter((item) => item.categoria === cat).length;
          return <Button key={cat} size="sm" variant={categoria === cat ? 'primary' : 'secondary'} aria-pressed={categoria === cat} onClick={() => setCategoria(cat)}>
            {copy(cat)} <span className="ml-1 text-xs opacity-80">({count})</span>
          </Button>;
        })}
      </div>
      {visibles.length === 0 && <p className="text-sm text-neutro-600">{copy('emptyCategory')}</p>}
      {visibles.map((cat) => <div key={cat} className="space-y-2">
        {categoria === 'all' && <h3 className="text-sm font-semibold uppercase tracking-wide text-bronce-700">{copy(cat)}</h3>}
        <ul className="grid gap-3 md:grid-cols-2">
          {productos.filter((item) => item.categoria === cat).map((item) => <ProductoItem key={item.id} producto={item} />)}
        </ul>
      </div>)}
      <MenuCredits productos={productos} />
    </>}
  </div>;
}

function ProductoItem({ producto }: { producto: ProductoMenu }) {
  const copy = useMenuCopy();
  const disponible = producto.disponible !== false;
  return <li className={cn('flex gap-3 rounded-lg border border-neutro-200 bg-white p-3', !disponible && 'bg-neutro-50')}>
    <ProductoFoto producto={producto} apagada={!disponible} />
    <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
    <div className="min-w-0">
      <p className={cn('font-medium', disponible ? 'text-neutro-900' : 'text-neutro-500')} lang="es">{producto.nombre}</p>
      {producto.descripcion && <p className="line-clamp-2 text-sm text-neutro-600" lang="es">{producto.descripcion}</p>}
      {!disponible && <Badge tone="neutro" className="mt-1">{copy('unavailable')}</Badge>}
    </div>
    <p className={cn('shrink-0 font-semibold', disponible ? 'text-bronce-700' : 'text-neutro-400')}><MoneyReference amount={producto.precio} /></p>
    </div>
  </li>;
}

/** Miniatura del plato; si falta o falla, un símbolo neutro mantiene la alineación. */
function ProductoFoto({ producto, apagada }: { producto: ProductoMenu; apagada: boolean }) {
  const [fallo, setFallo] = useState(false);
  const clases = cn('size-16 shrink-0 overflow-hidden rounded-md bg-neutro-100 sm:size-20', apagada && 'opacity-60');
  if (!producto.imagen_url || fallo) {
    return <div className={cn(clases, 'flex items-center justify-center text-neutro-400')} aria-hidden="true"><UtensilsCrossed className="size-6" /></div>;
  }
  return <div className={clases}><img src={producto.imagen_url} alt={producto.nombre} lang="es" loading="lazy" width={80} height={80} onError={() => setFallo(true)} className="h-full w-full object-cover" /></div>;
}

/** Atribución de las fotografías sin ensuciar la carta: un desplegable al pie. */
function MenuCredits({ productos }: { productos: ProductoMenu[] }) {
  const copy = useMenuCopy();
  const creditos = new Map<string, { autor: string; licencia?: string; url?: string }>();
  for (const p of productos) {
    const c = p.imagen_creditos;
    if (p.imagen_url && c && (c.autor || c.texto)) creditos.set(c.url ?? c.texto ?? c.autor!, { autor: c.autor || c.texto!, licencia: c.licencia, url: c.url });
  }
  if (!creditos.size) return null;
  return <details className="text-xs text-neutro-500">
    <summary className="inline-flex min-h-11 cursor-pointer items-center underline">{copy('photoCredits')}</summary>
    <p className="mb-1">{copy('illustrative')}</p>
    <ul className="space-y-0.5">{[...creditos.values()].map((c) => <li key={c.url ?? c.autor}>{c.url ? <a href={c.url} target="_blank" rel="noopener noreferrer" className="underline">{c.autor}</a> : c.autor}{c.licencia && ` · ${c.licencia}`}</li>)}</ul>
  </details>;
}
