import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, Plus, Sparkles, Building2 } from 'lucide-react';
import { getApiErrorMessage } from '@/api/errors';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { RESERVAS_ROUTES } from '@/features/reservas';
import { AMENIDADES_ROUTES } from '@/features/amenidades';
import { ACTIVIDADES_ROUTES } from '@/features/actividades';
import { BIENESTAR_ROUTES } from '@/features/bienestar';
import { EVENTOS_ROUTES } from '@/features/eventos';
import { Heart } from 'lucide-react';
import { Compass } from 'lucide-react';
import { RESTAURANTE_ROUTES } from '@/features/restaurante';
import { UtensilsCrossed } from 'lucide-react';
import { ClienteReservasGate } from '@/features/mis-reservas/components/ClienteReservasGate';
import { ReservaCard } from '@/features/mis-reservas/components/ReservaCard';
import { reservaNecesitaCatalogoSedes } from '@/features/mis-reservas/formato';
import { useMisReservasQuery } from '@/features/mis-reservas/hooks/useMisReservas';
import { useSedesFallback } from '@/features/mis-reservas/hooks/useSedesFallback';
import { textosMisReservas } from '@/features/mis-reservas/textos';

const MisReservasContenido: React.FC<{ userId: number }> = ({ userId }) => {
  const reservasQuery = useMisReservasQuery(userId);
  const reservas = reservasQuery.data ?? [];

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
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Pestañas de navegación entre habitaciones, restaurante, amenidades, actividades, bienestar y eventos */}
      <div className="flex border-b border-neutro-200 overflow-x-auto">
        <Link
          to={RESERVAS_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-bronce-600 px-4 py-3 text-sm font-semibold text-bronce-700 whitespace-nowrap"
          aria-current="page"
        >
          <BedDouble className="size-4" aria-hidden="true" />
          <span>Reservas de Habitación</span>
        </Link>
        <Link
          to={RESTAURANTE_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-neutro-600 hover:border-neutro-300 hover:text-neutro-900 transition-colors whitespace-nowrap"
        >
          <UtensilsCrossed className="size-4" aria-hidden="true" />
          <span>Reservas de Mesa</span>
        </Link>
        <Link
          to={AMENIDADES_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-neutro-600 hover:border-neutro-300 hover:text-neutro-900 transition-colors whitespace-nowrap"
        >
          <Sparkles className="size-4" aria-hidden="true" />
          <span>Pases de Amenidades</span>
        </Link>
        <Link
          to={ACTIVIDADES_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-neutro-600 hover:border-neutro-300 hover:text-neutro-900 transition-colors whitespace-nowrap"
        >
          <Compass className="size-4" aria-hidden="true" />
          <span>Actividades Recreativas</span>
        </Link>
        <Link
          to={BIENESTAR_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-neutro-600 hover:border-neutro-300 hover:text-neutro-900 transition-colors whitespace-nowrap"
        >
          <Heart className="size-4" aria-hidden="true" />
          <span>Bienestar y Spa</span>
        </Link>
        <Link
          to={EVENTOS_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-neutro-600 hover:border-neutro-300 hover:text-neutro-900 transition-colors whitespace-nowrap"
        >
          <Building2 className="size-4" aria-hidden="true" />
          <span>Eventos y Salones</span>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow">{textosMisReservas.subtitulo}</p>
          <h1 className="text-[2rem] leading-[2.375rem] text-neutro-900 md:text-[2.5rem] md:leading-[3rem]">
            {textosMisReservas.titulo}
          </h1>
          <p className="max-w-2xl text-sm text-neutro-600">
            {textosMisReservas.descripcion}
          </p>
        </div>

        <Link
          to={RESERVAS_ROUTES.NUEVA}
          className={buttonStyles({
            className: 'self-start sm:self-center',
          })}
        >
          <Plus className="size-4" aria-hidden="true" />
          <span>{textosMisReservas.reservar}</span>
        </Link>
      </div>

      {reservasQuery.isPending && (
        <div className="flex justify-center py-12">
          <LoadingNotice label={textosMisReservas.cargandoListado} />
        </div>
      )}

      {reservasQuery.isError && (
        <Card className="flex flex-col items-start gap-4">
          <Alert
            tone="error"
            title={textosMisReservas.errorListadoTitulo}
          >
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

      {!reservasQuery.isPending &&
        !reservasQuery.isError &&
        reservas.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <BedDouble
              className="size-12 text-neutro-400"
              aria-hidden="true"
            />
            <div className="flex max-w-md flex-col gap-1">
              <h2 className="text-lg font-serif font-semibold text-neutro-800">
                {textosMisReservas.vacioTitulo}
              </h2>
              <p className="text-xs text-neutro-600">
                {textosMisReservas.vacioDescripcion}
              </p>
            </div>
            <Link
              to={RESERVAS_ROUTES.NUEVA}
              className={buttonStyles({ variant: 'primary' })}
            >
              <Plus className="size-4" aria-hidden="true" />
              <span>{textosMisReservas.reservar}</span>
            </Link>
          </Card>
        )}

      {!reservasQuery.isPending &&
        !reservasQuery.isError &&
        reservas.length > 0 && (
          <>
            <p className="text-xs text-neutro-500">
              {textosMisReservas.reservasMostradas(reservas.length)}
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {reservas.map((reserva) => (
                <ReservaCard
                  key={reserva.id}
                  reserva={reserva}
                  sedesPorId={sedesPorId}
                />
              ))}
            </div>
            {avisoSedes && (
              <Alert tone="info">{textosMisReservas.avisoSedes}</Alert>
            )}
          </>
        )}
    </section>
  );
};

export const MisReservasPage: React.FC = () => (
  <ClienteReservasGate>
    {(user) => <MisReservasContenido userId={user.id} />}
  </ClienteReservasGate>
);
