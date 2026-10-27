import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GuestLayout } from '@/layouts/GuestLayout';
import { PublicSedesPage } from '@/pages/PublicSedesPage';
import { PublicHabitacionesPage } from '@/pages/PublicHabitacionesPage';
import { RoomDetail } from '@/features/habitaciones/public/RoomDetail';
import { AdminLayout } from '@/layouts/AdminLayout';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { AccountPage } from '@/pages/AccountPage';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { AdminPage } from '@/pages/AdminPage';
import { SedesPage } from '@/pages/SedesPage';
import { BrandingPage } from '@/pages/BrandingPage';
import { AdminInicioPage } from '@/pages/AdminInicioPage';
import { HabitacionesPage } from '@/pages/HabitacionesPage';
import { TiposHabitacionPage } from '@/pages/TiposHabitacionPage';
import { MesasPage } from '@/pages/MesasPage';
import { ServiciosPage } from '@/pages/ServiciosPage';
import { AmenidadesPage } from '@/pages/AmenidadesPage';
import { AdminReservasAmenidadesPage } from '@/pages/AdminReservasAmenidadesPage';
import { AdminDetalleReservaAmenidadPage } from '@/pages/AdminDetalleReservaAmenidadPage';
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
import { RESTAURANTE_ROUTES } from '@/features/restaurante';
import { CatalogoRestaurantePage } from '@/pages/CatalogoRestaurantePage';
import { MisReservasRestaurantePage } from '@/pages/MisReservasRestaurantePage';
import { DetalleReservaRestaurantePage } from '@/pages/DetalleReservaRestaurantePage';
import { AdminReservasRestaurantePage } from '@/pages/AdminReservasRestaurantePage';
import { AdminDetalleReservaRestaurantePage } from '@/pages/AdminDetalleReservaRestaurantePage';
import { ACTIVIDADES_ROUTES } from '@/features/actividades';
import { CatalogoActividadesPage } from '@/pages/CatalogoActividadesPage';
import { MisReservasActividadesPage } from '@/pages/MisReservasActividadesPage';
import { DetalleReservaActividadPage } from '@/pages/DetalleReservaActividadPage';
import { AdminReservasActividadesPage } from '@/pages/AdminReservasActividadesPage';
import { AdminDetalleReservaActividadPage } from '@/pages/AdminDetalleReservaActividadPage';
import { AdminRecursosActividadPage } from '@/pages/AdminRecursosActividadPage';
import { AdminInstructoresPage } from '@/pages/AdminInstructoresPage';
import { BIENESTAR_ROUTES } from '@/features/bienestar';
import { CatalogoBienestarPage } from '@/pages/CatalogoBienestarPage';
import { MisReservasBienestarPage } from '@/pages/MisReservasBienestarPage';
import { DetalleCitaBienestarPage } from '@/pages/DetalleCitaBienestarPage';
import { AdminServiciosSpaPage } from '@/pages/AdminServiciosSpaPage';
import { AdminTerapeutasPage } from '@/pages/AdminTerapeutasPage';
import { AdminCitasSpaPage } from '@/pages/AdminCitasSpaPage';
import { AdminDetalleCitaSpaPage } from '@/pages/AdminDetalleCitaSpaPage';
import { EVENTOS_ROUTES } from '@/features/eventos';
import { CatalogoEventosPage } from '@/pages/CatalogoEventosPage';
import { SalonDetallePage } from '@/pages/SalonDetallePage';
import { MisReservasEventosPage } from '@/pages/MisReservasEventosPage';
import { DetalleReservaEventoPage } from '@/pages/DetalleReservaEventoPage';
import { AdminSalonesPage } from '@/pages/AdminSalonesPage';
import { AdminServiciosEventoPage } from '@/pages/AdminServiciosEventoPage';
import { AdminReservasEventosPage } from '@/pages/AdminReservasEventosPage';
import { AdminDetalleReservaEventoPage } from '@/pages/AdminDetalleReservaEventoPage';
import { RequireAuth } from '@/features/auth/components/RequireAuth';
import { PANEL_MODULES } from '@/features/auth/permissions';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas y de cliente */}
        <Route element={<GuestLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/sedes" element={<PublicSedesPage />} />
          <Route path="/habitaciones" element={<PublicHabitacionesPage />} />
          <Route path="/habitaciones/:id" element={<RoomDetail />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/403" element={<ForbiddenPage />} />

          {/* Rutas de cliente que requieren sesión */}
          <Route element={<RequireAuth />}>
            <Route path="/cuenta" element={<AccountPage />} />
            <Route path={CARRITO_ROUTES.CARRITO} element={<CarritoPage />} />
            <Route path={PAGOS_ROUTES.CHECKOUT} element={<CheckoutPage />} />
            <Route path="/pagos/:id/resultado" element={<PagoResultadoPage />} />
          </Route>

          {/* Flujo de restaurante del cliente */}
          <Route path={RESTAURANTE_ROUTES.CATALOGO} element={<CatalogoRestaurantePage />} />
          <Route element={<RequireAuth />}>
            <Route path={RESTAURANTE_ROUTES.MIS_RESERVAS} element={<MisReservasRestaurantePage />} />
            <Route path="/mis-reservas/restaurante/:id" element={<DetalleReservaRestaurantePage />} />
          </Route>

          {/* Flujo de amenidades del cliente */}
          <Route path={AMENIDADES_ROUTES.CATALOGO} element={<CatalogoAmenidadesPage />} />
          <Route element={<RequireAuth />}>
            <Route path={AMENIDADES_ROUTES.MIS_RESERVAS} element={<MisReservasAmenidadesPage />} />
            <Route path="/mis-reservas/amenidades/:id" element={<DetalleReservaAmenidadPage />} />
          </Route>

          {/* Flujo de actividades del cliente */}
          <Route path={ACTIVIDADES_ROUTES.CATALOGO} element={<CatalogoActividadesPage />} />
          <Route element={<RequireAuth />}>
            <Route path={ACTIVIDADES_ROUTES.MIS_RESERVAS} element={<MisReservasActividadesPage />} />
            <Route path="/mis-reservas/actividades/:id" element={<DetalleReservaActividadPage />} />
          </Route>

          {/* Flujo de bienestar y spa del cliente */}
          <Route path={BIENESTAR_ROUTES.CATALOGO} element={<CatalogoBienestarPage />} />
          <Route element={<RequireAuth />}>
            <Route path={BIENESTAR_ROUTES.MIS_RESERVAS} element={<MisReservasBienestarPage />} />
            <Route path="/mis-reservas/bienestar/:id" element={<DetalleCitaBienestarPage />} />
          </Route>

          {/* Flujo de eventos del cliente */}
          <Route path={EVENTOS_ROUTES.CATALOGO} element={<CatalogoEventosPage />} />
          <Route path="/eventos/salones/:id" element={<SalonDetallePage />} />
          <Route element={<RequireAuth />}>
            <Route path={EVENTOS_ROUTES.MIS_RESERVAS} element={<MisReservasEventosPage />} />
            <Route path="/mis-reservas/eventos/:id" element={<DetalleReservaEventoPage />} />
          </Route>

          {/* Flujo de reservas de habitación del cliente */}
          <Route path={RESERVAS_ROUTES.NUEVA} element={<CrearReservaPage />} />
          <Route path="/crear-reserva" element={<CrearReservaPage />} />
          <Route path={RESERVAS_ROUTES.MIS_RESERVAS} element={<MisReservasPage />} />
          <Route path="/mis-reservas/:id" element={<DetalleReservaHabitacionPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Panel: exige al menos un módulo habilitado; cada módulo exige su propio permiso */}
        <Route element={<RequireAuth panel />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="403" element={<ForbiddenPage />} />
            <Route path="*" element={<NotFoundPage />} />
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
            {/* Alias directo para sedes e identidad visual */}
            <Route element={<RequireAuth permission="configuracion.administrar" />}>
              <Route path="sedes" element={<SedesPage />} />
              <Route path="branding" element={<BrandingPage />} />
              <Route path="inicio" element={<AdminInicioPage />} />
              <Route path="configuracion/inicio" element={<AdminInicioPage />} />
            </Route>

            {/* Tipos de habitación */}
            <Route element={<RequireAuth permission="habitaciones.gestionar" />}>
              <Route path="tipos-habitacion" element={<TiposHabitacionPage />} />
            </Route>

            {/* Reservas de Restaurante (Exclusivo Admin) */}
            <Route element={<RequireAuth permission="configuracion.administrar" />}>
              <Route path="reservas-restaurante" element={<AdminReservasRestaurantePage />} />
              <Route path="reservas-restaurante/:id" element={<AdminDetalleReservaRestaurantePage />} />
            </Route>

            {/* Amenidades */}
            <Route element={<RequireAuth permission="servicios.administrar" />}>
              <Route path="amenidades" element={<AmenidadesPage />} />
              <Route path="reservas-amenidades" element={<AdminReservasAmenidadesPage />} />
              <Route path="reservas-amenidades/:id" element={<AdminDetalleReservaAmenidadPage />} />
            </Route>

            {/* Actividades Recreativas (Exclusivo Admin) */}
            <Route element={<RequireAuth permission="servicios.administrar" />}>
              <Route path="recursos-actividad" element={<AdminRecursosActividadPage />} />
              <Route path="instructores" element={<AdminInstructoresPage />} />
              <Route path="reservas-actividades" element={<AdminReservasActividadesPage />} />
              <Route path="reservas-actividades/:id" element={<AdminDetalleReservaActividadPage />} />
            </Route>

            {/* Bienestar y Spa (Exclusivo Admin) */}
            <Route element={<RequireAuth permission="servicios.administrar" />}>
              <Route path="servicios-spa" element={<AdminServiciosSpaPage />} />
              <Route path="terapeutas" element={<AdminTerapeutasPage />} />
              <Route path="citas-spa" element={<AdminCitasSpaPage />} />
              <Route path="citas-spa/:id" element={<AdminDetalleCitaSpaPage />} />
            </Route>

            {/* Eventos y Salones (Exclusivo Admin) */}
            <Route element={<RequireAuth permission="servicios.administrar" />}>
              <Route path="salones" element={<AdminSalonesPage />} />
              <Route path="servicios-evento" element={<AdminServiciosEventoPage />} />
              <Route path="reservas-evento" element={<AdminReservasEventosPage />} />
              <Route path="reservas-evento/:id" element={<AdminDetalleReservaEventoPage />} />
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
