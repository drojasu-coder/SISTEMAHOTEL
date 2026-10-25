import React from 'react';
import { useParams } from 'react-router-dom';
import { AdminDetalleCitaCard } from '@/features/bienestar';

export const AdminDetalleCitaSpaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <AdminDetalleCitaCard id={Number(id)} />;
};
