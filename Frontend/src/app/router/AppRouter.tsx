import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GuestLayout } from '@/layouts/GuestLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { AccountPage } from '@/pages/AccountPage';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { AdminPage } from '@/pages/AdminPage';
import { SedesPage } from '@/pages/SedesPage';
import { HabitacionesPage } from '@/pages/HabitacionesPage';
import { MesasPage } from '@/pages/MesasPage';
import { ModulePlaceholderPage } from '@/pages/ModulePlaceholderPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RequireAuth } from '@/features/auth/components/RequireAuth';
import { PANEL_MODULES } from '@/features/auth/permissions';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Sitio público y cuenta */}
        <Route element={<GuestLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="/403" element={<ForbiddenPage />} />

          {/* Cuenta mínima: cualquier rol conocido con sesión verificada */}
          <Route element={<RequireAuth />}>
            <Route path="/cuenta" element={<AccountPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Panel: exige al menos un módulo habilitado; cada módulo exige su propio permiso */}
        <Route element={<RequireAuth panel />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminPage />} />
            {PANEL_MODULES.map((module) => (
              <Route key={module.id} element={<RequireAuth permission={module.permission} />}>
                <Route
                  path={module.path.replace('/admin/', '')}
                  element={
                    module.id === 'configuracion' ? (
                      <SedesPage />
                    ) : module.id === 'habitaciones' ? (
                      <HabitacionesPage />
                    ) : module.id === 'restaurante' ? (
                      <MesasPage />
                    ) : (
                      <ModulePlaceholderPage module={module} />
                    )
                  }
                />
              </Route>
            ))}
            {/* Alias directo para sedes */}
            <Route element={<RequireAuth permission="configuracion.administrar" />}>
              <Route path="sedes" element={<SedesPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
