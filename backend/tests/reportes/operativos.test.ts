import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import ExcelJS from "exceljs";
import { IncomingMessage } from "node:http";
import { mkdirSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import app from "../../src/app";
import { createAuthenticatedUser } from "../helpers/auth";
import { createSucursal } from "../fixtures/hotel";
import { getOperationalReport } from "../../src/modules/reportes/reportes.operativos";
import { OPERATIONAL_REPORTS, OperationalReport } from "../../src/modules/reportes/reportes.types";

const db = require("../../src/models");
const period = { desde: "2101-05-10", hasta: "2101-05-12" };
const owned: any[] = [];
const keep = async (promise: Promise<any>) => { const row = await promise; owned.push(row); return row; };
afterEach(async () => { for (const row of owned.splice(0).reverse()) await row.destroy(); });
const user = async (rol: "admin" | "cliente" | "recepcionista" | "gerente_restaurante" = "admin") => {
  const value = await createAuthenticatedUser({ rol, email: `reportes-${randomUUID()}@hotel.test` }); owned.push(value.usuario); return value;
};
const binary = (res: IncomingMessage, done: (error: Error | null, body: Buffer) => void) => {
  const chunks: Buffer[] = []; res.on("data", chunk => chunks.push(Buffer.from(chunk))); res.on("end", () => done(null, Buffer.concat(chunks)));
};
const get = (kind: string, token?: string, filters: Record<string, unknown> = {}) => {
  const call = request(app).get(`/api/reportes/${kind}`).query({ ...period, ...filters });
  return token ? call.auth(token, { type: "bearer" }) : call;
};
async function fixture() {
  const admin = await user();
  const sites = await Promise.all(Array.from({ length: 4 }, () => keep(createSucursal())));
  const mesa = await keep(db.Mesa.create({ sucursal_id: sites[0].id, zona: "Jardín QA", capacidad: 8 }));
  const mesa2 = await keep(db.Mesa.create({ sucursal_id: sites[1].id, zona: "Terraza QA", capacidad: 4 }));
  const restaurant = [];
  for (const [id, fecha, estado, comensales] of [[mesa.id, period.desde, "confirmada", 3], [mesa.id, period.hasta, "cancelada", 2], [mesa2.id, period.hasta, "confirmada", 4], [mesa.id, "2101-05-13", "confirmada", 7]]) {
    restaurant.push(await keep(db.ReservaMesa.create({ usuario_id: admin.usuario.id, mesa_id: id, fecha, hora: "12:00", numero_comensales: comensales, estado })));
  }
  const experience = await keep(db.RecursoActividad.create({ sucursal_id: sites[0].id, nombre: "Sendero QA", tipo: "senderismo", modalidad: "experiencia", duracion_minutos: 120, cupo_maximo: 10, precio_persona: 500 }));
  const rental = await keep(db.RecursoActividad.create({ sucursal_id: sites[0].id, nombre: "Equipo QA", tipo: "bicicleta", modalidad: "por_hora", precio_hora: 100 }));
  for (const [resource, count, estado] of [[experience.id, 3, "confirmada"], [experience.id, 2, "cancelada"], [rental.id, 9, "completada"]]) {
    await keep(db.ReservaActividad.create({ usuario_id: admin.usuario.id, recurso_id: resource, fecha: period.desde, hora_inicio: "10:00", hora_fin: "12:00", numero_participantes: count, estado, total: 42.5 }));
  }
  const therapist = await keep(db.Terapeuta.create({ nombre: "Terapeuta QA", sucursal_id: sites[1].id }));
  const service = await keep(db.ServicioBienestar.create({ nombre: "Servicio QA", precio: 999.99, duracion_minutos: 60, sucursal_id: sites[0].id }));
  const general = await keep(db.ServicioBienestar.create({ nombre: "General QA", precio: 888.88, duracion_minutos: 60 }));
  for (const [serviceId, therapistId] of [[service.id, null], [general.id, therapist.id], [general.id, null]]) {
    await keep(db.CitaBienestar.create({ usuario_id: admin.usuario.id, servicio_bienestar_id: serviceId, terapeuta_id: therapistId, fecha: period.hasta, hora_inicio: "23:30", hora_fin: "00:30", estado: "confirmada" }));
  }
  const salon = await keep(db.Salon.create({ sucursal_id: sites[0].id, nombre: "Salón QA", capacidad_maxima: 100, tarifa_base: 99999 }));
  const salon2 = await keep(db.Salon.create({ sucursal_id: sites[1].id, nombre: "Salón Norte QA", capacidad_maxima: 100, tarifa_base: 99999 }));
  const events = [];
  for (const [hall, total, estado, guests] of [[salon.id, "1200.50", "cotizacion", 30], [salon.id, "900.00", "confirmada", 20], [salon.id, "100.25", "cancelada", 10], [salon2.id, "200.00", "cotizacion", 5]]) {
    events.push(await keep(db.ReservaEvento.create({ usuario_id: admin.usuario.id, salon_id: hall, tipo_evento: "Reunión QA", fecha: period.desde, hora_inicio: "09:00", hora_fin: "11:00", numero_invitados: guests, estado, total, anticipo: 0 })));
  }
  // Multiple items must never multiply the quotation total.
  for (const price of [50, 100]) {
    const item = await keep(db.ServicioEvento.create({ nombre: "Adicional QA", precio: price }));
    await keep(db.ReservaEventoServicio.create({ reserva_evento_id: events[0].id, servicio_evento_id: item.id, cantidad: 1, subtotal: price }));
  }
  return { admin, sites, restaurant, events };
}

describe("Reportes operativos: HTTP y PostgreSQL reales", () => {
  it("conserva el contrato de habitaciones, sus importes y ambas exportaciones", async () => {
    const admin = await user(); const site = await keep(createSucursal());
    const type = await keep(db.TipoHabitacion.create({ nombre: `Reportes ${randomUUID()}`, capacidad_maxima: 2, tarifa_noche: 400.25 }));
    const room = await keep(db.Habitacion.create({ sucursal_id: site.id, tipo_habitacion_id: type.id, numero: "QA-REPORT", estado: "disponible" }));
    await keep(db.ReservaHabitacion.create({ usuario_id: admin.usuario.id, habitacion_id: room.id, fecha_entrada: period.desde, fecha_salida: period.hasta, numero_huespedes: 2, total: 800.5, estado: "confirmada" }));
    const filters = { sucursal_id: site.id, estado: "confirmada" };
    const preview = (await get("reservas-habitaciones", admin.token, filters)).body.data;
    expect(preview.resumen).toEqual({ reservas: 1, huespedes: 2, noches_periodo: 2, importe_reservado: 800.5, canceladas: 0, importe_cancelado: 0 });
    const pdf = await get("reservas-habitaciones", admin.token, { ...filters, formato: "pdf" }).buffer(true).parse(binary);
    expect(pdf.status).toBe(200); expect(pdf.body.subarray(0, 5).toString()).toBe("%PDF-");
    const xlsx = await get("reservas-habitaciones", admin.token, { ...filters, formato: "xlsx" }).buffer(true).parse(binary);
    expect(xlsx.status).toBe(200); const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(xlsx.body);
    expect(workbook.getWorksheet("Resumen")!.getCell("B12").value).toBe(800.5);
  });

  it("exige sesión y administrador general en todos los reportes y formatos", async () => {
    const roles = await Promise.all([user("cliente"), user("recepcionista"), user("gerente_restaurante")]);
    for (const kind of OPERATIONAL_REPORTS) for (const formato of ["json", "pdf", "xlsx"]) {
      expect((await get(kind, undefined, { formato })).status).toBe(401);
      expect((await get(kind, "invalid", { formato })).status).toBe(401);
      for (const role of roles) expect((await get(kind, role.token, { formato })).status).toBe(403);
    }
  });

  it.each(OPERATIONAL_REPORTS)("%s: defensa de rol también en el servicio", async kind => {
    await expect(getOperationalReport(kind, { ...period, formato: "json", pagina: 1, por_pagina: 20 }, { id: 1, rol: "recepcionista" })).rejects.toMatchObject({ statusCode: 403 });
  });

  it("restaurante cuenta reservas, comensales y mesas distintas sin vender ni multiplicar", async () => {
    const { admin, sites, restaurant } = await fixture();
    const response = await get("reservas-restaurante", admin.token, { sucursal_id: sites[0].id });
    expect(response.status).toBe(200);
    expect(response.body.data.resumen).toEqual({ registros: 2, comensales: 5, mesas_distintas: 1, canceladas: 1 });
    expect(response.body.data.registros.map((r: any) => r.referencia)).toEqual(restaurant.slice(0, 2).map(r => `R-${r.id}`));
    expect(response.body.data.columnas.some((c: any) => c.formato === "importe")).toBe(false);
    const confirmed = await get("reservas-restaurante", admin.token, { sucursal_id: sites[0].id, estado: "confirmada" });
    expect(confirmed.body.data.resumen).toMatchObject({ registros: 1, comensales: 3, canceladas: 0 });
  });

  it("actividades separa experiencias, participantes, alquileres y citas sin precios históricos inventados", async () => {
    const { admin, sites } = await fixture();
    const report = (await get("actividades-bienestar", admin.token, { sucursal_id: sites[0].id })).body.data;
    expect(report.resumen).toEqual({ registros: 4, experiencias: 2, participantes: 5, alquileres: 1, citas: 1, sin_sede: 0, canceladas: 1 });
    expect(new Set(report.registros.map((r: any) => r.tipo_servicio))).toEqual(new Set(["experiencia", "alquiler", "bienestar"]));
    expect(report.registros.filter((r: any) => r.tipo_servicio !== "experiencia").every((r: any) => r.participantes === null)).toBe(true);
    expect(report.columnas.some((c: any) => c.formato === "importe")).toBe(false);
    const general = (await get("actividades-bienestar", admin.token, { sucursal_id: sites[1].id })).body.data;
    expect(general.resumen.citas).toBe(1); // General service uses the therapist's recorded site.
    const all = (await get("actividades-bienestar", admin.token)).body.data;
    expect(all.resumen.sin_sede).toBeGreaterThanOrEqual(1);
    expect(all.registros.some((r: any) => r.sucursal_id === null && r.sede === "Sin sede registrada")).toBe(true);
    const done = (await get("actividades-bienestar", admin.token, { sucursal_id: sites[0].id, estado: "completada" })).body.data;
    expect(done.resumen).toMatchObject({ registros: 1, participantes: 0, alquileres: 1, citas: 0 });
  });

  it("eventos suma el total persistido una sola vez y conserva cotizaciones y estados", async () => {
    const { admin, sites } = await fixture();
    const report = (await get("cotizaciones-eventos", admin.token, { sucursal_id: sites[0].id })).body.data;
    expect(report.resumen).toEqual({ registros: 3, invitados: 60, salones_distintos: 1, importe_cotizado: 2200.75, canceladas: 1 });
    expect(report.registros.reduce((sum: number, r: any) => sum + r.importe_cotizado, 0)).toBe(2200.75);
    const quotes = (await get("cotizaciones-eventos", admin.token, { sucursal_id: sites[0].id, estado: "cotizacion" })).body.data;
    expect(quotes.resumen).toMatchObject({ registros: 1, importe_cotizado: 1200.5 });
    expect(quotes.registros[0].estado).toBe("cotizacion");
    expect(quotes.nota).toContain("No son ingresos cobrados");
  });

  it.each(OPERATIONAL_REPORTS)("%s: sedes, fechas inclusivas, paginación, vacío y validación", async kind => {
    const { admin, sites } = await fixture();
    const first = await get(kind, admin.token, { sucursal_id: sites[0].id, por_pagina: 1 });
    const second = await get(kind, admin.token, { sucursal_id: sites[0].id, por_pagina: 1, pagina: 2 });
    expect(first.status).toBe(200);
    expect(first.body.data.registros).toHaveLength(1);
    expect(first.body.data.registros[0].sucursal_id).toBe(sites[0].id);
    expect(second.body.data.registros[0].referencia).not.toBe(first.body.data.registros[0].referencia);
    expect(second.body.data.resumen).toEqual(first.body.data.resumen);
    for (const site of sites.slice(2)) {
      const empty = (await get(kind, admin.token, { sucursal_id: site.id })).body.data;
      expect(empty.registros).toEqual([]); expect(Object.values(empty.resumen).every(v => v === 0)).toBe(true);
    }
    const empty = (await get(kind, admin.token, { sucursal_id: sites[0].id, desde: "2101-06-01", hasta: "2101-06-01" })).body.data;
    expect(empty.registros).toEqual([]);
    for (const extra of [{ desde: "2101-02-30" }, { hasta: "2100-01-01" }, { hasta: "2103-01-01" }, { sucursal_id: -1 }, { estado: "invalido" }, { por_pagina: 101 }, { pagina: "1.5" }, { usuario_id: 1 }, { formato: "csv" }]) expect((await get(kind, admin.token, extra)).status).toBe(400);
    expect((await get(kind, admin.token, { sucursal_id: 2147483647 })).status).toBe(404);
  });

  it.each(OPERATIONAL_REPORTS)("%s: PDF y XLSX corresponden al resumen y a todos los registros filtrados", async kind => {
    const { admin, sites } = await fixture();
    const filters = { sucursal_id: sites[0].id, estado: kind === "cotizaciones-eventos" ? "cotizacion" : "confirmada", por_pagina: 1 };
    const preview: OperationalReport = (await get(kind, admin.token, filters)).body.data;
    const before = await Promise.all([db.ReservaMesa.count(), db.ReservaActividad.count(), db.CitaBienestar.count(), db.ReservaEvento.count(), db.Pago.count()]);
    const pdf = await get(kind, admin.token, { ...filters, formato: "pdf" }).buffer(true).parse(binary);
    const xlsx = await get(kind, admin.token, { ...filters, formato: "xlsx" }).buffer(true).parse(binary);
    expect(pdf.status).toBe(200); expect(xlsx.status).toBe(200);
    expect(pdf.headers["cache-control"]).toBe("private, no-store");
    expect(pdf.headers["content-disposition"]).toContain(kind);
    expect(pdf.body.subarray(0, 5).toString()).toBe("%PDF-"); expect(pdf.body.toString("latin1").trimEnd()).toMatch(/%%EOF$/);
    expect(xlsx.body.subarray(0, 2).toString()).toBe("PK");
    const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(xlsx.body);
    const summary = workbook.getWorksheet("Resumen")!; const detail = workbook.getWorksheet("Detalle")!;
    expect(summary.getCell("B4").value).toBe(preview.sede); expect(summary.getCell("B7").value).toBe(filters.estado);
    preview.metricas.forEach((metric, i) => expect(summary.getCell(`B${9 + i}`).value).toBe(preview.resumen[metric.clave]));
    expect(detail.actualRowCount).toBe(preview.resumen.registros + 1); // No second totals row to accidentally sum.
    preview.columnas.forEach((column, i) => expect(detail.getRow(2).getCell(i + 1).value).toEqual(column.formato === "fecha" ? new Date(`${preview.registros[0][column.clave]}T00:00:00.000Z`) : preview.registros[0][column.clave]));
    expect(await Promise.all([db.ReservaMesa.count(), db.ReservaActividad.count(), db.CitaBienestar.count(), db.ReservaEvento.count(), db.Pago.count()])).toEqual(before);
    if (process.env.REPORTES_QA_ARTIFACT_DIR) {
      mkdirSync(process.env.REPORTES_QA_ARTIFACT_DIR, { recursive: true });
      for (const [extension, content] of [["pdf", pdf.body], ["xlsx", xlsx.body], ["json", JSON.stringify(preview, null, 2)]] as const) writeFileSync(`${process.env.REPORTES_QA_ARTIFACT_DIR}/${kind}.${extension}`, content);
    }
    // Empty reports also produce actual downloadable files.
    for (const formato of ["pdf", "xlsx"]) {
      const file = await get(kind, admin.token, { sucursal_id: sites[3].id, formato }).buffer(true).parse(binary);
      expect(file.status).toBe(200); expect(file.body.length).toBeGreaterThan(500);
    }
  });

  it.each(OPERATIONAL_REPORTS)("%s: exporta todas las páginas sin duplicar totales y pagina el PDF", async kind => {
    const { admin, sites, restaurant, events } = await fixture();
    const source = kind === "reservas-restaurante" ? restaurant[0] : kind === "cotizaciones-eventos" ? events[0] : owned.find(row => row.constructor.name === "ReservaActividad");
    const values = { ...source.get({ plain: true }), estado: "cancelada" };
    delete values.id; delete values.createdAt; delete values.updatedAt;
    const rows = await source.constructor.bulkCreate(Array.from({ length: 55 }, () => ({ ...values })));
    owned.push(...rows);
    const filters = { sucursal_id: sites[0].id, estado: "cancelada", por_pagina: 1 };
    const preview: OperationalReport = (await get(kind, admin.token, filters)).body.data;
    expect(preview.registros).toHaveLength(1);
    expect(preview.resumen.registros).toBe(56);
    const pdf = await get(kind, admin.token, { ...filters, formato: "pdf" }).buffer(true).parse(binary);
    expect(pdf.status).toBe(200);
    expect((pdf.body.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length).toBeGreaterThan(1);
    const xlsx = await get(kind, admin.token, { ...filters, formato: "xlsx" }).buffer(true).parse(binary);
    expect(xlsx.status).toBe(200);
    const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(xlsx.body);
    expect(workbook.getWorksheet("Detalle")!.actualRowCount).toBe(57);
    if (process.env.REPORTES_QA_ARTIFACT_DIR) writeFileSync(`${process.env.REPORTES_QA_ARTIFACT_DIR}/${kind}-multipagina.pdf`, pdf.body);
  });
});
