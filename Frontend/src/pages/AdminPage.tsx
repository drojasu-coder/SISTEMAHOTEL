import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/features/auth/AuthContext';
import { getPanelModules } from '@/features/auth/permissions';
import { getRoleLabel } from '@/features/auth/types';
import { es } from '@/i18n/es';

/**
 * Inicio del panel: saluda con la identidad verificada y lista únicamente los módulos
 * habilitados para el rol. No muestra métricas ni registros hasta existir integración real.
 */
export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const modules = getPanelModules(user.rol);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="eyebrow">{getRoleLabel(user.rol)}</p>
        <h1 className="text-[2rem] leading-[2.375rem] md:text-[2.5rem] md:leading-[3rem]">
          {es.panel.saludo}, {user.nombre}
        </h1>
        <p className="text-sm text-neutro-600">{es.panel.descripcion}</p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {modules.map((module) => (
          <li key={module.id}>
            <Link to={module.path} className="block rounded-xl">
              <Card className="flex items-center justify-between gap-3 transition-colors hover:border-bronce-400">
                <span className="text-sm font-semibold text-neutro-900">{module.label}</span>
                <ChevronRight className="size-4 shrink-0 text-neutro-500" aria-hidden="true" />
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
