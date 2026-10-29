import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, Plus } from 'lucide-react';
import { getApiErrorMessage } from '@/api/errors';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { RESERVAS_ROUTES } from '@/features/reservas';
import { ClienteReservasGate } from '@/features/mis-reservas/components/ClienteReservasGate';
import { ReservaFila } from '@/features/mis-reservas/components/ReservaFila';
import { MisReservasLayout } from '@/features/mis-reservas/components/MisReservasLayout';
import { reservaNecesitaCatalogoSedes, vistaDeReserva, type VistaReservas } from '@/features/mis-reservas/formato';
import { useMisReservasQuery } from '@/features/mis-reservas/hooks/useMisReservas';
import { useSedesFallback } from '@/features/mis-reservas/hooks/useSedesFallback';
import { usePublicTexts, usePublicInterface } from '@/i18n/public';

const MisReservasContenido: React.FC<{ userId: number }> = ({ userId }) => {
  const textosMisReservas = usePublicTexts('misReservas');
  const { p } = usePublicInterface();
  const reservasQuery = useMisReservasQuery(userId);
  const reservas = reservasQuery.data ?? [];
  const [vista, setVista] = useState<VistaReservas>('todas');
  const orden = { pendientes: 0, proximas: 1, historial: 2 } as const;
  const visibles = useMemo(() => reservas
    .filter((reserva) => vista === 'todas' || vistaDeReserva(reserva) === vista)
    .sort((a, b) => orden[vistaDeReserva(a)] - orden[vistaDeReserva(b)]
      || (vistaDeReserva(a) === 'historial' ? b.fecha_entrada.localeCompare(a.fecha_entrada) : a.fecha_entrada.localeCompare(b.fecha_entrada))),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [reservas, vista]);
  const conteo = (v: VistaReservas) => v === 'todas' ? reservas.length : reservas.filter((reserva) => vistaDeReserva(reserva) === v).length;

  const necesitaCatalogo = useMemo(
    () => reservas.some(reservaNecesitaCatalogoSedes),
    [reservas],
  );

  const sedesQuery = useSedesFallback(necesitaCatalogo);

  const sedesPorId = useMemo(() => {
    const mapa = new Map<number, string>();
    for (const sede of sedesQuery.data ?? []) {
      mapa.set(sede.id, sede.nombre);
    }
    return mapa;
  }, [sedesQuery.data]);

  const avisoSedes = necesitaCatalogo && sedesQuery.isError;

  return (
    <MisReservasLayout>
      <div className="flex flex-col gap-6">
        {/* Encabezado de sección */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-serif font-semibold text-neutro-900 sm:text-2xl">
              {textosMisReservas.tabs.habitaciones}
            </h1>
            {!reservasQuery.isPending && !reservasQuery.isError && reservas.length > 0 && (
              <p className="text-xs text-neutro-500">
                {textosMisReservas.reservasMostradas(reservas.length)}
              </p>
            )}
          </div>
          <Link
            to={RESERVAS_ROUTES.NUEVA}
            className={buttonStyles({ size: 'sm', className: 'self-start sm:self-center' })}
          >
            <Plus className="size-4" aria-hidden="true" />
            <span>{textosMisReservas.reservar}</span>
          </Link>
        </div>

        {/* Cargando */}
        {reservasQuery.isPending && (
          <div className="flex justify-center py-12">
            <LoadingNotice label={textosMisReservas.cargandoListado} />
          </div>
        )}

        {/* Error */}
        {reservasQuery.isError && (
          <Card className="flex flex-col items-start gap-4">
            <Alert tone="error" title={textosMisReservas.errorListadoTitulo}>
              {getApiErrorMessage(reservasQuery.error)}
            </Alert>
            <Button
              type="button"
              variant="ghost"
              onClick={() => reservasQuery.refetch()}
            >
              {textosMisReservas.acceso.reintentar}
            </Button>
          </Card>
        )}

        {/* Estado vacío */}
        {!reservasQuery.isPending && !reservasQuery.isError && reservas.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <BedDouble className="size-10 text-neutro-300" aria-hidden="true" />
            <div className="flex max-w-sm flex-col gap-1">
              <h2 className="text-base font-serif font-semibold text-neutro-800">
                {textosMisReservas.vacioTitulo}
              </h2>
              <p className="text-xs text-neutro-500">
                {textosMisReservas.vacioDescripcion}
              </p>
            </div>
            <Link
              to={RESERVAS_ROUTES.NUEVA}
              className={buttonStyles({ variant: 'primary', size: 'sm' })}
            >
              <Plus className="size-4" aria-hidden="true" />
              <span>{textosMisReservas.reservar}</span>
            </Link>
          </Card>
        )}

        {/* Listado */}
        {!reservasQuery.isPending && !reservasQuery.isError && reservas.length > 0 && (
          <>
            <div role="group" aria-label={p('resFilters')} className="flex flex-wrap gap-2">
              {(['todas', 'proximas', 'pendientes', 'historial'] as const).map((v) => (
                <Button key={v} type="button" size="sm" variant={vista === v ? 'primary' : 'secondary'} aria-pressed={vista === v} onClick={() => setVista(v)}>
                  {p(({ todas: 'resFilterAll', proximas: 'resFilterUpcoming', pendientes: 'resFilterPending', historial: 'resFilterHistory' } as const)[v])} · {conteo(v)}
                </Button>
              ))}
            </div>
            {visibles.length === 0
              ? <p className="rounded-xl border border-neutro-200 bg-white p-6 text-center text-sm text-neutro-600">{p('resFilterEmpty')}</p>
              : <ul className="divide-y divide-neutro-100 overflow-hidden rounded-xl border border-neutro-200 bg-white">
                  {visibles.map((reserva) => <ReservaFila key={reserva.id} reserva={reserva} sedesPorId={sedesPorId} />)}
                </ul>}
            {avisoSedes && (
              <Alert tone="info">{textosMisReservas.avisoSedes}</Alert>
            )}
          </>
        )}
      </div>
    </MisReservasLayout>
  );
};

export const MisReservasPage: React.FC = () => (
  <ClienteReservasGate>
    {(user) => <MisReservasContenido userId={user.id} />}
  </ClienteReservasGate>
);
