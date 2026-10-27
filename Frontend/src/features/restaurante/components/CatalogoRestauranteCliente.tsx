import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/features/auth/AuthContext";
import { useSedesFallback } from "@/features/mis-reservas/hooks/useSedesFallback";
import { useMesasQuery } from "../hooks/useReservasMesa";
import { ReservaMesaModal } from "./ReservaMesaModal";
import { textosRestaurante } from "../textos";
import { RESTAURANTE_ROUTES } from "../constants/routes";
import type { MesaConSucursal } from "../types";
import {
  UtensilsCrossed,
  Users,
  MapPin,
  AlertCircle,
  RotateCcw,
  CalendarCheck,
} from "lucide-react";

export const CatalogoRestauranteCliente: React.FC = () => {
  const { status, user } = useAuth();
  const t = textosRestaurante;

  const isCliente = status === "authenticated" && user?.rol === "cliente";

  const { data: mesas = [], isLoading, isError, refetch } = useMesasQuery();
  const sedesQuery = useSedesFallback(true);

  const [sedeFiltro, setSedeFiltro] = useState<string>("");
  const [zonaFiltro, setZonaFiltro] = useState<string>("");
  const [mesaSeleccionada, setMesaSeleccionada] = useState<MesaConSucursal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const zonasDisponibles = useMemo(() => {
    const set = new Set<string>();
    for (const m of mesas) {
      if (m.zona) set.add(m.zona);
    }
    return Array.from(set).sort();
  }, [mesas]);

  const sedesDisponibles = useMemo(() => {
    if (sedesQuery.data && sedesQuery.data.length > 0) {
      return sedesQuery.data;
    }
    const map = new Map<number, string>();
    for (const m of mesas) {
      if (m.sucursal_id) {
        map.set(m.sucursal_id, m.Sucursal?.nombre || `Sede #${m.sucursal_id}`);
      }
    }
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [sedesQuery.data, mesas]);

  const sedeSeleccionada = useMemo(() => {
    if (!sedeFiltro || !sedesQuery.data) return null;
    return sedesQuery.data.find((s) => String(s.id) === sedeFiltro);
  }, [sedeFiltro, sedesQuery.data]);

  const mesasFiltradas = useMemo(() => {
    return mesas.filter((m) => {
      const matchSede =
        sedeFiltro === "" || String(m.sucursal_id) === sedeFiltro;
      const matchZona =
        zonaFiltro === "" || m.zona === zonaFiltro;
      return matchSede && matchZona;
    });
  }, [mesas, sedeFiltro, zonaFiltro]);

  const handleOpenReserva = (mesa: MesaConSucursal) => {
    setMesaSeleccionada(mesa);
    setIsModalOpen(true);
  };

  const handleClearFilters = () => {
    setSedeFiltro("");
    setZonaFiltro("");
  };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow">{t.subtitulo}</p>
          <h1 className="text-[2rem] leading-[2.375rem] text-neutro-900 md:text-[2.5rem] md:leading-[3rem] font-serif font-semibold">
            {t.titulo}
          </h1>
          <p className="max-w-2xl text-sm text-neutro-600">
            {t.mesasDescripcion}
          </p>
        </div>

        {isCliente && (
          <Link
            to={RESTAURANTE_ROUTES.MIS_RESERVAS}
            className="inline-flex items-center gap-2 rounded-md border border-bronce-300 bg-blanco px-4 py-2 text-sm font-medium text-bronce-700 shadow-sm hover:bg-bronce-50 transition-colors"
          >
            <CalendarCheck className="size-4" aria-hidden="true" />
            <span>{t.cliente.misReservasTitulo}</span>
          </Link>
        )}
      </div>

      {/* Barra de Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 rounded-lg border border-neutro-200 bg-neutro-50 p-4">
        <div>
          <label
            htmlFor="filtro-sede-restaurante"
            className="block text-xs font-semibold text-neutro-700 uppercase tracking-wide mb-1"
          >
            {t.sedeLabel}
          </label>
          <select
            id="filtro-sede-restaurante"
            value={sedeFiltro}
            onChange={(e) => setSedeFiltro(e.target.value)}
            className="w-full rounded-md border border-neutro-300 px-3 py-2 text-sm text-neutro-900 bg-blanco focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
          >
            <option value="">{t.todasLasSedes}</option>
            {sedesDisponibles.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="filtro-zona-restaurante"
            className="block text-xs font-semibold text-neutro-700 uppercase tracking-wide mb-1"
          >
            {t.zona}
          </label>
          <select
            id="filtro-zona-restaurante"
            value={zonaFiltro}
            onChange={(e) => setZonaFiltro(e.target.value)}
            className="w-full rounded-md border border-neutro-300 px-3 py-2 text-sm text-neutro-900 bg-blanco focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
          >
            <option value="">{t.todasLasZonas}</option>
            {zonasDisponibles.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end justify-between sm:col-span-2 md:col-span-1">
          <p className="text-xs text-neutro-500 pb-2">
            {t.mesasMostradas(mesasFiltradas.length)}
          </p>
          {(sedeFiltro !== "" || zonaFiltro !== "") && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleClearFilters}
              className="text-xs pb-2"
            >
              <RotateCcw className="size-3.5 mr-1" aria-hidden="true" />
              {t.limpiarFiltros}
            </Button>
          )}
        </div>
      </div>

      {/* Banner Fotográfico del Restaurante de la Sede */}
      {sedeSeleccionada?.restaurante_imagen_url && (
        <div className="relative overflow-hidden rounded-xl border border-neutro-200 bg-neutro-900 text-blanco shadow-soft">
          <div className="relative aspect-[21/9] sm:aspect-[28/9] w-full overflow-hidden">
            <img
              src={sedeSeleccionada.restaurante_imagen_url}
              alt={`Restaurante de ${sedeSeleccionada.nombre}`}
              className="h-full w-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <div>
                <span className="text-xs uppercase tracking-wider text-bronce-300 font-semibold">
                  Experiencia Gastronómica
                </span>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-blanco">
                  Restaurante {sedeSeleccionada.nombre}
                </h2>
              </div>
              {sedeSeleccionada.restaurante_imagen_creditos?.autor && (
                <span className="text-[11px] text-neutro-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm self-start sm:self-auto z-10">
                  {sedeSeleccionada.restaurante_imagen_creditos.url ? (
                    <a
                      href={sedeSeleccionada.restaurante_imagen_creditos.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blanco transition-colors"
                    >
                      Foto: {sedeSeleccionada.restaurante_imagen_creditos.autor} ({sedeSeleccionada.restaurante_imagen_creditos.licencia || "CC"})
                    </a>
                  ) : (
                    `Foto: ${sedeSeleccionada.restaurante_imagen_creditos.autor} (${sedeSeleccionada.restaurante_imagen_creditos.licencia || "CC"})`
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Estado: Cargando */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-6 space-y-4">
              <div className="h-6 w-3/4 animate-pulse rounded bg-neutro-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-neutro-200" />
              <div className="h-10 w-full animate-pulse rounded bg-neutro-200" />
            </Card>
          ))}
        </div>
      )}

      {/* Estado: Error */}
      {isError && !isLoading && (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-rojo-200 bg-rojo-50">
          <AlertCircle className="size-12 text-rojo-500 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">
            {t.errorCargar}
          </h2>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            Ocurrió un problema de comunicación al consultar el catálogo gastronómico.
          </p>
          <Button type="button" variant="primary" onClick={() => refetch()}>
            {t.reintentar}
          </Button>
        </Card>
      )}

      {/* Estado: Vacío */}
      {!isLoading && !isError && mesas.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <UtensilsCrossed className="size-12 text-neutro-400 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">
            {t.sinMesasTitulo}
          </h2>
          <p className="text-sm text-neutro-600 max-w-md">
            {t.sinMesasDesc}
          </p>
        </Card>
      )}

      {/* Estado: Sin Resultados */}
      {!isLoading && !isError && mesas.length > 0 && mesasFiltradas.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <AlertCircle className="size-12 text-neutro-400 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">
            {t.sinResultadosTitulo}
          </h2>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            {t.sinResultadosDesc}
          </p>
          <Button type="button" variant="ghost" onClick={handleClearFilters}>
            {t.limpiarFiltros}
          </Button>
        </Card>
      )}

      {/* Grilla de Mesas */}
      {!isLoading && !isError && mesasFiltradas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mesasFiltradas.map((mesa) => {
            const enMantenimiento = mesa.estado === "mantenimiento";
            const sedeNombre = mesa.Sucursal?.nombre || `Sede #${mesa.sucursal_id}`;
            const sucursalMesa = sedesQuery.data?.find((s) => s.id === mesa.sucursal_id);

            return (
              <Card
                key={mesa.id}
                className={`flex flex-col justify-between overflow-hidden p-0 transition-shadow hover:shadow-md ${
                  enMantenimiento ? "opacity-75 bg-neutro-50 border-neutro-200" : ""
                }`}
              >
                <div>
                  {sucursalMesa?.restaurante_imagen_url ? (
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutro-100">
                      <img
                        src={sucursalMesa.restaurante_imagen_url}
                        alt={`Restaurante ${sedeNombre}`}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        loading="lazy"
                      />
                      {sucursalMesa.restaurante_imagen_creditos?.autor && (
                        <span className="absolute bottom-1 right-2 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
                          {sucursalMesa.restaurante_imagen_creditos.url ? (
                            <a
                              href={sucursalMesa.restaurante_imagen_creditos.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:text-neutro-200 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Foto: {sucursalMesa.restaurante_imagen_creditos.autor} ({sucursalMesa.restaurante_imagen_creditos.licencia || "CC"})
                            </a>
                          ) : (
                            `Foto: ${sucursalMesa.restaurante_imagen_creditos.autor} (${sucursalMesa.restaurante_imagen_creditos.licencia || "CC"})`
                          )}
                        </span>
                      )}
                    </div>
                  ) : null}

                  <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-neutro-900">
                        Mesa #{mesa.id}
                      </h2>
                      <div className="flex items-center gap-1.5 text-xs text-neutro-500 mt-0.5">
                        <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                        <span>{sedeNombre}</span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        enMantenimiento
                          ? "bg-advertencia-50 text-advertencia-700 border-advertencia-600/20"
                          : mesa.estado === "ocupada"
                          ? "bg-neutro-100 text-neutro-700 border-neutro-300"
                          : "bg-exito-50 text-exito-700 border-exito-600/20"
                      }`}
                    >
                      {enMantenimiento
                        ? t.estadosMesa.mantenimiento
                        : mesa.estado === "ocupada"
                        ? t.estadosMesa.ocupada
                        : t.estadosMesa.disponible}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-neutro-100 text-sm">
                    <div className="flex items-center justify-between text-neutro-600">
                      <span>{t.zona}:</span>
                      <span className="font-medium text-neutro-900">{mesa.zona}</span>
                    </div>
                    <div className="flex items-center justify-between text-neutro-600">
                      <span>{t.capacidad}:</span>
                      <div className="flex items-center gap-1 font-medium text-neutro-900">
                        <Users className="size-4 text-neutro-500" aria-hidden="true" />
                        <span>{t.capacidadPersonas(mesa.capacidad)}</span>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <Button
                    type="button"
                    variant={enMantenimiento ? "ghost" : "primary"}
                    disabled={enMantenimiento}
                    onClick={() => handleOpenReserva(mesa)}
                    className="w-full justify-center"
                  >
                    <UtensilsCrossed className="size-4 mr-2" aria-hidden="true" />
                    <span>
                      {enMantenimiento
                        ? t.estadosMesa.mantenimiento
                        : t.reservarMesa}
                    </span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Reserva */}
      <ReservaMesaModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setMesaSeleccionada(null);
        }}
        mesa={mesaSeleccionada}
      />
    </section>
  );
};
