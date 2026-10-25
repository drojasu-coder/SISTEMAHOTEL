import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/AuthContext';
import { CARRITO_ROUTES } from '../constants/routes';
import { useAddReservaToCarrito } from '../hooks/useAddReservaToCarrito';
import { textosCarrito } from '../textos';
import type { TipoItemCarrito } from '../types';

export interface BotonAnadirAlCarritoProps {
  reservaId: number;
  /** Estado actual de la reserva en el frontend */
  reservaEstado: string;
  tipo_item?: TipoItemCarrito;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onSuccess?: () => void;
}

/** Estados terminales según backend que no pueden agregarse a un carrito */
const ESTADOS_TERMINALES = new Set([
  'cancelada',
  'cancelado',
  'expirada',
  'expirado',
  'pagada',
  'pagado',
  'usada',
  'usado',
  'completada',
  'completado',
  'finalizada',
  'finalizado',
]);

/**
 * Botón interactivo para añadir una reserva de habitación existente al carrito activo.
 *
 * Elegibilidad:
 * - Solo visible/activo para clientes autenticados.
 * - Deshabilitado si la reserva está en un estado terminal evidente.
 * - No asume campo pagado: el backend valida la condición financiera en resolveHabitacion.
 * - Impide envíos duplicados durante la ejecución.
 */
export const BotonAnadirAlCarrito: React.FC<BotonAnadirAlCarritoProps> = ({
  reservaId,
  reservaEstado,
  tipo_item = 'habitacion',
  variant = 'primary',
  size = 'md',
  className,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { anadirAlCarrito, isLoading, feedback, limpiarFeedback } =
    useAddReservaToCarrito({
      tipo_item,
      onSuccess: () => onSuccess?.(),
    });

  // Solo clientes pueden utilizar el carrito de compras
  if (user?.rol !== 'cliente') {
    return null;
  }

  const esTerminal = ESTADOS_TERMINALES.has(reservaEstado.toLowerCase());

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoading && !esTerminal) {
      anadirAlCarrito(reservaId);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant={variant}
          size={size}
          onClick={handleClick}
          isLoading={isLoading}
          disabled={isLoading || esTerminal}
          className={className}
          aria-label={textosCarrito.anadirAlCarrito}
        >
          <ShoppingCart className="size-4" aria-hidden="true" />
          <span>
            {isLoading
              ? textosCarrito.anadiendoAlCarrito
              : textosCarrito.anadirAlCarrito}
          </span>
        </Button>

        {feedback?.verCarrito && (
          <Link
            to={CARRITO_ROUTES.CARRITO}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-bronce-300 bg-white px-3 py-2 text-xs font-semibold text-bronce-700 transition-colors hover:bg-bronce-50"
          >
            <Check className="size-3.5" aria-hidden="true" />
            <span>{textosCarrito.verCarrito}</span>
          </Link>
        )}
      </div>

      {esTerminal && (
        <p className="text-xs text-neutro-500">
          {textosCarrito.noElegibleEstado}
        </p>
      )}

      {feedback && (
        <div className="flex flex-col gap-1.5 pt-1">
          <Alert tone={feedback.tono}>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium">{feedback.texto}</p>
              {feedback.tono === 'success' && (
                <p className="text-[0.6875rem] text-neutro-500">
                  {textosCarrito.anadirExitoNota}
                </p>
              )}
            </div>
          </Alert>

          {feedback.esIncierto && (
            <div className="flex items-center gap-2">
              <Link
                to={CARRITO_ROUTES.CARRITO}
                className="text-xs font-semibold text-bronce-700 underline hover:text-bronce-800"
              >
                {textosCarrito.verCarrito}
              </Link>
              <button
                type="button"
                onClick={limpiarFeedback}
                className="text-xs text-neutro-500 hover:text-neutro-700"
              >
                {textosCarrito.descartar}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
