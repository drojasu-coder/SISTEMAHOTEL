import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { createAuthenticatedUser } from "../helpers/auth";
import { assignEmpleadoSede, createHabitacion, createHotelFixture } from "../fixtures/hotel";

const db = require("../../src/models");
const endpoint = "/api/admin/dashboard";
function day(offset = 0) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return new Date(Date.parse(`${today}T12:00:00Z`) + offset * 86400000).toISOString().slice(0, 10);
}
async function fixture() {
  const admin = await createAuthenticatedUser({ rol: "admin" });
  const cliente = await createAuthenticatedUser({ rol: "cliente" });
  const a = await createHotelFixture({ estadoHabitacion: 'ocupada' });
  const a2 = await createHabitacion({ sucursal_id: a.sucursal.id, tipo_habitacion_id: a.tipoHabitacion.id, estado: 'ocupada' });
  const b = await createHotelFixture();
  const reserve = (room: number, entry: number, exit: number, estado: string) => db.ReservaHabitacion.create({
    usuario_id: cliente.usuario.id, habitacion_id: room, fecha_entrada: day(entry), fecha_salida: day(exit),
    estado, total: 100, numero_huespedes: 2,
  });
  const stay = await reserve(a.habitacion.id, -1, 1, 'confirmada');
  const departure = await reserve(a2.id, -3, 0, 'confirmada');
  const pending = await reserve(a2.id, 0, 1, 'pendiente');
  await reserve(a2.id, 5, 6, 'confirmada');
  await reserve(b.habitacion.id, 0, 1, 'confirmada');
  return { admin, cliente, a, b, stay, departure, pending };
}
describe('Dashboard: datos operativos reales y ámbito de sede', () => {
  it('separa habitaciones ocupadas de estancias confirmadas y muestra exclusivamente movimientos del día', async () => {
    const { admin, a, departure } = await fixture();
    const response = await request(app).get(endpoint).query({ sucursal_id: a.sucursal.id }).auth(admin.token, { type: 'bearer' });
    expect(response.status).toBe(200);
    expect(response.body.data.resumen).toMatchObject({ total_habitaciones: 2, habitaciones_ocupadas: 2,
      reservas_activas: 1, porcentaje_ocupacion: 50, llegadas_hoy: 0, salidas_hoy: 1, reservas_pendientes: 1 });
    expect(response.body.data.llegadas).toEqual([]);
    expect(response.body.data.salidas.map((r: any) => r.id)).toEqual([departure.id]);
    expect(response.body.data.reservas_recientes.every((r: any) => r.sucursal_id === a.sucursal.id)).toBe(true);
    expect(response.body.data.reservas_recientes.every((r: any) => !('cliente_email' in r) && !('cliente_telefono' in r))).toBe(true);
  });
  it('todas las sedes significa solo las autorizadas para el personal y rechaza otra sede', async () => {
    const { a, b } = await fixture();
    const staff = await createAuthenticatedUser({ rol: 'recepcionista' });
    await assignEmpleadoSede(staff.usuario.id, a.sucursal.id);
    const response = await request(app).get(endpoint).auth(staff.token, { type: 'bearer' });
    expect(response.status).toBe(200);
    expect(response.body.data.resumen.total_habitaciones).toBe(2);
    expect(response.body.data.sedes.map((s: any) => s.id)).toEqual([a.sucursal.id]);
    expect((await request(app).get(endpoint).query({ sucursal_id: b.sucursal.id }).auth(staff.token, { type: 'bearer' })).status).toBe(403);
  });
  it('entrega el alcance autorizado sin consultar reservas ni inventario y valida filtros', async () => {
    const { admin, a, b } = await fixture();
    const staff = await createAuthenticatedUser({ rol: 'gerente_habitaciones' });
    await assignEmpleadoSede(staff.usuario.id, a.sucursal.id, [b.sucursal.id]);
    const inventory = vi.spyOn(db.Habitacion, 'findAll');
    const response = await request(app).get(endpoint).query({ vista: 'alcance' }).auth(staff.token, { type: 'bearer' });
    expect(response.status).toBe(200);
    expect(response.body.data.global).toBe(false);
    expect(response.body.data.sedes.map((s: any) => s.id).sort()).toEqual([a.sucursal.id, b.sucursal.id].sort());
    expect(inventory).not.toHaveBeenCalled();
    for (const sucursal_id of ['abc', '-1', '0', '1.5']) {
      expect((await request(app).get(endpoint).query({ sucursal_id }).auth(admin.token, { type: 'bearer' })).status).toBe(400);
    }
    expect((await request(app).get(endpoint).query({ sucursal_id: 2147483647 }).auth(admin.token, { type: 'bearer' })).status).toBe(404);
  });
  it('no consulta facturas ni pagos para el resumen operativo y conserva datos persistidos', async () => {
    const { admin } = await fixture();
    const invoices = vi.spyOn(db.Factura, 'findAll');
    const payments = vi.spyOn(db.Pago, 'findAll');
    const response = await request(app).get(endpoint).auth(admin.token, { type: 'bearer' });
    expect(response.status).toBe(200);
    expect(invoices).not.toHaveBeenCalled(); expect(payments).not.toHaveBeenCalled();
    expect(response.body.data.resumen.porcentaje_ocupacion).toBe(66.7);
    expect(await db.ReservaHabitacion.count()).toBe(5);
  });
  it('propaga una avería de consulta como error y representa inventario vacío sin porcentaje ficticio', async () => {
    const admin = await createAuthenticatedUser({ rol: 'admin' });
    const empty = await request(app).get(endpoint).auth(admin.token, { type: 'bearer' });
    expect(empty.status).toBe(200);
    expect(empty.body.data.resumen.porcentaje_ocupacion).toBeNull();
    vi.spyOn(db.Habitacion, 'findAll').mockRejectedValueOnce(new Error('QA: database unavailable'));
    const failure = await request(app).get(endpoint).auth(admin.token, { type: 'bearer' });
    expect(failure.status).toBe(500);
    expect(failure.body).not.toHaveProperty('data.resumen');
  });
});
