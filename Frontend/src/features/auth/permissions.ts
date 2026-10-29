import { es } from '@/i18n/es';
import { isKnownRole, type AuthUser, type Role } from './types';

/**
 * Permisos de interfaz derivados de la autorización REAL del backend.
 *
 * Cada permiso corresponde a las rutas existentes y al adaptador territorial de
 * modules/operaciones/operaciones.routes.ts. Si cambia la autorización del servidor,
 * esta tabla debe actualizarse con ella.
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
  | 'reservas.gestionar'
  | 'habitaciones.configurar'
  | 'facturas.gestionar'
  | 'pagos.administrar'
  | 'restaurante.gestionar'
  | 'servicios.administrar'
  | 'personal.administrar'
  | 'configuracion.administrar';

const ADMIN: Role = 'admin';

export const PERMISSIONS: Record<Permission, readonly Role[]> = {
  // routes/habitaciones/{habitacion,tipoHabitacion,parqueo,promocion,reservaHabitacion,reservaParqueo}.routes.ts
  // El encargado consulta habitaciones y modifica solo el estado físico.
  'habitaciones.gestionar': [ADMIN, 'recepcionista', 'gerente_habitaciones', 'empleado_operativo'],
  'habitaciones.configurar': [ADMIN, 'recepcionista', 'gerente_habitaciones'],
  'reservas.gestionar': [ADMIN, 'recepcionista', 'gerente_habitaciones'],

  // routes/habitaciones/{factura,facturaItem}.routes.ts → rolesGestionFacturas
  'facturas.gestionar': [ADMIN],

  // routes/pagos/pago.routes.ts (aprobar-transferencia, reembolso) y
  // utils/paymentOwnership.ts → PAYMENT_ADMINISTRATIVE_ROLES
  'pagos.administrar': [ADMIN],

  // Catálogo y reservas de restaurante: admin global o gerente en sus sedes.
  'restaurante.gestionar': [ADMIN, 'gerente_habitaciones', 'gerente_restaurante'],

  // Catálogos y estados de reservas: admin global o gerente en sus sedes.
  'servicios.administrar': [ADMIN, 'gerente_habitaciones'],

  // Admin gestiona usuarios/asignaciones; gerente solo empleados y turnos de sus sedes.
  'personal.administrar': [ADMIN, 'gerente_habitaciones'],

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
 * - restaurante y encargado → su módulo operativo
 * - administrador, gerente de sede y recepción → /admin
 * - cliente → sitio público
 */
export function getHomeRouteForUser(user: Pick<AuthUser, 'rol'>): string {
  if (user.rol === 'gerente_restaurante') return '/admin/restaurante';
  if (user.rol === 'empleado_operativo') return '/admin/habitaciones';
  if (canAccessPanel(user.rol)) return '/admin';
  if (user.rol === 'cliente') return '/';
  return '/cuenta';
}
