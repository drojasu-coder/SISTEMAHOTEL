import React from 'react';
import { useParams } from 'react-router-dom';
import { ReservaEventoDetalleCard } from '@/features/eventos';

export const DetalleReservaEventoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <ReservaEventoDetalleCard id={Number(id)} />;
};
