import { usePublicTexts, usePublicInterface } from '@/i18n/public';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { MoneyReference } from '@/components/ui/MoneyReference';
import { DataState } from '@/components/ui/DataState';
import { EmptyState } from '@/components/ui/EmptyState';
import { CatalogSkeleton } from '@/components/shared/CatalogState';
import { ServiceCard, ServiceGrid, ServiceMedia } from '@/components/shared/ServiceCard';
import type { HabitacionDisponiblePublico } from '@/features/habitaciones/types';
import { groupByCategory, useRoomCopy } from '@/features/habitaciones/public/roomCategories';

export interface HabitacionesDisponiblesListProps {
  habitaciones: HabitacionDisponiblePublico[];
  isLoading: boolean;
  criteriaChanged: boolean;
  selectedHabitacionId?: number | null;
  onSelectHabitacion: (habitacion: HabitacionDisponiblePublico) => void;
}

export function HabitacionesDisponiblesList({ habitaciones, isLoading, criteriaChanged, selectedHabitacionId, onSelectHabitacion }: HabitacionesDisponiblesListProps) {
  const t = usePublicTexts('crearReserva');
  const { p } = usePublicInterface();
  const copy = useRoomCopy();
  // Una tarjeta por categoría; la cantidad sale de la disponibilidad real del backend.
  const groups = groupByCategory(habitaciones);
  return <div className="space-y-4">
    {criteriaChanged && <Alert tone="warning">{t.avisoCriteriosModificados}</Alert>}
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-serif text-xl font-semibold">{t.seccionResultados}</h2><span role="status" aria-live="polite" className="text-sm text-neutro-600">{isLoading ? t.buscando : t.resultadosEncontrados(groups.length)}</span></div>
    <DataState status={isLoading ? 'loading' : habitaciones.length ? 'success' : 'empty'} loadingLabel={t.buscando} loadingContent={<CatalogSkeleton />} emptyContent={<EmptyState title={t.sinResultadosTitulo} description={t.sinResultadosDesc} />}>
      <ServiceGrid>{groups.map(({ representative: item, rooms }) => {
        const selected = rooms.some((room) => room.id === selectedHabitacionId);
        return <ServiceCard key={item.tipo?.id ?? item.id} headingLevel={3} selected={selected}
        name={item.tipo?.nombre ?? p('room')} site={item.sucursal?.nombre}
        media={<ServiceMedia src={item.imagen_url} alt={item.tipo?.nombre ?? p('room')} credits={item.imagen_creditos} />}
        facts={<><p>{t.capacidadPersonas(item.tipo?.capacidad_maxima ?? 0)}</p><p>{t.nochesCalculadas(item.noches)} {p('staySuffix')}</p><p className="font-medium text-selva-700">{rooms.length === 1 ? copy('availableOne') : copy('available', { n: rooms.length })}</p></>}
        price={<div className="space-y-2"><p>{p('nightlyRate')}{' '}<MoneyReference amount={item.tarifa_noche} /></p><p>{p('estimatedTotal')}{' '}<MoneyReference amount={item.total_estimado} /></p></div>}
        action={<Button variant="secondary" size="sm" className="w-full" disabled={criteriaChanged} onClick={() => onSelectHabitacion(rooms.find((room) => room.id === selectedHabitacionId) ?? item)}>{selected ? p('roomSelected') : t.botonSeleccionar}</Button>} />;
      })}</ServiceGrid>
    </DataState>
  </div>;
}
