import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import app from "../../src/app";
import { createAuthenticatedUser } from "../helpers/auth";
import { createSucursal } from "../fixtures/hotel";

const db = require("../../src/models");
const owned: any[] = [];
const keep = async (promise: Promise<any>) => { const row = await promise; owned.push(row); return row; };
afterEach(async () => {
  for (const row of owned.splice(0).reverse()) {
    const current = await row.constructor.findByPk(row.id);
    // Do not remove a different agent's row if another QA run reset this DB.
    if (current && current.createdAt.getTime() === row.createdAt.getTime()) await current.destroy();
  }
});
async function user(rol: "admin" | "gerente_habitaciones" | "recepcionista" | "empleado_operativo" | "cliente") {
  const value = await createAuthenticatedUser({ rol, email: `final-roles-${randomUUID()}@hotel.test` });
  owned.push(value.usuario); return value;
}
const api = (method: "get" | "post" | "patch" | "delete", path: string, token: string, body?: unknown) => {
  const call = request(app)[method](`/api${path}`).auth(token, { type: "bearer" });
  return body === undefined ? call : call.send(body);
};

describe("Cuatro roles operativos: HTTP y PostgreSQL", () => {
  it("bloquea finanzas globales de recepción y gerencia mientras conserva el acceso del administrador", async () => {
    const admin = await user("admin");
    for (const rol of ["recepcionista", "gerente_habitaciones", "empleado_operativo"] as const) {
      const staff = await user(rol);
      for (const path of ["/facturas", "/factura-items", "/pagos"]) {
        expect((await api("get", path, staff.token)).status, `${rol} ${path}`).toBe(403);
      }
    }
    expect((await api("get", "/facturas", admin.token)).status).toBe(200);
  });

  it("encargado puede cambiar el estado físico propio, pero no identidad, precios ni sedes", async () => {
    const staff = await user("empleado_operativo");
    const a = await keep(createSucursal()); const b = await keep(createSucursal());
    await keep(db.Empleado.create({ usuario_id: staff.usuario.id, sucursal_id: a.id, area: "Habitaciones" }));
    const type = await keep(db.TipoHabitacion.create({ nombre: `Rol ${randomUUID()}`, capacidad_maxima: 2, tarifa_noche: 100 }));
    const own = await keep(db.Habitacion.create({ sucursal_id: a.id, tipo_habitacion_id: type.id, numero: "ROL-OWN", estado: "disponible" }));
    const other = await keep(db.Habitacion.create({ sucursal_id: b.id, tipo_habitacion_id: type.id, numero: "ROL-OTHER", estado: "disponible" }));
    const list = await api("get", "/habitaciones", staff.token); expect(list.status).toBe(200);
    expect(list.body.data.map((x: any) => x.id)).toEqual([own.id]);
    expect((await api("patch", `/habitaciones/${own.id}`, staff.token, { estado: "limpieza" })).status).toBe(200);
    expect((await own.reload()).estado).toBe("limpieza");
    expect((await api("patch", `/habitaciones/${other.id}`, staff.token, { estado: "mantenimiento" })).status).toBe(403);
    expect((await api("patch", `/habitaciones/${own.id}`, staff.token, { estado: "disponible", sucursal_id: b.id })).status).toBe(400);
    expect((await api("get", "/habitaciones?sucursal_id=" + b.id, staff.token)).status).toBe(403);
    expect((await api("get", "/reservas-habitacion", staff.token)).status).toBe(403);
    expect((await api("get", "/usuarios", staff.token)).status).toBe(403);
    expect((await other.reload()).estado).toBe("disponible");
  });

  it("administrador crea los cuatro roles, asigna sedes adicionales y revoca su acceso sin SQL manual", async () => {
    const admin = await user("admin"); const a = await keep(createSucursal()); const b = await keep(createSucursal());
    for (const role of ["admin", "gerente_habitaciones", "recepcionista", "empleado_operativo"] as const) {
      const email = `assigned-${randomUUID()}@hotel.test`;
      const created = await api("post", "/usuarios", admin.token, { nombre: "Asignación de rol QA", email, password: "Verified-QA-2026", rol: role });
      expect(created.status).toBe(201); const id = created.body.data.id; owned.push(await db.Usuario.findByPk(id));
      const employee = await api("post", "/empleados", admin.token, { usuario_id: id, sucursal_id: a.id, sedes_adicionales: [b.id], area: "Operaciones" });
      expect(employee.status).toBe(201); const emp = await db.Empleado.findByPk(employee.body.data.id); owned.push(emp);
      owned.push(...await db.EmpleadoSede.findAll({ where: { empleado_id: emp.id } }));
      expect(employee.body.data.sedesAdicionales.map((x: any) => x.sucursal_id)).toEqual([b.id]);
      const login = await request(app).post("/api/auth/login").send({ email, password: "Verified-QA-2026" });
      expect(login.status).toBe(200); const token = login.body.data.accessToken;
      const scope = await api("get", "/admin/alcance", token); expect(scope.status).toBe(200);
      expect(scope.body.data.global).toBe(role === "admin");
      if (role !== "admin") expect(scope.body.data.sedes.map((x: any) => x.id).sort()).toEqual([a.id, b.id].sort());
      expect((await api("patch", `/empleados/${emp.id}`, admin.token, { sedes_adicionales: [] })).status).toBe(200);
      if (role !== "admin") expect((await api("get", "/admin/alcance", token)).body.data.sedes.map((x: any) => x.id)).toEqual([a.id]);
      expect((await api("patch", `/usuarios/${id}/estado`, admin.token, { activo: false })).status).toBe(200);
      expect((await api("get", "/admin/alcance", token)).status).toBe(403);
    }
  });

  it.each(["gerente_habitaciones", "recepcionista", "empleado_operativo"] as const)("%s sin ficha o con sede inactiva no obtiene alcance", async role => {
    const staff = await user(role);
    expect((await api("get", "/admin/alcance", staff.token)).status).toBe(403);
    const inactive = await keep(createSucursal({ activa: false }));
    await keep(db.Empleado.create({ usuario_id: staff.usuario.id, sucursal_id: inactive.id, area: "QA" }));
    expect((await api("get", "/habitaciones", staff.token)).status).toBe(403);
  });

  it("recepción consulta y finaliza una estancia de su sede, sin acceder a otra sede", async () => {
    const staff = await user("recepcionista"); const client = await user("cliente");
    const a = await keep(createSucursal()); const b = await keep(createSucursal());
    await keep(db.Empleado.create({ usuario_id: staff.usuario.id, sucursal_id: a.id, area: "Recepción" }));
    const type = await keep(db.TipoHabitacion.create({ nombre: `Recep ${randomUUID()}`, tarifa_noche: 100, capacidad_maxima: 2 }));
    const now = new Date(); const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guatemala", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
    const yesterday = new Date(Date.parse(today) - 86400000).toISOString().slice(0, 10);
    const bookings = [];
    for (const site of [a, b]) {
      const room = await keep(db.Habitacion.create({ sucursal_id: site.id, tipo_habitacion_id: type.id, numero: "RECEP-QA", estado: "disponible" }));
      bookings.push(await keep(db.ReservaHabitacion.create({ usuario_id: client.usuario.id, habitacion_id: room.id, fecha_entrada: yesterday, fecha_salida: today, numero_huespedes: 2, total: 100, estado: "confirmada" })));
    }
    const dashboard = await api("get", "/admin/dashboard", staff.token); expect(dashboard.status).toBe(200);
    expect(dashboard.body.data.resumen.salidas_hoy).toBe(1);
    const list = await api("get", "/reservas-habitacion", staff.token); expect(list.status).toBe(200);
    expect(list.body.data.map((row: any) => row.id)).toEqual([bookings[0].id]);
    expect((await api("get", `/reservas-habitacion/${bookings[1].id}`, staff.token)).status).toBe(403);
    const out = await api("patch", `/reservas-habitacion/${bookings[0].id}`, staff.token, { estado: "finalizada" });
    expect(out.status, JSON.stringify(out.body)).toBe(200);
    expect((await bookings[0].reload()).estado).toBe("finalizada"); expect(Number(bookings[0].total)).toBe(100);
    expect((await bookings[1].reload()).estado).toBe("confirmada");
    expect((await api("get", `/admin/dashboard?sucursal_id=${b.id}`, staff.token)).status).toBe(403);
  });

  it("cliente conserva registro, reserva propia y precio del servidor; no obtiene administración", async () => {
    const email = `client-final-${randomUUID()}@hotel.test`;
    const registration = await request(app).post("/api/auth/register").send({ nombre: "Cliente QA", email, password: "Verified-QA-2026" });
    expect(registration.status).toBe(201); owned.push(await db.Usuario.findByPk(registration.body.data.id));
    const login = await request(app).post("/api/auth/login").send({ email, password: "Verified-QA-2026" });
    expect(login.status).toBe(200); const token = login.body.data.data?.accessToken ?? login.body.data.accessToken;
    expect(login.body.data.usuario.rol).toBe("cliente");
    const site = await keep(createSucursal());
    const type = await keep(db.TipoHabitacion.create({ nombre: `Cliente ${randomUUID()}`, tarifa_noche: 123.45, capacidad_maxima: 2 }));
    const room = await keep(db.Habitacion.create({ sucursal_id: site.id, tipo_habitacion_id: type.id, numero: "CLIENT-QA", estado: "disponible" }));
    const body = { habitacion_id: room.id, fecha_entrada: "2043-01-10", fecha_salida: "2043-01-12", numero_huespedes: 2 };
    expect((await request(app).post("/api/reservas-habitacion").send(body)).status).toBe(401);
    const reserved = await api("post", "/reservas-habitacion", token, body);
    expect(reserved.status, JSON.stringify(reserved.body)).toBe(201);
    const row = await db.ReservaHabitacion.findByPk(reserved.body.data.id); owned.push(row);
    expect(Number(row.total)).toBe(246.9); expect(row.usuario_id).toBe(registration.body.data.id);
    const mine = await api("get", "/reservas-habitacion", token); expect(mine.status).toBe(200);
    expect(mine.body.data.map((x: any) => x.id)).toEqual([row.id]);
    expect((await api("get", "/admin/dashboard", token)).status).toBe(403);
    expect((await api("get", "/usuarios", token)).status).toBe(403);
  });
});

