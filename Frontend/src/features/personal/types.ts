export interface Usuario { id: number; nombre: string; email: string; rol: string; activo: boolean; telefono?: string | null }
export interface Sucursal { id: number; nombre: string; activa: boolean }
export interface Empleado { id: number; usuario_id: number; sucursal_id: number; area: string; fecha_contratacion: string | null; Usuario?: Usuario; Sucursal?: Sucursal; sedesAdicionales?: Array<{ sucursal_id: number }> }
export interface Turno { id: number; empleado_id: number; fecha: string; hora_inicio: string; hora_fin: string; Empleado?: Empleado }
export interface Chofer { id: number; nombre: string; licencia: string | null; activo: boolean }
export interface Vehiculo { id: number; tipo: string; placa: string | null; capacidad: number }

/** Roles con accesos existentes en el servidor. */
export const ASSIGNABLE_ROLES = ['admin', 'gerente_restaurante', 'gerente_habitaciones', 'recepcionista', 'empleado_operativo', 'cliente'] as const;
/** Dos secciones: Personal (empleados) y Clientes. Las antiguas ?seccion=usuarios|turnos se redirigen. */
export const SECTIONS = ['empleados', 'clientes'] as const;
export type Section = typeof SECTIONS[number];

export const STAFF_ROLES = ['gerente_habitaciones', 'recepcionista', 'empleado_operativo', 'gerente_restaurante'] as const;

/** Valores laborales persistidos en español, independientes del idioma de la interfaz. */
export const AREA_POR_ROL: Readonly<Partial<Record<string, string>>> = {
  admin: 'Administración',
  gerente_habitaciones: 'Gerencia',
  recepcionista: 'Recepción',
  empleado_operativo: 'Habitaciones',
  gerente_restaurante: 'Restaurante',
};
