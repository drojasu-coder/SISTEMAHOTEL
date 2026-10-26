import React from 'react';
import { es } from '@/i18n/es';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { Skeleton } from './Skeleton';

export type DataStatus = 'success' | 'loading' | 'empty' | 'error';

export interface DataStateProps {
  status?: DataStatus;
  onRetry?: () => void;
  children?: React.ReactNode;
}

/**
 * Contenedor por estado de datos: loading / empty / error / success.
 * Centraliza la representación de los estados de consulta para que el resto
 * de la aplicación no duplique pantallas de carga, vacío y error.
 */
export const DataState: React.FC<DataStateProps> = ({
  status = 'success',
  onRetry = () => {},
  children,
}) => {
  if (status === 'loading') {
    return (
      <div role="status" className="flex flex-col gap-4 p-4" aria-label={es.comunes.cargando}>
        <span className="sr-only">{es.comunes.cargando}</span>
        <Skeleton className="w-2/3" />
        <Skeleton />
        <Skeleton className="h-16" />
      </div>
    );
  }
  if (status === 'empty') return <EmptyState />;
  if (status === 'error') return <ErrorState onRetry={onRetry} />;
  return <>{children}</>;
};
