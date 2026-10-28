import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { usePublicInterface } from '@/i18n/public';
import { roomCriteriaErrors, type RoomCriteria } from './roomSearch';
import { StayDateRange } from './StayDateRange';
import { GuestCount } from './GuestCount';

/** Patrón compartido: una estancia visual, una cantidad y una acción. */
export function RoomSearchPanel({ criteria, onChange, onSearch, loading = false }: { criteria: RoomCriteria; onChange: (changes: Partial<RoomCriteria>) => void; onSearch: () => void; loading?: boolean }) {
  const { p } = usePublicInterface();
  const [attempted, setAttempted] = useState(false);
  const errors = roomCriteriaErrors(criteria);
  return <Card><form noValidate className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => { event.preventDefault(); setAttempted(true); if (!Object.keys(errors).length) onSearch(); }}>
    <div className="sm:col-span-2"><StayDateRange value={criteria} onChange={onChange} disabled={loading}
      arrivalError={attempted && errors.fecha_entrada ? p(errors.fecha_entrada) : undefined}
      departureError={attempted && errors.fecha_salida ? p(errors.fecha_salida) : undefined} /></div>
    <GuestCount label={p('guests')} value={criteria.numero_huespedes} onChange={(value) => onChange({ numero_huespedes: value })} disabled={loading}
      error={attempted && errors.numero_huespedes ? p(errors.numero_huespedes) : undefined} />
    <Button type="submit" isLoading={loading}>{p('roomSearch')}</Button>
  </form></Card>;
}
