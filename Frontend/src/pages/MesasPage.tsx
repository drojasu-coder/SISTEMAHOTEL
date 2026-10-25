import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, UtensilsCrossed, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/features/auth/AuthContext';
import { hasPermission } from '@/features/auth/permissions';
import { es } from '@/i18n/es';
import { useSedesQuery } from '@/features/sedes/hooks/useSedes';
import { useMesasQuery } from '@/features/mesas/hooks/useMesas';
import { MesaFilters } from '@/features/mesas/components/MesaFilters';
import { MesaFormModal } from '@/features/mesas/components/MesaFormModal';
import { MesasList } from '@/features/mesas/components/MesasList';
import type { Mesa } from '@/features/mesas/types';
import { getApiErrorMessage } from '@/api/errors';
import { textosMesas } from '@/features/mesas/texts';
import { RESTAURANTE_ROUTES } from '@/features/restaurante';

export const MesasPage: React.FC = () => {
  const { user } = useAuth();
  const canManageMesas = user ? hasPermission(user.rol, 'restaurante.gestionar') : false;

  const { data: mesas, isLoading, isError, error, refetch } = useMesasQuery();
  const { data: sucursales, isError: isErrorSucursales } = useSedesQuery();

  const [sedeSeleccionada, setSedeSeleccionada] = useState('');
  const [zonaSeleccionada, setZonaSeleccionada] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  /** Zonas presentes en el catálogo cargado: el backend no expone un catálogo de zonas. */
  const zonas = useMemo(() => {
    if (!Array.isArray(mesas)) return [];
    return Array.from(new Set(mesas.map((mesa) => mesa.zona).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'es'),
    );
  }, [mesas]);

  /** Nombre de la sede por identificador, tomado del catálogo real de sedes. */
  const sedeNombrePorId = useMemo(() => {
    const mapa = new Map<number, string>();
    sucursales?.forEach((sede) => mapa.set(sede.id, sede.nombre));
    return mapa;
  }, [sucursales]);

  const mesasFiltradas = useMemo(() => {
    if (!Array.isArray(mesas)) return [];
    return mesas.filter((mesa) => {
      const coincideSede =
        sedeSeleccionada === '' || String(mesa.sucursal_id) === sedeSeleccionada;
      const coincideZona = zonaSeleccionada === '' || mesa.zona === zonaSeleccionada;
      return coincideSede && coincideZona;
    });
  }, [mesas, sedeSeleccionada, zonaSeleccionada]);

  const hayFiltros = sedeSeleccionada !== '' || zonaSeleccionada !== '';

  const handleOpenCreate = () => {
    setMesaSeleccionada(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (mesa: Mesa) => {
    setMesaSeleccionada(mesa);
    setModalOpen(true);
  };

  const handleSuccess = (message: string) => {
    setFeedbackMessage(message);
  };

  const handleClearFilters = () => {
    setSedeSeleccionada('');
    setZonaSeleccionada('');
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow">{es.modulos.restaurante}</p>
          <h1 className="text-[2rem] leading-[2.375rem] md:text-[2.5rem] md:leading-[3rem] text-neutro-900">
            {textosMesas.titulo}
          </h1>
          <p className="text-sm text-neutro-600 max-w-2xl">{textosMesas.descripcion}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
          {user?.rol === 'admin' && (
            <Link
              to={RESTAURANTE_ROUTES.ADMIN_RESERVAS}
              className="inline-flex items-center gap-1.5 rounded-md border border-neutro-300 bg-blanco px-4 py-2 text-sm font-medium text-neutro-700 shadow-sm hover:bg-neutro-50 transition-colors"
            >
              <CalendarCheck className="size-4" aria-hidden="true" />
              <span>Ver reservas de restaurante</span>
            </Link>
          )}

          {canManageMesas && (
            <Button
              type="button"
              variant="primary"
              onClick={handleOpenCreate}
            >
              <Plus className="size-4" aria-hidden="true" />
              <span>{textosMesas.nuevaMesa}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mensaje de confirmación tras guardar */}
      {feedbackMessage && (
        <Alert tone="success">
          <div className="flex items-center justify-between gap-4">
            <span>{feedbackMessage}</span>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              className="text-xs font-semibold underline hover:no-underline"
            >
              {es.comunes.cerrar}
            </button>
          </div>
        </Alert>
      )}

      {/* Filtros por sede y zona */}
      {!isLoading && !isError && Array.isArray(mesas) && mesas.length > 0 && (
        <>
          {isErrorSucursales && (
            <Alert tone="warning">
              No fue posible cargar el catálogo de sedes, por lo que el filtro por sede no está
              disponible. Los demás filtros siguen funcionando.
            </Alert>
          )}
          <MesaFilters
            sedes={isErrorSucursales ? [] : (sucursales ?? [])}
            zonas={zonas}
            sedeSeleccionada={sedeSeleccionada}
            zonaSeleccionada={zonaSeleccionada}
            onSedeChange={setSedeSeleccionada}
            onZonaChange={setZonaSeleccionada}
            onClear={handleClearFilters}
          />
          <span className="text-xs text-neutro-500">
            {mesasFiltradas.length} {textosMesas.mesasMostradas}
          </span>
        </>
      )}

      {/* Estados principales */}
      {isLoading && (
        <div className="py-12 flex justify-center">
          <LoadingNotice label={es.comunes.cargando} />
        </div>
      )}

      {isError && (
        <Card className="flex flex-col items-start gap-4">
          <Alert tone="error" title={textosMesas.errorCargar}>
            {getApiErrorMessage(error)}
          </Alert>
          <Button type="button" variant="ghost" onClick={() => refetch()}>
            {es.comunes.reintentar}
          </Button>
        </Card>
      )}

      {!isLoading && !isError && Array.isArray(mesas) && mesas.length === 0 && (
        <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <UtensilsCrossed className="size-12 text-neutro-400" aria-hidden="true" />
          <div className="flex flex-col gap-1 max-w-md">
            <h2 className="text-lg font-serif font-semibold text-neutro-800">
              {textosMesas.sinMesas}
            </h2>
            <p className="text-xs text-neutro-600">
              {canManageMesas ? textosMesas.sinMesasAyuda : textosMesas.sinMesasAyudaLectura}
            </p>
          </div>
          {canManageMesas && (
            <Button type="button" variant="primary" onClick={handleOpenCreate}>
              <Plus className="size-4" aria-hidden="true" />
              {textosMesas.nuevaMesa}
            </Button>
          )}
        </Card>
      )}

      {!isLoading && !isError && mesas && mesas.length > 0 && mesasFiltradas.length === 0 && (
        <Card className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <p className="text-sm text-neutro-700">{textosMesas.sinResultados}</p>
          {hayFiltros && (
            <Button type="button" variant="ghost" size="sm" onClick={handleClearFilters}>
              {textosMesas.limpiarFiltros}
            </Button>
          )}
        </Card>
      )}

      {!isLoading && !isError && mesasFiltradas.length > 0 && (
        <MesasList
          mesas={mesasFiltradas}
          canEdit={canManageMesas}
          onEdit={handleOpenEdit}
          sedeNombrePorId={sedeNombrePorId}
        />
      )}

      {/* Modales */}
      {canManageMesas && (
        <MesaFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          mesa={mesaSeleccionada}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};
