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
import { TiposHabitacionPage } from '@/pages/TiposHabitacionPage';
import { MesasPage } from '@/pages/MesasPage';
import { ServiciosPage } from '@/pages/ServiciosPage';
import { AmenidadesPage } from '@/pages/AmenidadesPage';
import { ParqueosPage } from '@/pages/ParqueosPage';
import { AdminReservasPage } from '@/pages/AdminReservasPage';
import { AdminReservaDetallePage } from '@/pages/AdminReservaDetallePage';
import { ModulePlaceholderPage } from '@/pages/ModulePlaceholderPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RESERVAS_ROUTES } from '@/features/reservas';
import { CrearReservaPage } from '@/pages/CrearReservaPage';
import { MisReservasPage } from '@/pages/MisReservasPage';
import { DetalleReservaHabitacionPage } from '@/pages/DetalleReservaHabitacionPage';
import { CarritoPage } from '@/pages/CarritoPage';
import { CARRITO_ROUTES } from '@/features/carrito';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { PagoResultadoPage } from '@/pages/PagoResultadoPage';
import { PAGOS_ROUTES } from '@/features/pagos';
import { AMENIDADES_ROUTES } from '@/features/amenidades';
import { CatalogoAmenidadesPage } from '@/pages/CatalogoAmenidadesPage';
import { MisReservasAmenidadesPage } from '@/pages/MisReservasAmenidadesPage';
import { DetalleReservaAmenidadPage } from '@/pages/DetalleReservaAmenidadPage';
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
          <Route path="/cuenta" element={<AccountPage />} />
          <Route path="/403" element={<ForbiddenPage />} />

          {/* Rutas de Carrito */}
          <Route path={CARRITO_ROUTES.CARRITO} element={<CarritoPage />} />

          {/* Rutas de Checkout y Pagos */}
          <Route element={<RequireAuth />}>
            <Route path={PAGOS_ROUTES.CHECKOUT} element={<CheckoutPage />} />
            <Route path="/pagos/:id/resultado" element={<PagoResultadoPage />} />
          </Route>

          {/* Flujo de amenidades del cliente */}
          <Route path={AMENIDADES_ROUTES.CATALOGO} element={<CatalogoAmenidadesPage />} />
          <Route element={<RequireAuth />}>
            <Route path={AMENIDADES_ROUTES.MIS_RESERVAS} element={<MisReservasAmenidadesPage />} />
            <Route path="/mis-reservas/amenidades/:id" element={<DetalleReservaAmenidadPage />} />
          </Route>

          {/* Flujo de reservas de habitación del cliente */}
          <Route path={RESERVAS_ROUTES.NUEVA} element={<CrearReservaPage />} />
          <Route path={RESERVAS_ROUTES.MIS_RESERVAS} element={<MisReservasPage />} />
          <Route path="/mis-reservas/:id" element={<DetalleReservaHabitacionPage />} />

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
                    ) : module.id === 'servicios' ? (
                      <ServiciosPage />
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

            {/* Tipos de habitación */}
            <Route element={<RequireAuth permission="habitaciones.gestionar" />}>
              <Route path="tipos-habitacion" element={<TiposHabitacionPage />} />
            </Route>

            {/* Amenidades */}
            <Route element={<RequireAuth permission="servicios.administrar" />}>
              <Route path="amenidades" element={<AmenidadesPage />} />
            </Route>

            {/* Espacios de parqueo */}
            <Route element={<RequireAuth permission="habitaciones.gestionar" />}>
              <Route path="parqueos" element={<ParqueosPage />} />
            </Route>

            {/* Consulta administrativa de reservas de habitación */}
            <Route element={<RequireAuth permission="habitaciones.gestionar" />}>
              <Route path="reservas" element={<AdminReservasPage />} />
              <Route path="reservas/:id" element={<AdminReservaDetallePage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
