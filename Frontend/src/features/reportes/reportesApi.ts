import { api } from '@/api/client/http';
import type { ReportFilters, CommercialReport, ReportKind } from './types';

const endpoint = (kind: ReportKind) => `/reportes/${kind}`;
export const reportesApi = {
  async consultar(filters: ReportFilters, pagina: number, signal?: AbortSignal, kind: ReportKind = 'reservas-habitaciones') {
    const response = await api.get<{ success: boolean; data: CommercialReport }>(endpoint(kind), {
      params: { ...filters, pagina, por_pagina: 20 }, signal,
    });
    return response.data;
  },
  async descargar(filters: ReportFilters, formato: 'pdf' | 'xlsx', kind: ReportKind = 'reservas-habitaciones') {
    const mime = formato === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const blob = await api.get<Blob>(endpoint(kind), { params: { ...filters, formato }, responseType: 'blob', headers: { Accept: mime } });
    if (!blob.size || !blob.type.includes(mime)) throw new Error('No se recibió un archivo válido. Intente descargarlo de nuevo.');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${kind}-${filters.desde}-${filters.hasta}-sede-${filters.sucursal_id ?? 'todas'}.${formato}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
