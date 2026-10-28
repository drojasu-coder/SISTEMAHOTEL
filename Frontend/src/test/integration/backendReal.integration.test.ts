/**
 * Verificación contra el backend REAL (sin mocks). Se omite si no se define
 * HUNAPU_QA_PASSWORD, por lo que `npm test` no la ejecuta.
 *
 * Requiere un backend levantado exclusivamente contra hotel_test_db (puerto 55432) y
 * cuentas de prueba creadas en esa base:
 *
 *   VITE_API_BASE_URL=http://localhost:4100/api \
 *   HUNAPU_QA_PASSWORD=<contraseña de las cuentas de prueba> \
 *   npx vitest run src/test/integration
 *
 * Cuentas esperadas: qa.<rol>@ejemplo.test para cada rol, qa.inactivo@ejemplo.test
 * (cuenta deshabilitada) y qa.desconocido@ejemplo.test (rol no reconocido por el frontend).
 *
 * Las comprobaciones de permisos envían cuerpos vacíos: el backend responde 403 si el
 * rol no está autorizado y otro 4xx de validación o recurso si lo está, sin escribir datos.
 * Solo la prueba de registro crea una cuenta (en hotel_test_db).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { api, ApiError, httpClient } from '@/api/client/http';
import { abortPrivateRequests, tokenStorage } from '@/api/session';
import { authApi } from '@/features/auth/api/authApi';
import {
  PERMISSIONS,
  getHomeRouteForUser,
  getPanelModules,
  hasPermission,
  type Permission,
} from '@/features/auth/permissions';
import { AuthFlowError, ROLES, type Role } from '@/features/auth/types';

const password = process.env.HUNAPU_QA_PASSWORD ?? '';
const email = (name: string) => `qa.${name}@ejemplo.test`;

/** Operación representativa del backend protegida por cada permiso (requireRole). */
const PROBES: Record<Permission, { method: 'GET' | 'POST' | 'PATCH'; path: string }> = {
  'habitaciones.gestionar': { method: 'PATCH', path: '/habitaciones/999999' },
  'habitaciones.configurar': { method: 'POST', path: '/habitaciones' },
  'reservas.gestionar': { method: 'GET', path: '/admin/dashboard' },
  'facturas.gestionar': { method: 'POST', path: '/facturas' },
  'pagos.administrar': { method: 'POST', path: '/pagos/999999/aprobar-transferencia' },
  'restaurante.gestionar': { method: 'POST', path: '/mesas' },
  'servicios.administrar': { method: 'POST', path: '/amenidades' },
  'personal.administrar': { method: 'GET', path: '/empleados' },
  'configuracion.administrar': { method: 'PATCH', path: '/configuraciones/iva' },
};

async function statusOf(token: string | null, probe: (typeof PROBES)[Permission]) {
  try {
    await httpClient(probe.path, {
      method: probe.method,
      body: probe.method === 'GET' ? undefined : {},
      token,
    });
    return { status: 200, code: undefined as string | undefined };
  } catch (error) {
    if (error instanceof ApiError) return { status: error.status, code: error.code };
    throw error;
  }
}

