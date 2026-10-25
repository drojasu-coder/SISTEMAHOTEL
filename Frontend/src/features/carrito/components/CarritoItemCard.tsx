import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RESERVAS_ROUTES } from '@/features/reservas';
import { ACTIVIDADES_ROUTES } from '@/features/actividades/constants/routes';
import type { CarritoItem } from '../types';
import {
  descripcionItem,
  esItemHabitacion,
  etiquetaTipoItem,
  formatearCantidad,
  formatearGTQ,
  textosCarrito,
} from '../textos';

interface CarritoItemCardProps {
  item: CarritoItem;
  onRetirar: (item: CarritoItem) => void;
  retiroBloqueado: boolean;
}

/**
 * Presenta un artículo tal como lo registró el servidor.
 *
 * No deduce nombres, fechas ni relaciones que la respuesta no incluya. Los
 * artículos que no son habitaciones se identifican por su tipo real y nunca se
 * presentan como reservas de habitación.
 */
export const CarritoItemCard: React.FC<CarritoItemCardProps> = ({
  item,
  onRetirar,
  retiroBloqueado,
}) => {
  const habitacion = esItemHabitacion(item);
  const esActividad = item.tipo_item === 'actividad';
  const descripcion = descripcionItem(item);
  const precio = formatearGTQ(item.precio);
  const cantidad = formatearCantidad(item.cantidad);

  return (
    <article className="surface flex h-full flex-col gap-4 p-4 sm:p-5">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={
              habitacion
                ? 'rounded-full border border-bronce-200 bg-bronce-50 px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-bronce-700'
                : 'rounded-full border border-neutro-200 bg-neutro-100 px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-neutro-700'
            }
          >
            {etiquetaTipoItem(item.tipo_item)}
          </span>
          <span className="text-[0.6875rem] font-semibold uppercase tracking-wide text-neutro-500">
            {textosCarrito.articuloNumero(item.id)}
          </span>
        </div>

        <h2 className="break-words text-lg font-serif font-semibold text-neutro-900">
          {descripcion}
        </h2>

        {habitacion && (
          <Link
            to={RESERVAS_ROUTES.DETALLE(item.referencia_id)}
            className="inline-flex min-h-11 w-fit items-center gap-1 text-xs font-semibold text-bronce-700 hover:text-bronce-800"
          >
            {textosCarrito.verReserva(item.referencia_id)}
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        )}

        {esActividad && (
          <Link
            to={ACTIVIDADES_ROUTES.DETALLE(item.referencia_id)}
            className="inline-flex min-h-11 w-fit items-center gap-1 text-xs font-semibold text-bronce-700 hover:text-bronce-800"
          >
            {textosCarrito.verReserva(item.referencia_id)}
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3 border-y border-neutro-200 py-3 text-xs">
        <div className="flex flex-col gap-1">
          <dt className="eyebrow">{textosCarrito.campos.precio}</dt>
          <dd className="text-neutro-900">{precio}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="eyebrow">{textosCarrito.campos.cantidad}</dt>
          <dd className="text-neutro-900">{cantidad}</dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          {habitacion ? (
            <p className="max-w-xs text-xs text-neutro-600">
              {textosCarrito.notaHabitacion}
            </p>
          ) : (
            <>
              <p className="eyebrow">{textosCarrito.campos.referencia}</p>
              <p className="text-xs text-neutro-700">
                {textosCarrito.referenciaNumero(item.referencia_id)}
              </p>
            </>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRetirar(item)}
          disabled={retiroBloqueado}
          className="inline-flex items-center gap-1.5 text-xs text-neutro-600 hover:text-rojo-700"
          aria-label={textosCarrito.retirarArticulo(item.id)}
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          <span>{textosCarrito.retirar}</span>
        </Button>
      </div>
    </article>
  );
};
