import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BedDouble, CalendarCheck, Coffee, Dumbbell, Flower2, PartyPopper, Waves } from 'lucide-react';
import { buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/features/auth/AuthContext';
import { getHomeRouteForUser } from '@/features/auth/routing';
import { es } from '@/i18n/es';
import { RESERVAS_ROUTES } from '@/features/reservas';
import { RESTAURANTE_ROUTES } from '@/features/restaurante';
import { AMENIDADES_ROUTES } from '@/features/amenidades';
import { ACTIVIDADES_ROUTES } from '@/features/actividades';
import { BIENESTAR_ROUTES } from '@/features/bienestar';
import { EVENTOS_ROUTES } from '@/features/eventos';

const experiencias = [
  { name: 'Habitaciones', caption: 'Encuentra un espacio para descansar.', href: RESERVAS_ROUTES.NUEVA, icon: BedDouble },
  { name: 'Restaurante', caption: 'Reserva una mesa para tu próxima visita.', href: RESTAURANTE_ROUTES.CATALOGO, icon: Coffee },
  { name: 'Bienestar y spa', caption: 'Tratamientos y sesiones de relajación.', href: BIENESTAR_ROUTES.CATALOGO, icon: Flower2 },
  { name: 'Actividades', caption: 'Instalaciones deportivas y recreativas.', href: ACTIVIDADES_ROUTES.CATALOGO, icon: Dumbbell },
  { name: 'Amenidades', caption: 'Espacios para disfrutar tu estancia.', href: AMENIDADES_ROUTES.CATALOGO, icon: Waves },
  { name: 'Eventos', caption: 'Salones y servicios para celebraciones.', href: EVENTOS_ROUTES.CATALOGO, icon: PartyPopper },
];

export const HomePage: React.FC = () => {
  const { status, user } = useAuth();
  const signedIn = status === 'authenticated' && user !== null;
  return <div className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
    <section className="relative my-8 overflow-hidden rounded-2xl bg-selva-900 px-6 py-14 text-white shadow-soft sm:px-12 md:py-20">
      <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-44 size-96 rounded-full border-[70px] border-white/5" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 size-64 rounded-tl-full bg-bronce-500/20" />
      <div className="relative max-w-2xl space-y-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-bronce-200">{es.marca.pais} · Hospitalidad y experiencias</p>
        <h1 className="font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl md:text-6xl">{es.inicio.titulo}</h1>
        <p className="max-w-xl text-base leading-relaxed text-white/80">{es.inicio.subtitulo}</p>
        <div className="flex flex-wrap gap-3">
          <Link to={RESERVAS_ROUTES.NUEVA} className={buttonStyles({ size: 'lg', className: 'bg-bronce-500 text-white hover:bg-bronce-600' })}>Explorar habitaciones <ArrowRight className="size-4"/></Link>
          {signedIn ? <Link to={getHomeRouteForUser(user)} className={buttonStyles({variant:'ghost',size:'lg',className:'border-white/40 text-white hover:bg-white/10'})}>{es.navegacion.miEspacio}</Link> : status==='anonymous' ? <Link to="/login" className={buttonStyles({variant:'ghost',size:'lg',className:'border-white/40 text-white hover:bg-white/10'})}>{es.auth.loginBoton}</Link> : null}
        </div>
      </div>
    </section>
    <section aria-labelledby="experiencias-titulo" className="space-y-6">
      <div className="space-y-2"><p className="eyebrow">Explora Hotel Hunahpú</p><h2 id="experiencias-titulo" className="font-serif text-3xl font-semibold text-neutro-900 sm:text-4xl">Servicios y experiencias</h2><p className="text-sm text-neutro-600">Selecciona una categoría para consultar su catálogo y disponibilidad.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{experiencias.map(x=><Link to={x.href} key={x.href} className="group rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronce-600"><Card className="flex h-full flex-col gap-4 p-6 transition-all group-hover:border-bronce-300 group-hover:shadow-soft"><span className="flex size-11 items-center justify-center rounded-xl bg-selva-100 text-selva-700"><x.icon className="size-6" aria-hidden="true"/></span><div className="flex-1"><h3 className="font-serif text-xl font-bold text-neutro-900">{x.name}</h3><p className="mt-2 text-sm text-neutro-600">{x.caption}</p></div><span className="inline-flex items-center gap-2 text-xs font-semibold text-bronce-700">Ver opciones <ArrowRight className="size-4 transition-transform group-hover:translate-x-1"/></span></Card></Link>)}</div>
    </section>
    <section className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-bronce-200 bg-bronce-50 p-6 sm:flex-row sm:items-center"><div><h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-neutro-900"><CalendarCheck className="size-5 text-bronce-600"/> Organiza tu estancia</h2><p className="mt-1 text-sm text-neutro-600">Consulta tus reservas desde tu espacio personal.</p></div><Link to={signedIn?'/cuenta':'/registro'} className={buttonStyles({variant:'secondary'})}>{signedIn?'Ir a mi espacio':es.navegacion.crearCuenta}</Link></section>
  </div>;
};
