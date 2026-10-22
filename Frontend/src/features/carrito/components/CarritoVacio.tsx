import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Plus, RefreshCw, ShoppingCart } from 'lucide-react';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RESERVAS_ROUTES } from '@/features/reservas';
import { textosCarrito } from '../textos';

interface CarritoVacioProps {
  titulo: string;
  descripcion: string;
  onActualizar: () => void;
  actualizando: boolean;
}

/**
 * Estado sin artículos. Se usa tanto si no existe un carrito activo como si el
 * carrito vigente está vacío. Nunca crea un carrito automáticamente.
 */
export const CarritoVacio: React.FC<CarritoVacioProps> = ({
  titulo,
  descripcion,
  onActualizar,
  actualizando,
}) => (
  <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
    <ShoppingCart
      className="size-12 text-neutro-400"
      aria-hidden="true"
    />
    <div className="flex max-w-md flex-col gap-1">
      <h2 className="text-lg font-serif font-semibold text-neutro-800">
        {titulo}
      </h2>
      <p className="text-xs text-neutro-600">{descripcion}</p>
    </div>

    <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
      <Link
        to={RESERVAS_ROUTES.NUEVA}
        className={buttonStyles({ className: 'w-full sm:w-auto' })}
      >
        <Plus className="size-4" aria-hidden="true" />
        {textosCarrito.reservar}
      </Link>
      <Link
        to={RESERVAS_ROUTES.MIS_RESERVAS}
        className={buttonStyles({
          variant: 'ghost',
          className: 'w-full sm:w-auto',
        })}
      >
        <CalendarDays className="size-4" aria-hidden="true" />
        {textosCarrito.irMisReservas}
      </Link>
    </div>

    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onActualizar}
      isLoading={actualizando}
      disabled={actualizando}
    >
      {!actualizando && <RefreshCw className="size-4" aria-hidden="true" />}
      {textosCarrito.actualizar}
    </Button>
  </Card>
);
