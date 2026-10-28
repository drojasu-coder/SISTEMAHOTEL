import { describe, it, expect } from 'vitest';
import {
  PANEL_MODULES,
  canAccessPanel,
  getHomeRouteForUser,
  getPanelModules,
  hasPermission,
} from './permissions';
import { canAccessRoute, getPostLoginRoute } from './routing';
import { ROLES, type AuthUser, type Role } from './types';

const userWithRole = (rol: Role): AuthUser => ({
  id: 1,
  nombre: 'Prueba',
  email: 'admin@ejemplo.com',
  telefono: null,
  rol,
});

const moduleIds = (rol: unknown) => getPanelModules(rol).map((m) => m.id);

describe('permisos derivados del backend', () => {
  it('admin accede a todos los módulos', () => {
    expect(moduleIds('admin')).toEqual(PANEL_MODULES.map((m) => m.id));
  });

  it('recepción gestiona habitaciones y gerencia opera sus módulos sin finanzas globales', () => {
    expect(moduleIds('recepcionista')).toEqual(['habitaciones']);
    expect(moduleIds('gerente_habitaciones')).toEqual(['habitaciones', 'restaurante', 'servicios', 'personal']);
  });

  it('el rol histórico de restaurante no crea una quinta interfaz operativa', () => {
    expect(moduleIds('gerente_restaurante')).toEqual([]);
  });

  it('cliente conserva el sitio público y encargado recibe únicamente habitaciones', () => {
    expect(moduleIds('cliente')).toEqual([]);
    expect(moduleIds('empleado_operativo')).toEqual(['habitaciones']);
    expect(canAccessPanel('cliente')).toBe(false);
    expect(canAccessPanel('empleado_operativo')).toBe(true);
  });

  it('un rol desconocido no tiene ningún permiso', () => {
    for (const unknownRole of ['superadmin', 'ADMIN', '', undefined, null, 42]) {
      expect(canAccessPanel(unknownRole)).toBe(false);
      expect(hasPermission(unknownRole, 'habitaciones.gestionar')).toBe(false);
    }
  });

  it('cada rol conocido tiene un destino válido', () => {
    expect(getHomeRouteForUser(userWithRole('admin'))).toBe('/admin');
    expect(getHomeRouteForUser(userWithRole('recepcionista'))).toBe('/admin');
    expect(getHomeRouteForUser(userWithRole('gerente_habitaciones'))).toBe('/admin');
    expect(getHomeRouteForUser(userWithRole('gerente_restaurante'))).toBe('/cuenta');
    expect(getHomeRouteForUser(userWithRole('cliente'))).toBe('/');
    expect(getHomeRouteForUser(userWithRole('empleado_operativo'))).toBe('/admin');
    for (const rol of ROLES) {
      expect(getHomeRouteForUser(userWithRole(rol))).toMatch(/^\//);
    }
  });
});

describe('acceso a rutas', () => {
  it('cada ruta de módulo exige el permiso de ese módulo', () => {
    const restaurante = userWithRole('gerente_habitaciones');
    expect(canAccessRoute(restaurante, '/admin')).toBe(true);
    expect(canAccessRoute(restaurante, '/admin/restaurante')).toBe(true);
    expect(canAccessRoute(restaurante, '/admin/pagos')).toBe(false);
    expect(canAccessRoute(restaurante, '/admin/personal')).toBe(true);

    const recepcion = userWithRole('recepcionista');
    expect(canAccessRoute(recepcion, '/admin/habitaciones')).toBe(true);
    expect(canAccessRoute(recepcion, '/admin/restaurante')).toBe(false);
    expect(canAccessRoute(recepcion, '/admin/configuracion')).toBe(false);
  });

  it('rutas de panel inexistentes o sin permiso no se permiten', () => {
    expect(canAccessRoute(userWithRole('admin'), '/admin/inventado')).toBe(false);
    expect(canAccessRoute(userWithRole('cliente'), '/admin')).toBe(false);
    expect(canAccessRoute(userWithRole('empleado_operativo'), '/admin')).toBe(true);
    expect(canAccessRoute(userWithRole('empleado_operativo'), '/admin/reservas')).toBe(false);
    expect(canAccessRoute(userWithRole('empleado_operativo'), '/admin/tipos-habitacion')).toBe(false);
  });
});

describe('destino posterior al inicio de sesión', () => {
  it('respeta una ruta de origen interna permitida para el rol', () => {
    expect(getPostLoginRoute(userWithRole('cliente'), '/cuenta')).toBe('/cuenta');
    expect(getPostLoginRoute(userWithRole('admin'), '/admin/pagos')).toBe('/admin/pagos');
  });

  it('no envía a un rol sin permiso a una ruta de panel', () => {
    expect(getPostLoginRoute(userWithRole('cliente'), '/admin')).toBe('/');
    expect(getPostLoginRoute(userWithRole('gerente_restaurante'), '/admin/pagos')).toBe('/cuenta');
    expect(getPostLoginRoute(userWithRole('empleado_operativo'), '/admin/habitaciones')).toBe('/admin/habitaciones');
  });

  it('descarta destinos externos o de autenticación', () => {
    expect(getPostLoginRoute(userWithRole('cliente'), '//sitio-externo.com')).toBe('/');
    expect(getPostLoginRoute(userWithRole('cliente'), 'https://sitio-externo.com')).toBe('/');
    expect(getPostLoginRoute(userWithRole('admin'), '/login')).toBe('/admin');
    expect(getPostLoginRoute(userWithRole('admin'), undefined)).toBe('/admin');
  });
});

describe('restricciones definitivas de gestión', () => {
  it.each(['gerente_habitaciones', 'recepcionista', 'empleado_operativo'] as const)('%s no recibe permisos financieros, globales ni reportes', role => {
    for (const permission of ['facturas.gestionar', 'pagos.administrar', 'configuracion.administrar'] as const) expect(hasPermission(role, permission)).toBe(false);
    expect(canAccessRoute(userWithRole(role), '/admin/reportes')).toBe(false);
  });
});
