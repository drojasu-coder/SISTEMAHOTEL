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

      {!canAccessPanel(user.rol) && user.rol !== 'cliente' && (
        <Alert tone="info" title={es.cuenta.sinModulosTitulo}>
          {es.cuenta.sinModulosDescripcion}
        </Alert>
      )}
    </section>
  );
};