describe.skipIf(!password)('Backend real (hotel_test_db) — autenticación y permisos', () => {
  afterEach(() => {
    tokenStorage.clear();
  });

  it.each(ROLES)('login y /auth/me de %s devuelven el mismo rol y destino válido', async (rol) => {
    const { accessToken, usuario } = await authApi.login({ email: email(rol), password });
    expect(usuario.rol).toBe(rol);
    expect(accessToken.length).toBeGreaterThan(20);

    // Restauración tras recargar: solo con el token guardado.
    tokenStorage.set(accessToken);
    const restored = await authApi.me();
    expect(restored.rol).toBe(rol);
    expect(restored.email).toBe(email(rol));
    expect(JSON.stringify(restored)).not.toMatch(/password|hash/i);

    expect(getHomeRouteForUser(restored)).toMatch(/^\//);
  });

  it('destinos esperados por rol', async () => {
    const destinations: Record<Role, string> = {
      admin: '/admin',
      recepcionista: '/admin',
      gerente_habitaciones: '/admin',
      gerente_restaurante: '/cuenta',
      empleado_operativo: '/admin',
      cliente: '/',
    };
    for (const rol of ROLES) {
      const { usuario } = await authApi.login({ email: email(rol), password });
      expect(getHomeRouteForUser(usuario), rol).toBe(destinations[rol]);
    }
  });

  it('la tabla de permisos del frontend coincide con requireRole del backend, rol por rol', async () => {
    const mismatches: string[] = [];
    for (const rol of ROLES) {
      const { accessToken } = await authApi.login({ email: email(rol), password });
      for (const permission of Object.keys(PROBES) as Permission[]) {
        const result = await statusOf(accessToken, PROBES[permission]);
        const backendAllows = !(result.status === 403 && result.code === 'INSUFFICIENT_PERMISSIONS');
        const frontendAllows = hasPermission(rol, permission);
        if (backendAllows !== frontendAllows) {
          mismatches.push(
            `${rol} · ${permission}: frontend=${frontendAllows} backend=${backendAllows} (HTTP ${result.status} ${result.code ?? ''})`,
          );
        }
        // Un error 5xx sería un defecto inesperado del backend.
        expect(result.status, `${rol} · ${permission}`).toBeLessThan(500);
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('los módulos de panel de cada rol solo exponen permisos que el backend concede', () => {
    for (const rol of ROLES) {
      for (const module of getPanelModules(rol)) {
        expect(PERMISSIONS[module.permission]).toContain(rol);
      }
    }
  });

  it('sin token las operaciones protegidas responden 401 con un código de sesión', async () => {
    const result = await statusOf(null, PROBES['habitaciones.gestionar']);
    expect(result).toEqual({ status: 401, code: 'AUTH_TOKEN_REQUIRED' });
  });

  it('un token inválido responde 401 INVALID_TOKEN', async () => {
    const result = await statusOf('token-invalido', PROBES['personal.administrar']);
    expect(result).toEqual({ status: 401, code: 'INVALID_TOKEN' });
  });

  it('un 403 ordinario conserva el token válido (la sesión sigue activa)', async () => {
    const { accessToken } = await authApi.login({ email: email('cliente'), password });
    const denied = await statusOf(accessToken, PROBES['personal.administrar']);
    expect(denied).toEqual({ status: 403, code: 'INSUFFICIENT_PERMISSIONS' });

    tokenStorage.set(accessToken);
    await expect(authApi.me()).resolves.toMatchObject({ rol: 'cliente' });
  });

  it('cuenta deshabilitada: el login responde 403 USER_INACTIVE', async () => {
    await expect(authApi.login({ email: email('inactivo'), password })).rejects.toMatchObject({
      status: 403,
      code: 'USER_INACTIVE',
    });
  });

  it('rol desconocido: el backend emite token pero /auth/me responde 403 INVALID_USER_ROLE; el frontend lo rechaza', async () => {
    // El frontend rechaza la respuesta del login antes de guardar nada.
    await expect(authApi.login({ email: email('desconocido'), password })).rejects.toBeInstanceOf(
      AuthFlowError,
    );

    // Evidencia del backend: con ese token, toda petición autenticada se rechaza.
    const raw = await api.post<{ data: { accessToken: string } }>(
      '/auth/login',
      { email: email('desconocido'), password },
      { token: null },
    );
    await expect(api.get('/auth/me', { token: raw.data.accessToken })).rejects.toMatchObject({
      status: 403,
      code: 'INVALID_USER_ROLE',
    });
  });

  it('credenciales incorrectas: 401 INVALID_CREDENTIALS', async () => {
    await expect(
      authApi.login({ email: email('admin'), password: `${password}x` }),
    ).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
  });

  it('cerrar sesión (local) elimina el acceso; el token anterior sigue siendo válido en el servidor', async () => {
    const { accessToken } = await authApi.login({ email: email('admin'), password });
    tokenStorage.set(accessToken);
    await expect(authApi.me()).resolves.toMatchObject({ rol: 'admin' });

    tokenStorage.clear();
    await expect(authApi.me()).rejects.toMatchObject({ status: 401, code: 'AUTH_TOKEN_REQUIRED' });

    // No hay logout ni revocación en el servidor (ver BE-004).
    await expect(api.get('/auth/me', { token: accessToken })).resolves.toBeDefined();
  });

  it('abortar las solicitudes privadas cancela una petición en vuelo', async () => {
    const { accessToken } = await authApi.login({ email: email('admin'), password });
    tokenStorage.set(accessToken);

    const pending = authApi.me();
    abortPrivateRequests();

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('las sedes pueden consultarse sin autenticación', async () => {
    // Este módulo responde { status: 'success', data } (distinto del envoltorio del resto).
    const response = await api.get<{ status: string; data: unknown }>('/sucursales', { token: null });
    expect(response.status).toBe('success');
    expect(Array.isArray(response.data)).toBe(true);
  });

  it('registro: valida, rechaza campos extra y crea siempre un cliente', async () => {
    await expect(
      authApi.register({ nombre: 'QA Débil', email: `qa.debil.${Date.now()}@ejemplo.test`, password: 'corta' }),
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });

    // No se puede elegir el rol desde el cliente (el esquema del backend es estricto).
    await expect(
      api.post(
        '/auth/register',
        { nombre: 'QA Intruso', email: `qa.intruso.${Date.now()}@ejemplo.test`, password: 'Clave1234x', rol: 'admin' },
        { token: null },
      ),
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });

    const unique = `qa.registro.${Date.now()}@ejemplo.test`;
    const created = await authApi.register({ nombre: 'QA Registro', email: unique, password: 'Clave1234x' });
    expect(created.rol).toBe('cliente');

    await expect(
      authApi.register({ nombre: 'QA Registro', email: unique, password: 'Clave1234x' }),
    ).rejects.toMatchObject({ status: 409, code: 'EMAIL_ALREADY_REGISTERED' });

    const { usuario } = await authApi.login({ email: unique, password: 'Clave1234x' });
    expect(usuario.rol).toBe('cliente');
  });
});
