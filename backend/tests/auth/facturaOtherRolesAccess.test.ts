import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { ROLES } from '../../src/constants/roles';
import { createAuthenticatedUser } from '../helpers/auth';
import { assertTestDatabase } from '../helpers/db';

/** Una sesión operativa no obtiene datos fiscales globales ni ítems por identificador. */
describe('QA-ADMIN-FACT-AUTH — Restricción de lectura fiscal', () => {
  it('prohíbe al empleado operativo las cuatro rutas fiscales', async () => {
    expect(await assertTestDatabase()).toBe('hotel_test_db');
    const staff = await createAuthenticatedUser({
      rol: ROLES.EMPLEADO_OPERATIVO,
      email: 'qa-admin-fact-other-roles@hotel.test',
    });
    for (const path of ['/api/facturas', '/api/facturas/1', '/api/factura-items', '/api/factura-items/1']) {
      const result = await request(app).get(path).set('Authorization', `Bearer ${staff.token}`);
      expect(result.status, path).toBe(403);
      expect(result.body.code, path).toBe('INSUFFICIENT_PERMISSIONS');
      expect(result.body.data, path).toBeUndefined();
    }
  });
});
