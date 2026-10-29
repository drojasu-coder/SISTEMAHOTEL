import React from 'react';
import { NavLink, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { cn } from '@/lib/cn';
import { EmpleadosTab } from '@/features/personal/EmpleadosTab';
import { ClientesTab } from '@/features/personal/ClientesTab';
import { useTextosPersonal } from '@/features/personal/textos';
import { SECTIONS, type Section } from '@/features/personal/types';

/** Secciones antiguas: «usuarios» pasó a Clientes y «turnos» se retiró de la navegación. */
const LEGADO: Record<string, Section> = { usuarios: 'clientes', turnos: 'empleados' };

/**
 * Administración de personas en dos secciones: Personal (empleados del hotel)
 * y Clientes. El gerente de sede solo ve el personal de sus sedes; los clientes
 * son del administrador general (como en el servidor).
 */
export const PersonalPage: React.FC = () => {
  const t = useTextosPersonal();
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';
  const [params] = useSearchParams();
  const visibles: Section[] = SECTIONS.filter((s) => isAdmin || s === 'empleados');
  const requested = params.get('seccion');

  if (requested && LEGADO[requested]) {
    const next = new URLSearchParams(params);
    next.set('seccion', LEGADO[requested]);
    next.delete('empleado');
    return <Navigate to={`?${next.toString()}`} replace />;
  }
  const section: Section = requested && visibles.includes(requested as Section) ? requested as Section : 'empleados';

  return <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-5 pb-12">
    <header>
      <h1 className="font-sans text-2xl font-semibold tracking-tight text-neutro-900">{t.secciones[section]}</h1>
    </header>
    {visibles.length > 1 && <nav aria-label={t.navLabel} className="flex gap-1 overflow-x-auto border-b border-neutro-200">
      {visibles.map((key) => <NavLink key={key} to={`?seccion=${key}`} replace
        className={() => cn('-mb-px inline-flex min-h-11 shrink-0 items-center border-b-2 px-3 text-sm font-medium transition-colors', section === key ? 'border-bronce-600 text-bronce-800' : 'border-transparent text-neutro-600 hover:text-neutro-900')}
        aria-current={section === key ? 'page' : undefined}>{t.secciones[key]}</NavLink>)}
    </nav>}
    {section === 'empleados' && <EmpleadosTab />}
    {section === 'clientes' && isAdmin && <ClientesTab />}
  </div>;
};
