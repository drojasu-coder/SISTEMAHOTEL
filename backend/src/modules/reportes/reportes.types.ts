export const ROOM_RESERVATION_STATES = ["pendiente", "confirmada", "cancelada", "finalizada", "expirada"] as const;
export type RoomReservationState = typeof ROOM_RESERVATION_STATES[number];

export interface RoomReportFilters {
  desde: string;
  hasta: string;
  sucursal_id?: number;
  estado?: RoomReservationState;
  formato: "json" | "pdf" | "xlsx";
  pagina: number;
  por_pagina: number;
}

export interface RoomReportRow {
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

export interface RoomReportSummary {
  reservas: number;
  huespedes: number;
  noches_periodo: number;
  importe_reservado: number;
  canceladas: number;
  importe_cancelado: number;
}

export interface RoomReservationsReport {
  reporte: "reservas-habitaciones";
  generado: string;
  moneda: "GTQ";
  sede: string;
  filtros: { desde: string; hasta: string; sucursal_id: number | null; estado: RoomReservationState | null };
  criterio: string;
  nota_importes: string;
  resumen: RoomReportSummary;
  registros: RoomReportRow[];
  paginacion: { pagina: number; por_pagina: number; total_paginas: number };
}

export const REPORT_CRITERION = "Incluye estancias con entrada hasta la fecha final (inclusive) y salida posterior a la fecha inicial. La salida no cuenta como noche. Noches: solo las comprendidas en el período, según el estado seleccionado.";
export const REPORT_AMOUNTS_NOTE = "Importes completos de las estancias incluidas, sin prorratear; incluyen canceladas y expiradas si el filtro las incluye. Son importes reservados, no pagos cobrados. Huéspedes: suma por reserva, no personas únicas. No se registra una fecha histórica de cancelación.";

export const OPERATIONAL_REPORTS = ["reservas-restaurante", "actividades-bienestar", "cotizaciones-eventos"] as const;
export type OperationalReportKind = typeof OPERATIONAL_REPORTS[number];
export type OperationalFilters = Omit<RoomReportFilters, "estado"> & { estado?: string };
export interface ReportField {
  clave: string;
  etiqueta: string;
  etiqueta_en: string;
  formato?: "fecha" | "entero" | "importe";
}
export interface OperationalReport {
  reporte: OperationalReportKind;
  titulo: string;
  titulo_en: string;
  generado: string;
  moneda: "GTQ";
  sede: string;
  filtros: { desde: string; hasta: string; sucursal_id: number | null; estado: string | null };
  criterio: string;
  criterio_en: string;
  nota: string;
  nota_en: string;
  columnas: ReportField[];
  metricas: ReportField[];
  resumen: Record<string, number> & { registros: number };
  registros: Array<Record<string, string | number | null> & { referencia: string }>;
  paginacion: RoomReservationsReport["paginacion"];
}
