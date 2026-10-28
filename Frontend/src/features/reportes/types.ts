/** Contract: backend/src/modules/reportes/reportes.types.ts, GET /api/reportes/reservas-habitaciones. */
export const reservationStates = ['pendiente', 'confirmada', 'cancelada', 'finalizada', 'expirada'] as const;
export type ReservationState = typeof reservationStates[number];
export type ReportState = ReservationState | 'cotizacion' | 'completada';
export const reportKinds = ['reservas-habitaciones', 'reservas-restaurante', 'actividades-bienestar', 'cotizaciones-eventos'] as const;
export type ReportKind = typeof reportKinds[number];
export const reportStates: Record<ReportKind, readonly ReportState[]> = {
  'reservas-habitaciones': reservationStates,
  'reservas-restaurante': ['confirmada', 'cancelada'],
  'actividades-bienestar': ['confirmada', 'cancelada', 'completada'],
  'cotizaciones-eventos': ['cotizacion', 'confirmada', 'cancelada', 'finalizada'],
};
export interface ReportFilters {
  desde: string;
  hasta: string;
  sucursal_id?: number;
  estado?: ReportState;
}

export interface ReportField {
  clave: string;
  etiqueta: string;
  etiqueta_en: string;
  formato?: 'fecha' | 'entero' | 'importe';
}
/** GET /api/reportes/{reservas-restaurante|actividades-bienestar|cotizaciones-eventos}. */
export interface OperationalReport {
  reporte: Exclude<ReportKind, 'reservas-habitaciones'>;
  titulo: string;
  titulo_en: string;
  generado: string;
  moneda: 'GTQ';
  sede: string;
  filtros: { desde: string; hasta: string; sucursal_id: number | null; estado: ReportState | null };
  criterio: string;
  criterio_en: string;
  nota: string;
  nota_en: string;
  columnas: ReportField[];
  metricas: ReportField[];
  resumen: Record<string, number> & { registros: number };
  registros: Array<Record<string, string | number | null> & { referencia: string }>;
  paginacion: RoomReport['paginacion'];
}
export type CommercialReport = RoomReport | OperationalReport;
export interface ReportRecord {
  id: number;
  sucursal_id: number;
  sede: string;
  habitacion: string;
  tipo_habitacion: string;
  fecha_entrada: string;
  fecha_salida: string;
  estado: string;
  huespedes: number;
  noches_periodo: number;
  importe_reservado: number;
}
export interface RoomReport {
  reporte: 'reservas-habitaciones';
  generado: string;
  moneda: 'GTQ';
  sede: string;
  filtros: { desde: string; hasta: string; sucursal_id: number | null; estado: ReservationState | null };
  criterio: string;
  nota_importes: string;
  resumen: { reservas: number; huespedes: number; noches_periodo: number; importe_reservado: number; canceladas: number; importe_cancelado: number };
  registros: ReportRecord[];
  paginacion: { pagina: number; por_pagina: number; total_paginas: number };
}
