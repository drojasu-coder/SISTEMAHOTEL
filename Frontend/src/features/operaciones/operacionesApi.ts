import { api } from '@/api/client/http';

/** Contratos mínimos de lectura: los campos adicionales del servidor se ignoran. */
export interface ApiCollection<T> { data: T[]; success: boolean; }
export interface Factura {
  id: number; usuario_id: number; nit: string; nombre_fiscal: string;
  subtotal: string | number; iva: string | number; total: string | number;
  estado: string; fecha_emision?: string | null; createdAt?: string;
}
export interface FacturaItem {
  id: number; factura_id: number; descripcion?: string;
  cantidad?: number; precio_unitario?: string | number; subtotal?: string | number;
}
export interface Pago {
  id: number; monto: string | number; moneda: string; metodo: string; tipo_pago: string;
  estado: string; carrito_id?: number | null; reserva_habitacion_id?: number | null;
  fecha_pago?: string | null; createdAt?: string;
}
export interface Empleado {
  id: number; usuario_id: number; sucursal_id: number; area: string;
  fecha_contratacion?: string | null; Usuario?: { nombre: string; email?: string };
  Sucursal?: { nombre: string };
}
export interface Turno {
  id: number; empleado_id: number; fecha: string; hora_inicio: string; hora_fin: string;
  Empleado?: Empleado;
}
export interface Chofer { id: number; nombre: string; licencia?: string | null; activo: boolean; }
export interface Vehiculo { id: number; tipo: string; placa?: string | null; capacidad: number; }

const list = async <T>(endpoint: string): Promise<T[]> => {
  const response = await api.get<ApiCollection<T>>(endpoint);
  if (!response || !Array.isArray(response.data)) {
    throw new Error('La respuesta del servidor no contiene un listado válido.');
  }
  return response.data;
};

export const operacionesApi = {
  facturas: () => list<Factura>('/facturas'),
  facturaItems: () => list<FacturaItem>('/factura-items'),
  pagos: () => list<Pago>('/pagos'),
  empleados: () => list<Empleado>('/empleados'),
  turnos: () => list<Turno>('/turnos'),
  choferes: () => list<Chofer>('/choferes'),
  vehiculos: () => list<Vehiculo>('/vehiculos'),
};

export const dineroGTQ = (value: string | number | null | undefined): string => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(amount)
    : '—';
};

export const fechaCorta = (value?: string | null): string => {
  if (!value) return 'Sin fecha';
  // YYYY-MM-DD se deja sin conversión de zona horaria para no mover el día.
  return value.slice(0, 10);
};
