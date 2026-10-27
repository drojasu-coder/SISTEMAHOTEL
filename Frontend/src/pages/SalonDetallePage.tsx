import React from 'react';
import { useParams } from 'react-router-dom';
import { SalonDetalleCard } from '@/features/eventos';

export const SalonDetallePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <SalonDetalleCard id={Number(id)} />;
};
