import { usePublicTexts, usePublicInterface } from '@/i18n/public';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { MoneyReference } from '@/components/ui/MoneyReference';
import { DataState } from '@/components/ui/DataState';
import { EmptyState } from '@/components/ui/EmptyState';
import { CatalogSkeleton } from '@/components/shared/CatalogState';
import { ServiceCard, ServiceGrid, ServiceMedia } from '@/components/shared/ServiceCard';
import type { HabitacionDisponible } from '../types';

export interface HabitacionesDisponiblesListProps {
  habitaciones: HabitacionDisponible[];
  isLoading: boolean;
  criteriaChanged: boolean;
  selectedHabitacionId?: number | null;
  onSelectHabitacion: (habitacion: HabitacionDisponible) => void;
}

export function HabitacionesDisponiblesList({ habitaciones, isLoading, criteriaChanged, selectedHabitacionId, onSelectHabitacion }: HabitacionesDisponiblesListProps) {
  const t = usePublicTexts('crearReserva');
  const { p } = usePublicInterface();
  return <div className="space-y-4">
    {criteriaChanged && <Alert tone="warning">{t.avisoCriteriosModificados}</Alert>}
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-serif text-xl font-semibold">{t.seccionResultados}</h2><span className="text-sm text-neutro-600">{!isLoading && t.resultadosEncontrados(habitaciones.length)}</span></div>
    <DataState status={isLoading ? 'loading' : habitaciones.length ? 'success' : 'empty'} loadingLabel={t.buscando} loadingContent={<CatalogSkeleton />} emptyContent={<EmptyState title={t.sinResultadosTitulo} description={t.sinResultadosDesc} />}>
      <ServiceGrid>{habitaciones.map((item) => <ServiceCard key={item.id} headingLevel={3} selected={selectedHabitacionId === item.id}
        name={t.habitacionNumero(item.numero)} site={item.Sucursal?.nombre}
        media={<ServiceMedia src={item.imagen_url} alt={`${item.TipoHabitacion?.nombre ?? p('room')} ${item.numero}`} credits={item.imagen_creditos} />}
        facts={<><p lang="es">{item.TipoHabitacion?.nombre}</p><p>{t.capacidadPersonas(item.TipoHabitacion?.capacidad_maxima ?? 0)}</p><p>{t.nochesCalculadas(item.noches)} {p('staySuffix')}</p></>}
        price={<div className="space-y-2"><p>{p('nightlyRate')}: <MoneyReference amount={item.tarifa_noche} /></p><p>{p('estimatedTotal')}: <MoneyReference amount={item.total_estimado} /></p></div>}
        action={<Button variant="secondary" size="sm" className="w-full" disabled={criteriaChanged} onClick={() => onSelectHabitacion(item)}>{selectedHabitacionId === item.id ? p('roomSelected') : t.botonSeleccionar}</Button>} />)}</ServiceGrid>
    </DataState>
  </div>;
}
