import React from 'react';
import { ClienteReservasGate } from '@/features/mis-reservas/components/ClienteReservasGate';
import { MiViaje } from '@/features/mi-viaje';

/** «Mi viaje»: itinerario de solo lectura del cliente autenticado. */
export const MiViajePage: React.FC = () => (
  <ClienteReservasGate>
    {(user) => <MiViaje userId={user.id} />}
  </ClienteReservasGate>
);
