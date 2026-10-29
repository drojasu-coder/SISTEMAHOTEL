import { api } from '@/api/client/http';

export interface Punto { fecha: string; valor: number }
export interface EstadoConteo { estado: string; valor: number }
export interface Panorama {
  generado: string; zona_horaria: string; moneda: 'GTQ';
  filtros: { desde: string; hasta: string; sucursal_id: number | null };
  habitaciones: {
    creadas_por_dia: Punto[]; llegadas_por_dia: Punto[]; salidas_por_dia: Punto[];
    estados_en_periodo: { estado: string; reservas: number; importe: number }[];
    por_sede: { sucursal_id: number; sede: string; reservas: number; importe_vigente: number }[];
    estado_fisico_actual: { estado: string; habitaciones: number }[];
  };
  servicios: { restaurante: EstadoConteo[]; actividades: EstadoConteo[]; bienestar: EstadoConteo[]; eventos: EstadoConteo[]; amenidades: EstadoConteo[] };
  finanzas: {
    atribuible_a_sede: boolean;
    pagos_por_estado: { estado: string; cantidad: number; importe: number }[];
    cobrado_por_dia: { fecha: string; valor: number; cantidad: number }[];
    reembolsos: { estado: string; cantidad: number; importe: number }[];
    facturas_por_estado: { estado: string; cantidad: number; importe: number }[];
  };
}

/** GET /api/reportes/panorama (solo administrador general; el servidor valida alcance y fechas). */
export async function consultarPanorama(params: { desde: string; hasta: string; sucursal_id?: number }, signal?: AbortSignal) {
  const response = await api.get<{ success: boolean; data: Panorama }>('/reportes/panorama', { params, signal });
  return response.data;
}
