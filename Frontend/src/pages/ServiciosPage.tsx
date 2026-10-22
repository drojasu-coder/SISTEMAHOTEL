import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Car, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { buttonStyles } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthContext';
import { hasPermission } from '@/features/auth/permissions';
import { es } from '@/i18n/es';

/**
 * Módulo de Servicios e Instalaciones (HOTEL HUNAHPÚ).
 * Centro de gestión para servicios complementarios, divididos entre:
 * 1. Amenidades e Instalaciones (/admin/amenidades)
 * 2. Parqueos y Estacionamiento (/admin/parqueos - visible para quienes tienen habitaciones.gestionar)
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
        {/* Tarjeta de Amenidades */}
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
