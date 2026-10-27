import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Feedback';
import { RESERVAS_ROUTES } from '@/features/reservas';
import { usePublicTexts } from '@/i18n/public';

interface CarritoErrorProps {
  titulo: string;
  descripcion: React.ReactNode;
  onReintentar?: () => void;
  reintentando?: boolean;
}

/** Error de carga con reintento explícito y salida hacia las reservas propias. */
export const CarritoError: React.FC<CarritoErrorProps> = ({
  titulo,
  descripcion,
  onReintentar,
  reintentando = false,
}) => { const textosCarrito = usePublicTexts('carrito'); return (
  <Card className="flex flex-col items-start gap-4">
    <Alert tone="error" title={titulo}>
      <p>{descripcion}</p>
    </Alert>

    <div className="flex flex-wrap items-center gap-3">
      {onReintentar && (
        <Button
          type="button"
          variant="primary"
          onClick={onReintentar}
          isLoading={reintentando}
          disabled={reintentando}
        >
          {!reintentando && (
            <RefreshCw className="size-4" aria-hidden="true" />
          )}
          {textosCarrito.reintentar}
        </Button>
      )}
      <Link
        to={RESERVAS_ROUTES.MIS_RESERVAS}
        className={buttonStyles({ variant: 'ghost' })}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {textosCarrito.volverMisReservas}
      </Link>
    </div>
  </Card>
); };
