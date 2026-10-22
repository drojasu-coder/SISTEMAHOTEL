import { es } from '@/i18n/es';
import { isKnownRole, type AuthUser, type Role } from './types';

/**
 * Permisos de interfaz derivados de la autorización REAL del backend.
 *
 * Cada permiso corresponde a un conjunto de roles que el backend exige con
 * `requireRole(...)` en las rutas indicadas (revisión 2ed9ef5). No se inventan ni se
 * amplían permisos: si el backend cambia, esta tabla debe actualizarse con él.
 *
 * Estos permisos solo deciden qué se muestra y a dónde se navega. La autorización
 * definitiva la aplica siempre el servidor en cada petición.
 *
 * Fuera de este alcance (no son permisos del panel): las operaciones de cliente
 * (crear reservas, carrito) y las lecturas abiertas a cualquier usuario autenticado
 * con filtrado de propiedad en servicios.
 */
export type Permission =
  | 'habitaciones.gestionar'
  | 'facturas.gestionar'
  | 'pagos.administrar'
  | 'restaurante.gestionar'
  | 'servicios.administrar'
  | 'personal.administrar'
  | 'configuracion.administrar';

const ADMIN: Role = 'admin';

export const PERMISSIONS: Record<Permission, readonly Role[]> = {
  // routes/habitaciones/{habitacion,tipoHabitacion,parqueo,promocion,reservaHabitacion,reservaParqueo}.routes.ts
  // → rolesGestionHabitaciones = admin, recepcionista, gerente_habitaciones
  'habitaciones.gestionar': [ADMIN, 'recepcionista', 'gerente_habitaciones'],

  // routes/habitaciones/{factura,facturaItem}.routes.ts → rolesGestionFacturas
  'facturas.gestionar': [ADMIN, 'recepcionista', 'gerente_habitaciones'],

  // routes/pagos/pago.routes.ts (aprobar-transferencia, reembolso) y
  // utils/paymentOwnership.ts → PAYMENT_ADMINISTRATIVE_ROLES
  'pagos.administrar': [ADMIN, 'recepcionista', 'gerente_habitaciones'],

  // routes/restaurante/mesa.routes.ts y routes/proveedores/*.routes.ts
  // → admin, gerente_restaurante
  'restaurante.gestionar': [ADMIN, 'gerente_restaurante'],

  // routes/{actividades,amenidades,bienestar,parque,eventos}: altas/bajas de catálogo y
  // listados/estados de reservas de servicio exigen admin
  'servicios.administrar': [ADMIN],

  // routes/usuarios, personal (empleados, turnos), transporte (choferes, vehiculos): admin
  'personal.administrar': [ADMIN],

  // routes/sucursales (alta/edición/baja) y routes/configuracion.routes.ts (IVA): admin
  'configuracion.administrar': [ADMIN],
};

/** Módulos del panel. Cada uno exige un permiso explícito. */
export interface PanelModule {
  id: 'habitaciones' | 'facturacion' | 'pagos' | 'restaurante' | 'servicios' | 'personal' | 'configuracion';
  label: string;
  path: string;
  permission: Permission;
}

export const PANEL_MODULES: readonly PanelModule[] = [
  { id: 'habitaciones', label: es.modulos.habitaciones, path: '/admin/habitaciones', permission: 'habitaciones.gestionar' },
  { id: 'facturacion', label: es.modulos.facturacion, path: '/admin/facturacion', permission: 'facturas.gestionar' },
  { id: 'pagos', label: es.modulos.pagos, path: '/admin/pagos', permission: 'pagos.administrar' },
  { id: 'restaurante', label: es.modulos.restaurante, path: '/admin/restaurante', permission: 'restaurante.gestionar' },
  { id: 'servicios', label: es.modulos.servicios, path: '/admin/servicios', permission: 'servicios.administrar' },
  { id: 'personal', label: es.modulos.personal, path: '/admin/personal', permission: 'personal.administrar' },
  { id: 'configuracion', label: es.modulos.configuracion, path: '/admin/configuracion', permission: 'configuracion.administrar' },
];

/** Un rol desconocido no tiene ningún permiso. */
export function hasPermission(role: unknown, permission: Permission): boolean {
  return isKnownRole(role) && PERMISSIONS[permission].includes(role);
}

export function getPanelModules(role: unknown): PanelModule[] {
  return PANEL_MODULES.filter((module) => hasPermission(role, module.permission));
}

/** Entra al panel quien tenga al menos un módulo habilitado. */
export function canAccessPanel(role: unknown): boolean {
  return getPanelModules(role).length > 0;
}

/**
 * Destino inicial tras autenticarse, siempre válido para un rol conocido:
 * - con módulos de panel → /admin
 * - cliente → sitio público
 * - rol conocido sin módulos (p. ej. empleado_operativo) → /cuenta
 */
export function getHomeRouteForUser(user: Pick<AuthUser, 'rol'>): string {
  if (canAccessPanel(user.rol)) return '/admin';
  if (user.rol === 'cliente') return '/';
  return '/cuenta';
}
