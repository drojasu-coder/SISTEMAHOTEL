import React from 'react';
import { useParams } from 'react-router-dom';
import { CitaBienestarDetalleCard } from '@/features/bienestar';

export const DetalleCitaBienestarPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <CitaBienestarDetalleCard id={Number(id)} />;
};
