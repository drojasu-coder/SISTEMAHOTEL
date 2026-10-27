import React from 'react';
import { useParams } from 'react-router-dom';
import { AdminDetalleReservaEventoCard } from '@/features/eventos';

export const AdminDetalleReservaEventoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <AdminDetalleReservaEventoCard id={Number(id)} />;
};
