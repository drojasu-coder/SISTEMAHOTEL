import React from 'react';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/AuthContext';
import { canAccessPanel } from '@/features/auth/permissions';
import { getRoleLabel } from '@/features/auth/types';
import { es } from '@/i18n/es';
import { Link } from 'react-router-dom';
import { buttonStyles } from '@/components/ui/Button';
import { RESERVAS_ROUTES } from '@/features/reservas';
import { RESTAURANTE_ROUTES } from '@/features/restaurante';
import { AMENIDADES_ROUTES } from '@/features/amenidades';
import { ACTIVIDADES_ROUTES } from '@/features/actividades';
import { BIENESTAR_ROUTES } from '@/features/bienestar';
import { EVENTOS_ROUTES } from '@/features/eventos';
import { CARRITO_ROUTES } from '@/features/carrito';
import { BedDouble, Coffee, Waves, Dumbbell, Flower2, PartyPopper, ShoppingCart, ArrowRight } from 'lucide-react';

/**
 * Cuenta mínima de cualquier rol conocido: solo muestra la identidad verificada por el
 * backend. Es el destino de los roles que todavía no tienen módulos de gestión.
 */
export const AccountPage: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const rows: Array<[string, string]> = [
    [es.cuenta.nombre, user.nombre],
    [es.cuenta.correo, user.email],
    [es.cuenta.telefono, user.telefono ?? es.cuenta.sinTelefono],
    [es.cuenta.rol, getRoleLabel(user.rol)],
  ];

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10 sm:py-14">
      <div className="flex flex-col gap-2">
        <h1 className="text-[2rem] leading-[2.375rem] md:text-[2.5rem] md:leading-[3rem]">
          {es.cuenta.titulo}
        </h1>
        <p className="text-sm text-neutro-600">{es.cuenta.descripcion}</p>
      </div>

      <Card>
        <dl className="flex flex-col gap-4">
          {rows.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <dt className="eyebrow">{label}</dt>
              <dd className="break-words text-sm text-neutro-900">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {user.rol === 'cliente' && (
        <div className="flex flex-wrap gap-3">
          <Link to={RESERVAS_ROUTES.NUEVA} className={buttonStyles({ variant: 'primary' })}>
            {es.navegacion.reservar}
          </Link>
          <Link to={RESERVAS_ROUTES.MIS_RESERVAS} className={buttonStyles({ variant: 'secondary' })}>
            {es.navegacion.misReservas}
          </Link>
        </div>
      )}

      {user.rol === 'cliente' && (
        <section aria-labelledby="mis-servicios" className="space-y-4">
          <div><p className="eyebrow">Tu estancia</p><h2 id="mis-servicios" className="font-serif text-2xl font-semibold text-neutro-900">Todas tus reservas</h2><p className="text-sm text-neutro-600">Accede a cada tipo de reserva y consulta sus detalles o su estado actual.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {name:'Habitaciones',href:RESERVAS_ROUTES.MIS_RESERVAS,icon:BedDouble},
              {name:'Restaurante',href:RESTAURANTE_ROUTES.MIS_RESERVAS,icon:Coffee},
              {name:'Amenidades',href:AMENIDADES_ROUTES.MIS_RESERVAS,icon:Waves},
              {name:'Actividades',href:ACTIVIDADES_ROUTES.MIS_RESERVAS,icon:Dumbbell},
              {name:'Bienestar y spa',href:BIENESTAR_ROUTES.MIS_RESERVAS,icon:Flower2},
              {name:'Eventos',href:EVENTOS_ROUTES.MIS_RESERVAS,icon:PartyPopper},
            ].map((r)=><Link to={r.href} key={r.href} className="group flex min-h-16 items-center gap-3 rounded-xl border border-neutro-200 bg-white p-4 text-sm font-semibold text-neutro-800 transition-colors hover:border-bronce-300 hover:bg-bronce-50"><r.icon className="size-5 text-selva-700" aria-hidden="true"/><span className="flex-1">{r.name}</span><ArrowRight className="size-4 text-bronce-600 transition-transform group-hover:translate-x-1" aria-hidden="true"/></Link>)}
          </div>
          <Link to={CARRITO_ROUTES.CARRITO} className={buttonStyles({variant:'secondary',className:'w-full justify-center'})}><ShoppingCart className="size-4"/> Ir a mi carrito</Link>
        </section>
      )}

      {!canAccessPanel(user.rol) && user.rol !== 'cliente' && (
        <Alert tone="info" title={es.cuenta.sinModulosTitulo}>
          {es.cuenta.sinModulosDescripcion}
        </Alert>
      )}
    </section>
  );
};
