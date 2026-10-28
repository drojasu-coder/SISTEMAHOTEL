import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ApiError } from '@/api/client/http';
import { getApiErrorMessage } from '@/api/errors';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { RESERVAS_ROUTES } from '@/features/reservas';
import { ClienteReservasGate } from '@/features/mis-reservas/components/ClienteReservasGate';
import { ReservaDetalle } from '@/features/mis-reservas/components/ReservaDetalle';
import { ReservaEstadoBadge } from '@/features/mis-reservas/components/ReservaEstadoBadge';
import {
  parseReservaId,
  reservaNecesitaCatalogoSedes,
} from '@/features/mis-reservas/formato';
import { useReservaHabitacionQuery } from '@/features/mis-reservas/hooks/useMisReservas';
import { useSedesFallback } from '@/features/mis-reservas/hooks/useSedesFallback';
import { usePublicTexts } from '@/i18n/public';

interface EstadoErrorProps {
  titulo: string;
  descripcion: string;
  onRetry?: () => void;
}

const EstadoError: React.FC<EstadoErrorProps> = ({
  titulo,
  descripcion,
  onRetry,
}) => { const textosMisReservas = usePublicTexts('misReservas'); return (
  <Card className="flex flex-col items-start gap-4">
    <Alert tone="error">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-serif font-semibold">{titulo}</h2>
        <p className="text-xs">{descripcion}</p>
      </div>
    </Alert>
    <div className="flex flex-wrap items-center gap-3">
      {onRetry && (
        <Button type="button" variant="primary" onClick={onRetry}>
          {textosMisReservas.acceso.reintentar}
        </Button>
      )}
      <Link
        to={RESERVAS_ROUTES.MIS_RESERVAS}
        className={buttonStyles({ variant: 'ghost' })}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {textosMisReservas.volverListado}
      </Link>
    </div>
  </Card>
); };

interface ErrorDetalle {
  titulo: string;
  descripcion: string;
  puedeReintentar: boolean;
}

function describirError(error: unknown, textosMisReservas: ReturnType<typeof usePublicTexts<'misReservas'>>): ErrorDetalle {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return {
        titulo: textosMisReservas.sinAccesoTitulo,
        descripcion: textosMisReservas.sinAccesoDescripcion,
        puedeReintentar: false,
      };
    }

    if (error.status === 404) {
      return {
        titulo: textosMisReservas.noEncontradaTitulo,
        descripcion: textosMisReservas.noEncontradaDescripcion,
        puedeReintentar: false,
      };
    }

    if (error.status === 0) {
      return {
        titulo: textosMisReservas.errorConexionTitulo,
        descripcion: textosMisReservas.errorConexionDescripcion,
        puedeReintentar: true,
      };
    }
  }

  return {
    titulo: textosMisReservas.errorDetalleTitulo,
    descripcion: getApiErrorMessage(error),
    puedeReintentar: true,
  };
}

const DetalleContenido: React.FC<{ id: number; userId: number }> = ({
  id,
  userId,
}) => {
  const textosMisReservas = usePublicTexts('misReservas');
  const reservaQuery = useReservaHabitacionQuery(id, userId);

  // La clave de consulta incluye el ID, pero se comprueba también el dato para
  // no mostrar jamás el detalle anterior durante un cambio de reserva.
  const reserva =
    reservaQuery.data?.id === id ? reservaQuery.data : undefined;

  const necesitaCatalogo =
    reserva && !reservaQuery.isError
      ? reservaNecesitaCatalogoSedes(reserva)
      : false;
  const sedesQuery = useSedesFallback(necesitaCatalogo);

  const sedesPorId = useMemo(() => {
    const mapa = new Map<number, string>();
    for (const sede of sedesQuery.data ?? []) {
      mapa.set(sede.id, sede.nombre);
    }
    return mapa;
  }, [sedesQuery.data]);

  const avisoSedes = necesitaCatalogo && sedesQuery.isError;
  const error = reservaQuery.isError
    ? describirError(reservaQuery.error, textosMisReservas)
    : null;
  const noEncontrada =
    !reservaQuery.isPending && !reservaQuery.isError && !reserva;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <Link
        to={RESERVAS_ROUTES.MIS_RESERVAS}
        className="inline-flex min-h-11 w-fit items-center gap-2 text-xs font-semibold text-neutro-600 hover:text-bronce-700"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {textosMisReservas.volverListado}
      </Link>

      <div className="flex flex-col gap-2">
        <p className="eyebrow">{textosMisReservas.detalleEtiqueta}</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[2rem] leading-[2.375rem] text-neutro-900 md:text-[2.5rem] md:leading-[3rem]">
            {textosMisReservas.reservaNumero(id)}
          </h1>
          {reserva && !reservaQuery.isError && (
            <ReservaEstadoBadge estado={reserva.estado} />
          )}
        </div>
      </div>

      {reservaQuery.isPending && (
        <div className="flex justify-center py-10">
          <LoadingNotice label={textosMisReservas.cargandoDetalle} />
        </div>
      )}

      {error && (
        <EstadoError
          titulo={error.titulo}
          descripcion={error.descripcion}
          onRetry={
            error.puedeReintentar
              ? () => {
                  void reservaQuery.refetch();
                }
              : undefined
          }
        />
      )}

      {noEncontrada && (
        <EstadoError
          titulo={textosMisReservas.noEncontradaTitulo}
          descripcion={textosMisReservas.noEncontradaDescripcion}
        />
      )}

      {reserva && !reservaQuery.isError && (
        <ReservaDetalle
          reserva={reserva}
          sedesPorId={sedesPorId}
          avisoSedes={avisoSedes}
        />
      )}
    </section>
  );
};

const IdInvalido: React.FC = () => { const textosMisReservas = usePublicTexts('misReservas'); return (
  <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
    <div className="flex flex-col gap-2">
      <p className="eyebrow">{textosMisReservas.detalleEtiqueta}</p>
      <h1 className="text-[2rem] leading-[2.375rem] text-neutro-900 md:text-[2.5rem] md:leading-[3rem]">
        {textosMisReservas.detalleEtiqueta}
      </h1>
    </div>
    <EstadoError
      titulo={textosMisReservas.idInvalidoTitulo}
      descripcion={textosMisReservas.idInvalidoDescripcion}
    />
  </section>
); };

/**
 * Detalle de una reserva propia.
 *
 * Funciona con acceso directo o recarga porque consulta el ID de la ruta y el
 * backend, sin depender de datos enviados desde el listado.
 */
export const DetalleReservaHabitacionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const reservaId = parseReservaId(id);

  return (
    <ClienteReservasGate>
      {(user) =>
        reservaId === null ? (
          <IdInvalido />
        ) : (
          <DetalleContenido id={reservaId} userId={user.id} />
        )
      }
    </ClienteReservasGate>
  );
};
