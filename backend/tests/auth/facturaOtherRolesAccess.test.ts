import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { ROLES } from '../../src/constants/roles';
import { createAuthenticatedUser } from '../helpers/auth';
import { assertTestDatabase } from '../helpers/db';

/** Regresión de privacidad: roles ajenos a facturación no leen datos fiscales de todo el hotel. */
describe('Privacidad de facturación entre roles', () => {
  it('deniega las cuatro consultas a un empleado operativo sin permisos financieros', async () => {
    expect(await assertTestDatabase()).toBe('hotel_test_db');
    const empleado = await createAuthenticatedUser({
      rol: ROLES.EMPLEADO_OPERATIVO,
      email: 'qa-factura-roles-operativo@hotel.test',
    });
    const endpoints = ['/api/facturas', '/api/facturas/1', '/api/factura-items', '/api/factura-items/1'];
    for (const path of endpoints) {
      const response = await request(app)
        .get(path)
        .set('Authorization', `Bearer ${empleado.token}`);
      expect(response.status, path).toBe(403);
      expect(response.body.code, path).toBe('INSUFFICIENT_PERMISSIONS');
      expect(response.body.data, path).toBeUndefined();
    }
  });
});

