import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Car, CalendarCheck, ChevronRight, Dumbbell, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { buttonStyles } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthContext';
import { hasPermission } from '@/features/auth/permissions';
import { AMENIDADES_ROUTES } from '@/features/amenidades';
import { ACTIVIDADES_ROUTES } from '@/features/actividades';
import { BIENESTAR_ROUTES } from '@/features/bienestar';
import { Heart } from 'lucide-react';
import { es } from '@/i18n/es';

/**
 * Módulo de Servicios e Instalaciones (HOTEL HUNAHPÚ).
 * Centro de gestión para servicios complementarios, divididos entre:
 * 1. Catálogo de Amenidades (/admin/amenidades)
 * 2. Reservas de Amenidades (/admin/reservas-amenidades)
 * 3. Recursos de Actividades (/admin/recursos-actividad)
 * 4. Instructores Deportivos (/admin/instructores)
 * 5. Reservas de Actividades (/admin/reservas-actividades)
 * 6. Parqueos y Estacionamiento (/admin/parqueos - visible para quienes tienen habitaciones.gestionar)
 */
export const ServiciosPage: React.FC = () => {
  const { user } = useAuth();
  const canManageParqueos = user
    ? hasPermission(user.rol, 'habitaciones.gestionar')
    : false;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col gap-1.5">
        <p className="eyebrow">{es.modulos.servicios}</p>
        <h1 className="text-[2rem] leading-[2.375rem] md:text-[2.5rem] md:leading-[3rem] text-neutro-900">
          {es.servicios.titulo}
        </h1>
        <p className="text-sm text-neutro-600 max-w-2xl">
          {es.servicios.descripcion}
        </p>
      </div>

      {/* Tarjetas de áreas de servicio */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Tarjeta de Catálogo de Amenidades */}
        <Card className="flex flex-col justify-between gap-6 p-6 transition-all hover:border-selva-300 hover:shadow-soft">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-selva-100 text-selva-800">
                <Sparkles className="size-5" aria-hidden="true" />
              </div>
              <h2 className="font-serif text-lg font-bold text-neutro-900">
                {es.servicios.amenidadesTitulo}
              </h2>
            </div>
            <p className="text-sm text-neutro-600">
              {es.servicios.amenidadesDescripcion}
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/admin/amenidades"
              className={buttonStyles({ variant: 'primary', className: 'w-full justify-between' })}
            >
              <span>{es.servicios.amenidadesBoton}</span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </Card>

        {/* Tarjeta de Reservas de Amenidades */}
        <Card className="flex flex-col justify-between gap-6 p-6 transition-all hover:border-selva-300 hover:shadow-soft">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-selva-100 text-selva-800">
                <CalendarCheck className="size-5" aria-hidden="true" />
              </div>
              <h2 className="font-serif text-lg font-bold text-neutro-900">
                {es.amenidades.adminReservas.titulo}
              </h2>
            </div>
            <p className="text-sm text-neutro-600">
              {es.amenidades.adminReservas.subtitulo}
            </p>
          </div>

          <div className="pt-2">
            <Link
              to={AMENIDADES_ROUTES.ADMIN_RESERVAS}
              className={buttonStyles({ variant: 'secondary', className: 'w-full justify-between' })}
            >
              <span>{es.amenidades.adminReservas.titulo}</span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </Card>

        {/* Tarjeta de Recursos e Instalaciones de Actividades */}
        <Card className="flex flex-col justify-between gap-6 p-6 transition-all hover:border-selva-300 hover:shadow-soft">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-selva-100 text-selva-800">
                <Dumbbell className="size-5" aria-hidden="true" />
              </div>
              <h2 className="font-serif text-lg font-bold text-neutro-900">
                Instalaciones de actividades
              </h2>
            </div>
            <p className="text-sm text-neutro-600">
              Administración de canchas, campos y áreas deportivas y recreativas por sede.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to={ACTIVIDADES_ROUTES.ADMIN_RECURSOS}
              className={buttonStyles({ variant: 'primary', className: 'w-full justify-between' })}
            >
              <span>Gestionar instalaciones</span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </Card>

        {/* Tarjeta de Instructores Deportivos */}
        <Card className="flex flex-col justify-between gap-6 p-6 transition-all hover:border-selva-300 hover:shadow-soft">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-selva-100 text-selva-800">
                <Users className="size-5" aria-hidden="true" />
              </div>
              <h2 className="font-serif text-lg font-bold text-neutro-900">
                Instructores deportivos
              </h2>
            </div>
            <p className="text-sm text-neutro-600">
              Control de instructores activos, especialidades y disponibilidad de clases.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to={ACTIVIDADES_ROUTES.ADMIN_INSTRUCTORES}
              className={buttonStyles({ variant: 'secondary', className: 'w-full justify-between' })}
            >
              <span>Gestionar instructores</span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </Card>

        {/* Tarjeta de Servicios de Spa */}
        <Card className="flex flex-col justify-between gap-6 p-6 transition-all hover:border-selva-300 hover:shadow-soft">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-selva-100 text-selva-800">
                <Heart className="size-5" aria-hidden="true" />
              </div>
              <h2 className="font-serif text-lg font-bold text-neutro-900">
                Servicios de bienestar y spa
              </h2>
            </div>
            <p className="text-sm text-neutro-600">
              Administración de tratamientos, masajes y terapias con sus duraciones y tarifas en GTQ.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to={BIENESTAR_ROUTES.ADMIN_SERVICIOS}
              className={buttonStyles({ variant: 'primary', className: 'w-full justify-between' })}
            >
              <span>Gestionar tratamientos</span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </Card>

        {/* Tarjeta de Terapeutas */}
        <Card className="flex flex-col justify-between gap-6 p-6 transition-all hover:border-selva-300 hover:shadow-soft">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-selva-100 text-selva-800">
                <Users className="size-5" aria-hidden="true" />
              </div>
              <h2 className="font-serif text-lg font-bold text-neutro-900">
                Terapeutas de spa
              </h2>
            </div>
            <p className="text-sm text-neutro-600">
              Control del equipo de profesionales y terapeutas activos para asignación de citas.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to={BIENESTAR_ROUTES.ADMIN_TERAPEUTAS}
              className={buttonStyles({ variant: 'secondary', className: 'w-full justify-between' })}
            >
              <span>Gestionar terapeutas</span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </Card>

        {/* Tarjeta de Citas de Spa */}
        <Card className="flex flex-col justify-between gap-6 p-6 transition-all hover:border-selva-300 hover:shadow-soft">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-selva-100 text-selva-800">
                <CalendarCheck className="size-5" aria-hidden="true" />
              </div>
              <h2 className="font-serif text-lg font-bold text-neutro-900">
                Citas de bienestar y spa
              </h2>
            </div>
            <p className="text-sm text-neutro-600">
              Supervisión general de citas programadas, terapeutas asignados y actualización de estados.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to={BIENESTAR_ROUTES.ADMIN_CITAS}
              className={buttonStyles({ variant: 'secondary', className: 'w-full justify-between' })}
            >
              <span>Ver citas de spa</span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </Card>

        {/* Tarjeta de Reservas de Actividades */}
        <Card className="flex flex-col justify-between gap-6 p-6 transition-all hover:border-selva-300 hover:shadow-soft">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-selva-100 text-selva-800">
                <CalendarCheck className="size-5" aria-hidden="true" />
              </div>
              <h2 className="font-serif text-lg font-bold text-neutro-900">
                Reservas de actividades
              </h2>
            </div>
            <p className="text-sm text-neutro-600">
              Supervisión de reservas de canchas, instructores y estados operativos.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to={ACTIVIDADES_ROUTES.ADMIN_RESERVAS}
              className={buttonStyles({ variant: 'secondary', className: 'w-full justify-between' })}
            >
              <span>Ver reservas de actividades</span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </Card>

        {/* Tarjeta de Parqueos: enlace funcional visible para quien tiene habitaciones.gestionar */}
        {canManageParqueos && (
          <Card className="flex flex-col justify-between gap-6 p-6 transition-all hover:border-selva-300 hover:shadow-soft">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-selva-100 text-selva-800">
                  <Car className="size-5" aria-hidden="true" />
                </div>
                <h2 className="font-serif text-lg font-bold text-neutro-900">
                  {es.servicios.parqueosTitulo}
                </h2>
              </div>
              <p className="text-sm text-neutro-600">
                {es.servicios.parqueosDescripcion}
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/admin/parqueos"
                className={buttonStyles({ variant: 'primary', className: 'w-full justify-between' })}
              >
                <span>{es.servicios.parqueosBoton}</span>
                <ChevronRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
