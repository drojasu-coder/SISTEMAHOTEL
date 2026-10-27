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

  it('recepcionista y gerente_habitaciones: habitaciones, facturación y pagos', () => {
    expect(moduleIds('recepcionista')).toEqual(['habitaciones', 'facturacion', 'pagos']);
    expect(moduleIds('gerente_habitaciones')).toEqual(['habitaciones', 'facturacion', 'pagos']);
  });

  it('gerente_restaurante: solo restaurante y proveedores', () => {
    expect(moduleIds('gerente_restaurante')).toEqual(['restaurante']);
  });

  it('cliente y empleado_operativo no tienen módulos de panel', () => {
    expect(moduleIds('cliente')).toEqual([]);
    expect(moduleIds('empleado_operativo')).toEqual([]);
    expect(canAccessPanel('cliente')).toBe(false);
    expect(canAccessPanel('empleado_operativo')).toBe(false);
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
    expect(getHomeRouteForUser(userWithRole('gerente_restaurante'))).toBe('/admin');
    expect(getHomeRouteForUser(userWithRole('cliente'))).toBe('/');
    expect(getHomeRouteForUser(userWithRole('empleado_operativo'))).toBe('/cuenta');
    for (const rol of ROLES) {
      expect(getHomeRouteForUser(userWithRole(rol))).toMatch(/^\//);
    }
  });
});

describe('acceso a rutas', () => {
  it('cada ruta de módulo exige el permiso de ese módulo', () => {
    const restaurante = userWithRole('gerente_restaurante');
    expect(canAccessRoute(restaurante, '/admin')).toBe(true);
    expect(canAccessRoute(restaurante, '/admin/restaurante')).toBe(true);
    expect(canAccessRoute(restaurante, '/admin/pagos')).toBe(false);
    expect(canAccessRoute(restaurante, '/admin/personal')).toBe(false);

    const recepcion = userWithRole('recepcionista');
    expect(canAccessRoute(recepcion, '/admin/habitaciones')).toBe(true);
    expect(canAccessRoute(recepcion, '/admin/restaurante')).toBe(false);
    expect(canAccessRoute(recepcion, '/admin/configuracion')).toBe(false);
  });

  it('rutas de panel inexistentes o sin permiso no se permiten', () => {
    expect(canAccessRoute(userWithRole('admin'), '/admin/inventado')).toBe(false);
    expect(canAccessRoute(userWithRole('cliente'), '/admin')).toBe(false);
    expect(canAccessRoute(userWithRole('empleado_operativo'), '/admin')).toBe(false);
  });
});

describe('destino posterior al inicio de sesión', () => {
  it('respeta una ruta de origen interna permitida para el rol', () => {
    expect(getPostLoginRoute(userWithRole('cliente'), '/cuenta')).toBe('/cuenta');
    expect(getPostLoginRoute(userWithRole('admin'), '/admin/pagos')).toBe('/admin/pagos');
  });

  it('no envía a un rol sin permiso a una ruta de panel', () => {
    expect(getPostLoginRoute(userWithRole('cliente'), '/admin')).toBe('/');
    expect(getPostLoginRoute(userWithRole('gerente_restaurante'), '/admin/pagos')).toBe('/admin');
    expect(getPostLoginRoute(userWithRole('empleado_operativo'), '/admin/habitaciones')).toBe('/cuenta');
  });

  it('descarta destinos externos o de autenticación', () => {
    expect(getPostLoginRoute(userWithRole('cliente'), '//sitio-externo.com')).toBe('/');
    expect(getPostLoginRoute(userWithRole('cliente'), 'https://sitio-externo.com')).toBe('/');
    expect(getPostLoginRoute(userWithRole('admin'), '/login')).toBe('/admin');
    expect(getPostLoginRoute(userWithRole('admin'), undefined)).toBe('/admin');
  });
});
