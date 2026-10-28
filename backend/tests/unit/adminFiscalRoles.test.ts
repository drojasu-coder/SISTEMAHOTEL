import { describe, expect, it, vi } from 'vitest';
import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';

// Router unit test: no models, PostgreSQL, tokens or business writes.
vi.mock('../../src/middlewares/auth.middleware', () => ({
  authMiddleware: (req: Request, res: Response, next: NextFunction) => {
    const rol = req.headers['x-unit-role'];
    if (!rol) return res.status(401).json({ code: 'AUTH_TOKEN_REQUIRED' });
    req.user = { id: 1, rol } as Request['user'];
    next();
  },
}));
vi.mock('../../src/controllers/habitaciones/factura.controller', () => {
  const respond = (_req: Request, res: Response) => res.json({ data: [] });
  return Object.fromEntries(['getAllFacturas', 'getFacturaById', 'createFactura', 'updateFactura', 'deleteFactura'].map(key => [key, respond]));
});
vi.mock('../../src/controllers/habitaciones/facturaItem.controller', () => {
  const respond = (_req: Request, res: Response) => res.json({ data: [] });
  return Object.fromEntries(['getAllFacturaItems', 'getFacturaItemById', 'createFacturaItem', 'updateFacturaItem', 'deleteFacturaItem'].map(key => [key, respond]));
});
import facturas from '../../src/routes/habitaciones/factura.routes';
import items from '../../src/routes/habitaciones/facturaItem.routes';
const app = express();
app.use('/facturas', facturas);
app.use('/factura-items', items);
app.use((err: { statusCode: number; code: string }, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err.statusCode ?? 500).json({ code: err.code });
});
const paths = ['/facturas', '/facturas/1', '/factura-items', '/factura-items/1'];
describe('QA-ADMIN-FACT-AUTH-001 — fiscal read role boundary (no database)', () => {
  it.each(['empleado_operativo', 'gerente_restaurante'])('rejects %s before invoking fiscal controllers', async rol => {
    for (const path of paths) {
      const response = await request(app).get(path).set('x-unit-role', rol);
      expect(response.status, path).toBe(403);
      expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    }
  });
  it.each(['admin', 'recepcionista', 'gerente_habitaciones', 'cliente'])('preserves access to the controller for %s (ownership remains in service)', async rol => {
    for (const path of paths) expect((await request(app).get(path).set('x-unit-role', rol)).status).toBe(200);
  });
  it('requires authentication', async () => {
    for (const path of paths) expect((await request(app).get(path)).status).toBe(401);
  });
});
