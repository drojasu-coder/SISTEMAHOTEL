import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { cn } from '@/lib/cn';
import { useLocale } from '@/i18n/LocaleContext';
import { getApiErrorMessage } from '@/api/errors';
import { useUpdateHabitacionMutation } from '../hooks/useHabitaciones';
import type { Habitacion, EstadoHabitacion } from '../types';

const ORDER: EstadoHabitacion[] = ['disponible', 'limpieza', 'mantenimiento', 'ocupada'];

/** Editor restringido: envía solo el estado físico que acepta la API y muestra el resultado real del servidor. */
export function EstadoHabitacionModal({ open, habitacion, onClose, onSuccess }: { open: boolean; habitacion: Habitacion | null; onClose: () => void; onSuccess: (message: string) => void }) {
  const { locale } = useLocale(); const en = locale === 'en';
  const [state, setState] = useState<EstadoHabitacion>('disponible');
  const [error, setError] = useState<string | null>(null);
  const update = useUpdateHabitacionMutation();
  useEffect(() => { if (open && habitacion) { setState(habitacion.estado); setError(null); } }, [open, habitacion]);
  const labels = en ? { disponible: 'Available', ocupada: 'Occupied', limpieza: 'Cleaning', mantenimiento: 'Maintenance' } : { disponible: 'Disponible', ocupada: 'Ocupada', limpieza: 'Limpieza', mantenimiento: 'Mantenimiento' };
  const unchanged = !habitacion || state === habitacion.estado;
  return <Modal open={open} onClose={onClose} busy={update.isPending} title={`${en ? 'Room' : 'Habitación'} ${habitacion?.numero ?? ''}`} description={en ? 'Update the physical status of the room.' : 'Actualice el estado físico de la habitación.'} closeLabel={en ? 'Close' : 'Cerrar'}>
    <form className="space-y-4" onSubmit={async event => {
      event.preventDefault(); if (!habitacion || update.isPending || unchanged) return; setError(null);
      try { await update.mutateAsync({ id: habitacion.id, data: { estado: state } }); onSuccess(en ? `Room ${habitacion.numero}: status updated to ${labels[state]}.` : `Habitación ${habitacion.numero}: estado actualizado a ${labels[state]}.`); onClose(); }
      catch (cause) { setError(getApiErrorMessage(cause) || (en ? 'Unable to update the room status.' : 'No se pudo actualizar el estado.')); }
    }}>
      {habitacion && <p className="text-sm text-neutro-600">{en ? 'Current status' : 'Estado actual'}: <strong className="text-neutro-900">{labels[habitacion.estado] ?? habitacion.estado}</strong></p>}
      <fieldset><legend className="sr-only">{en ? 'New physical status' : 'Nuevo estado físico'}</legend>
        <div className="grid grid-cols-2 gap-2">{ORDER.map(value => <label key={value} className={cn('flex min-h-12 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-colors focus-within:ring-2 focus-within:ring-bronce-600/40', state === value ? 'border-bronce-600 bg-bronce-50 text-bronce-800' : 'border-neutro-300 bg-white text-neutro-700 hover:bg-neutro-50')}>
          <input type="radio" name="estado-fisico" value={value} checked={state === value} onChange={() => setState(value)} className="sr-only" />{labels[value]}</label>)}</div>
      </fieldset>
      <p className="text-xs text-neutro-500">{en ? 'This changes only the physical status. It does not modify any reservation or check a guest in or out.' : 'Solo cambia el estado físico. No modifica reservas ni registra entrada o salida de huéspedes.'}</p>
      {error && <Alert tone="error">{error}</Alert>}
      <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose} disabled={update.isPending}>{en ? 'Cancel' : 'Cancelar'}</Button><Button type="submit" isLoading={update.isPending} disabled={unchanged}>{en ? 'Save status' : 'Guardar estado'}</Button></div>
    </form>
  </Modal>;
}