async function commercialFixture() {
  const manager = await user("gerente_habitaciones"); const client = await user("cliente");
  const a = await keep(createSucursal()); const b = await keep(createSucursal()); const foreign = await keep(createSucursal());
  const employee = await keep(db.Empleado.create({ usuario_id: manager.usuario.id, sucursal_id: a.id, area: "Gerencia" }));
  await keep(db.EmpleadoSede.create({ empleado_id: employee.id, sucursal_id: b.id }));
  const records: Record<string, { own: number; other: number; patch: Record<string, unknown>; status?: boolean }> = {};
  for (const site of [a, foreign]) {
    const store = (url: string, id: number, patch: Record<string, unknown>, status = false) => {
      if (!records[url]) records[url] = { own: 0, other: 0, patch, status };
      records[url][site === a ? "own" : "other"] = id;
    };
    const mesa = await keep(db.Mesa.create({ sucursal_id: site.id, zona: "Terraza QA", capacidad: 6 })); store("mesas", mesa.id, { zona: "Jardín QA" });
    const activity = await keep(db.RecursoActividad.create({ sucursal_id: site.id, tipo: "kayak", nombre: "Recurso QA", precio_hora: 100 })); store("recursos-actividad", activity.id, { nombre: "Recurso actualizado QA" });
    const amenity = await keep(db.Amenidad.create({ sucursal_id: site.id, nombre: "Sala QA", aforo_maximo: 5, reservable: true })); store("amenidades", amenity.id, { nombre: "Sala actualizada QA" });
    const therapist = await keep(db.Terapeuta.create({ sucursal_id: site.id, nombre: "Terapeuta QA", activo: true })); store("terapeutas", therapist.id, { nombre: "Terapeuta actualizado QA" });
    const wellness = await keep(db.ServicioBienestar.create({ sucursal_id: site.id, nombre: "Bienestar QA", precio: 100, duracion_minutos: 60 })); store("servicios-spa", wellness.id, { nombre: "Servicio actualizado QA" });
    const salon = await keep(db.Salon.create({ sucursal_id: site.id, nombre: "Salón QA", capacidad_maxima: 50, tarifa_base: 1000 })); store("salones", salon.id, { nombre: "Salón actualizado QA" });
    const base = { usuario_id: client.usuario.id, fecha: "2042-06-01", estado: "confirmada" };
    const table = await keep(db.ReservaMesa.create({ ...base, mesa_id: mesa.id, hora: "12:00", numero_comensales: 2 })); store("reservas-mesa", table.id, { estado: "cancelada" }, true);
    const rental = await keep(db.ReservaActividad.create({ ...base, recurso_id: activity.id, hora_inicio: "10:00", hora_fin: "11:00", total: 100 })); store("reservas-actividad", rental.id, { estado: "cancelada" }, true);
    const booking = await keep(db.ReservaAmenidad.create({ ...base, amenidad_id: amenity.id, franja_horaria: "12:00-13:00" })); store("reservas-amenidad", booking.id, { estado: "cancelada" }, true);
    const cita = await keep(db.CitaBienestar.create({ ...base, servicio_bienestar_id: wellness.id, terapeuta_id: therapist.id, hora_inicio: "13:00", hora_fin: "14:00" })); store("citas-spa", cita.id, { estado: "cancelada" }, true);
    const event = await keep(db.ReservaEvento.create({ ...base, salon_id: salon.id, tipo_evento: "Reunión", hora_inicio: "15:00", hora_fin: "17:00", numero_invitados: 20, estado: "cotizacion", total: 1000, anticipo: 300 })); store("reservas-evento", event.id, { estado: "cancelada" }, true);
  }
  const extra = await keep(db.Mesa.create({ sucursal_id: b.id, zona: "Sede adicional QA", capacidad: 4 }));
  return { manager, client, a, b, foreign, records, employee, extra };
}
describe("Gerente de sede: módulos existentes y autorización territorial", () => {
  it("conserva el filtro de servicios inactivos dentro de las sedes autorizadas", async () => {
    const { manager, a, foreign } = await commercialFixture();
    const own = await keep(db.ServicioBienestar.create({ sucursal_id: a.id, nombre: "Inactivo QA", precio: 100, duracion_minutos: 60, activo: false }));
    const other = await keep(db.ServicioBienestar.create({ sucursal_id: foreign.id, nombre: "Inactivo ajeno QA", precio: 100, duracion_minutos: 60, activo: false }));
    expect((await api("get", "/servicios-spa", manager.token)).body.data.map((x: any) => x.id)).not.toContain(own.id);
    const all = await api("get", "/servicios-spa?incluir_inactivos=true", manager.token); expect(all.status).toBe(200);
    expect(all.body.data.map((x: any) => x.id)).toContain(own.id); expect(all.body.data.map((x: any) => x.id)).not.toContain(other.id);
    expect((await api("get", "/servicios-spa?incluir_inactivos=invalido", manager.token)).status).toBe(400);
  });
  it.each(["mesas", "recursos-actividad", "amenidades", "terapeutas", "servicios-spa", "salones", "reservas-mesa", "reservas-actividad", "reservas-amenidad", "citas-spa", "reservas-evento"])("%s filtra en servidor y rechaza lectura, edición y filtros de otra sede", async url => {
    const { manager, records, foreign } = await commercialFixture(); const record = records[url];
    const list = await api("get", `/${url}`, manager.token); expect(list.status).toBe(200);
    expect(list.body.data.map((row: any) => row.id)).toContain(record.own);
    expect(list.body.data.map((row: any) => row.id)).not.toContain(record.other);
    expect((await api("get", `/${url}/${record.own}`, manager.token)).status).toBe(200);
    expect((await api("get", `/${url}/${record.other}`, manager.token)).status).toBe(403);
    expect((await api("get", `/${url}?sucursal_id=${foreign.id}`, manager.token)).status).toBe(403);
    const suffix = record.status ? "/estado" : "";
    const update = await api("patch", `/${url}/${record.own}${suffix}`, manager.token, record.patch);
    expect(update.status, JSON.stringify(update.body)).toBe(200);
    expect((await api("patch", `/${url}/${record.other}${suffix}`, manager.token, record.patch)).status).toBe(403);
  });

  it("respeta sedes adicionales y evita asignarse permisos, usuarios o territorios", async () => {
    const { manager, a, foreign, employee, extra, records } = await commercialFixture();
    expect((await api("get", `/mesas/${extra.id}`, manager.token)).status).toBe(200);
    expect((await api("post", "/amenidades", manager.token, { sucursal_id: foreign.id, nombre: "Denegada QA", aforo_maximo: 4, reservable: true })).status).toBe(403);
    const created = await api("post", "/amenidades", manager.token, { sucursal_id: a.id, nombre: "Autorizada QA", aforo_maximo: 4, reservable: true });
    expect(created.status).toBe(201); owned.push(await db.Amenidad.findByPk(created.body.data.id));
    // Amenities do not support moving branches: the existing strict schema rejects the field.
    expect((await api("patch", `/amenidades/${created.body.data.id}`, manager.token, { sucursal_id: foreign.id })).status).toBe(400);
    // Halls do support changing site, so authorization must reject a foreign target.
    expect((await api("patch", `/salones/${records.salones.own}`, manager.token, { sucursal_id: foreign.id })).status).toBe(403);
    expect((await api("patch", `/empleados/${employee.id}`, manager.token, { area: "Gerencia actualizada" })).status).toBe(200);
    expect((await api("patch", `/empleados/${employee.id}`, manager.token, { area: "QA", sedes_adicionales: [foreign.id] })).status).toBe(400);
    for (const path of ["/usuarios", "/facturas", "/pagos"]) expect((await api("get", path, manager.token)).status).toBe(403);
    expect((await api("patch", "/configuraciones/iva", manager.token, {})).status).toBe(403);
    expect((await api("post", "/usuarios", manager.token, { rol: "admin" })).status).toBe(403);
    for (const formato of ["json", "pdf", "xlsx"]) expect((await api("get", `/reportes/reservas-habitaciones?desde=2042-01-01&hasta=2042-01-02&formato=${formato}`, manager.token)).status).toBe(403);
    expect((await db.EmpleadoSede.count({ where: { empleado_id: employee.id, sucursal_id: foreign.id } }))).toBe(0);
  });
});
