import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { useLocale } from '@/i18n/LocaleContext';
import { getApiErrorMessage } from '@/api/errors';
import { useUpdateHabitacionMutation } from '../hooks/useHabitaciones';
import type { Habitacion, EstadoHabitacion } from '../types';

/** Restricted editor: sends only the physical state accepted by the existing API. */
export function EstadoHabitacionModal({ open, habitacion, onClose, onSuccess }: { open: boolean; habitacion: Habitacion | null; onClose: () => void; onSuccess: (message: string) => void }) {
  const { locale } = useLocale(); const en = locale === 'en';
  const [state, setState] = useState<EstadoHabitacion>('disponible');
  const [error, setError] = useState<string | null>(null);
  const update = useUpdateHabitacionMutation();
  useEffect(() => { if (open && habitacion) { setState(habitacion.estado); setError(null); } }, [open, habitacion]);
  const labels = en ? { disponible: 'Available', ocupada: 'Occupied', limpieza: 'Cleaning', mantenimiento: 'Maintenance' } : { disponible: 'Disponible', ocupada: 'Ocupada', limpieza: 'Limpieza', mantenimiento: 'Mantenimiento' };
  return <Modal open={open} onClose={onClose} busy={update.isPending} title={en ? 'Update physical status' : 'Actualizar estado físico'} closeLabel={en ? 'Close' : 'Cerrar'}>
    <form className="space-y-4" onSubmit={async event => {
      event.preventDefault(); if (!habitacion || update.isPending) return; setError(null);
      try { await update.mutateAsync({ id: habitacion.id, data: { estado: state } }); onSuccess(en ? 'Room status updated.' : 'Estado de habitación actualizado.'); onClose(); }
      catch (cause) { setError(getApiErrorMessage(cause) || (en ? 'Unable to update the room status.' : 'No se pudo actualizar el estado.')); }
    }}>
      <p className="text-sm">{en ? 'Room' : 'Habitación'} {habitacion?.numero}</p>
      <Select label={en ? 'Physical status' : 'Estado físico'} value={state} onChange={event => setState(event.target.value as EstadoHabitacion)}>{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</Select>
      {error && <Alert tone="error">{error}</Alert>}
      <div className="flex flex-wrap justify-end gap-2"><Button variant="ghost" onClick={onClose} disabled={update.isPending}>{en ? 'Cancel' : 'Cancelar'}</Button><Button type="submit" isLoading={update.isPending}>{en ? 'Save status' : 'Guardar estado'}</Button></div>
    </form>
  </Modal>;
}
