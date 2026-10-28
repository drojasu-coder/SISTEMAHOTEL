import { describe, expect, it } from "vitest";
import request from "supertest";
import ExcelJS from "exceljs";
import { IncomingMessage } from "node:http";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import app from "../../src/app";
import { createAuthenticatedUser } from "../helpers/auth";
import { createHotelFixture } from "../fixtures/hotel";

const db = require("../../src/models");
const endpoint = "/api/reportes/reservas-habitaciones";
const filters = { desde: "2027-01-10", hasta: "2027-01-12" };
const binary = (res: IncomingMessage, done: (error: Error | null, body: Buffer) => void) => {
  const chunks: Buffer[] = [];
  res.on("data", chunk => chunks.push(Buffer.from(chunk)));
  res.on("end", () => done(null, Buffer.concat(chunks)));
};

async function fixture() {
  const admin = await createAuthenticatedUser({ rol: "admin" });
  const cliente = await createAuthenticatedUser({ rol: "cliente" });
  const a = await createHotelFixture();
  const b = await createHotelFixture();
  const create = (room: number, entrada: string, salida: string, estado: string, total: string, guests = 2) =>
    db.ReservaHabitacion.create({ usuario_id: cliente.usuario.id, habitacion_id: room,
      fecha_entrada: entrada, fecha_salida: salida, estado, total, numero_huespedes: guests });
  const rows = await Promise.all([
    create(a.habitacion.id, "2027-01-08", "2027-01-12", "confirmada", "1200.50"),
    create(a.habitacion.id, "2027-01-12", "2027-01-16", "cancelada", "900.00", 3),
    create(a.habitacion.id, "2027-01-01", "2027-02-01", "finalizada", "3100.00", 1),
    create(b.habitacion.id, "2027-01-11", "2027-01-12", "pendiente", "100.00", 4),
    create(a.habitacion.id, "2027-01-08", "2027-01-10", "expirada", "999.00"),
    create(a.habitacion.id, "2027-01-13", "2027-01-15", "expirada", "999.00"),
  ]);
  return { admin, cliente, a, b, rows };
}

describe("Reportes: reservas de habitaciones sobre PostgreSQL", () => {
  it("exige sesión y rol admin para JSON, PDF y Excel", async () => {
    const cliente = await createAuthenticatedUser({ rol: "cliente" });
    const recepcion = await createAuthenticatedUser({ rol: "recepcionista" });
    for (const formato of ["json", "pdf", "xlsx"]) {
      expect((await request(app).get(endpoint).query({ ...filters, formato })).status).toBe(401);
      expect((await request(app).get(endpoint).query({ ...filters, formato }).auth("invalid", { type: "bearer" })).status).toBe(401);
      for (const user of [cliente, recepcion]) {
        expect((await request(app).get(endpoint).query({ ...filters, formato }).auth(user.token, { type: "bearer" })).status).toBe(403);
      }
    }
  });

  it("incluye cruces parciales y estancias envolventes, excluye salida al inicio y entrada posterior al final", async () => {
    const { admin, rows } = await fixture();
    const response = await request(app).get(endpoint).query(filters).auth(admin.token, { type: "bearer" });
    expect(response.status).toBe(200);
    const report = response.body.data;
    expect(report.filtros).toEqual({ ...filters, sucursal_id: null, estado: null });
    expect(report.registros.map((r: any) => r.id).sort()).toEqual(rows.slice(0, 4).map((r: any) => r.id).sort());
    expect(report.resumen).toEqual({ reservas: 4, huespedes: 10, noches_periodo: 7,
      importe_reservado: 5300.5, canceladas: 1, importe_cancelado: 900 });
    expect(report.registros.find((r: any) => r.id === rows[0].id)).toMatchObject({ noches_periodo: 2, importe_reservado: 1200.5 });
    expect(report.registros.every((r: any) => !('email' in r) && !('telefono' in r) && !('usuario' in r))).toBe(true);
    expect(await db.ReservaHabitacion.count()).toBe(6);
    expect(await db.Pago.count()).toBe(0);
  });

  it("filtra sede y estado en servidor y pagina sin cambiar los totales", async () => {
    const { admin, a, rows } = await fixture();
    const get = (extra: Record<string, unknown>) => request(app).get(endpoint).query({ ...filters, ...extra }).auth(admin.token, { type: "bearer" });
    const page1 = await get({ sucursal_id: a.sucursal.id, pagina: 1, por_pagina: 1 });
    const page2 = await get({ sucursal_id: a.sucursal.id, pagina: 2, por_pagina: 1 });
    expect(page1.status).toBe(200);
    expect(page1.body.data.resumen.reservas).toBe(3);
    expect(page1.body.data.resumen.importe_reservado).toBe(5200.5);
    expect(page1.body.data.paginacion).toEqual({ pagina: 1, por_pagina: 1, total_paginas: 3 });
    expect(page1.body.data.registros).toHaveLength(1);
    expect(page1.body.data.registros[0].sucursal_id).toBe(a.sucursal.id);
    expect(page2.body.data.registros[0].id).not.toBe(page1.body.data.registros[0].id);
    expect(page2.body.data.resumen).toEqual(page1.body.data.resumen);
    const cancelled = await get({ estado: "cancelada" });
    expect(cancelled.body.data.registros.map((r: any) => r.id)).toEqual([rows[1].id]);
    expect(cancelled.body.data.registros[0]).not.toHaveProperty("fecha_cancelacion");
  });

  it("responde vacío con totales cero y rechaza filtros inválidos de forma controlada", async () => {
    const { admin } = await fixture();
    const get = (query: Record<string, unknown>) => request(app).get(endpoint).query(query).auth(admin.token, { type: "bearer" });
    const empty = await get({ desde: "2028-01-01", hasta: "2028-01-01" });
    expect(empty.status).toBe(200);
    expect(empty.body.data.registros).toEqual([]);
    expect(empty.body.data.resumen).toEqual({ reservas: 0, huespedes: 0, noches_periodo: 0, importe_reservado: 0, canceladas: 0, importe_cancelado: 0 });
    for (const query of [
      {}, { desde: "0000-01-01", hasta: "0000-01-02" }, { ...filters, desde: "2027-02-30" }, { ...filters, desde: "2027-01-13" },
      { ...filters, hasta: "2029-01-01" }, { ...filters, estado: "activa" },
      { ...filters, sucursal_id: "-1" }, { ...filters, usuario_id: 1 },
      { ...filters, por_pagina: "101" }, { ...filters, pagina: "1.5" },
      { ...filters, formato: "csv" }, { ...filters, desde: [filters.desde, filters.desde] },
    ]) expect((await get(query)).status, JSON.stringify(query)).toBe(400);
    expect((await get({ ...filters, sucursal_id: 2147483647 })).status).toBe(404);
    for (const formato of ['pdf', 'xlsx']) {
      const file = await request(app).get(endpoint).query({ desde: "2028-01-01", hasta: "2028-01-01", formato })
        .auth(admin.token, { type: 'bearer' }).buffer(true).parse(binary);
      expect(file.status).toBe(200);
      expect(file.body.subarray(0, formato === 'pdf' ? 5 : 2).toString()).toBe(formato === 'pdf' ? '%PDF-' : 'PK');
    }
  });

  it("entrega PDF y XLSX reales con los mismos filtros, filas y totales de la vista previa", async () => {
    const { admin, a } = await fixture();
    const applied = { ...filters, sucursal_id: a.sucursal.id, estado: "confirmada" };
    const preview = (await request(app).get(endpoint).query(applied).auth(admin.token, { type: "bearer" })).body.data;
    const pdf = await request(app).get(endpoint).query({ ...applied, formato: "pdf" }).auth(admin.token, { type: "bearer" }).buffer(true).parse(binary);
    expect(pdf.status).toBe(200);
    expect(pdf.headers['content-type']).toContain("application/pdf");
    expect(pdf.headers['content-disposition']).toContain("attachment;");
    expect(pdf.body.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.body.toString('latin1').trimEnd()).toMatch(/%%EOF$/);
    expect((pdf.body.toString('latin1').match(/\/Type \/Page\b/g) ?? []).length).toBe(1);
    const excel = await request(app).get(endpoint).query({ ...applied, formato: "xlsx", por_pagina: 1 }).auth(admin.token, { type: "bearer" }).buffer(true).parse(binary);
    expect(excel.status).toBe(200);
    expect(excel.headers['content-type']).toContain("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    expect(excel.body.subarray(0, 2).toString()).toBe("PK");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(excel.body);
    const detail = workbook.getWorksheet("Reservas")!;
    const row = detail.getRow(2);
    const source = preview.registros[0];
    expect(row.getCell(1).value).toBe(source.id);
    expect(row.getCell(2).value).toBe(source.sede);
    expect(row.getCell(5).value).toEqual(new Date(`${source.fecha_entrada}T00:00:00.000Z`));
    expect(row.getCell(6).value).toEqual(new Date(`${source.fecha_salida}T00:00:00.000Z`));
    expect(row.getCell(9).value).toBe(source.noches_periodo);
    expect(row.getCell(10).value).toBe(source.importe_reservado);
    expect(detail.lastRow!.getCell(5).value).toBeNull();
    expect(detail.lastRow!.getCell(6).value).toBeNull();
    const summary = workbook.getWorksheet("Resumen")!;
    expect(summary.getCell("B9").value).toBe(preview.resumen.reservas);
    expect(summary.getCell("B12").value).toBe(preview.resumen.importe_reservado);
    expect(summary.getCell("B4").value).toBe(preview.sede);
    expect(summary.getCell("B7").value).toBe("confirmada");
    if (process.env.REPORTES_QA_ARTIFACT_DIR) {
      mkdirSync(process.env.REPORTES_QA_ARTIFACT_DIR, { recursive: true });
      writeFileSync(join(process.env.REPORTES_QA_ARTIFACT_DIR, "reservas-habitaciones-qa.pdf"), pdf.body);
      writeFileSync(join(process.env.REPORTES_QA_ARTIFACT_DIR, "reservas-habitaciones-qa.xlsx"), excel.body);
      writeFileSync(join(process.env.REPORTES_QA_ARTIFACT_DIR, "preview-qa.json"), JSON.stringify(preview, null, 2));
    }
  });

  it("exporta todas las filas filtradas aunque la vista esté paginada y pagina el PDF", async () => {
    const { admin, a, cliente } = await fixture();
    await db.ReservaHabitacion.bulkCreate(Array.from({ length: 80 }, () => ({
      usuario_id: cliente.usuario.id, habitacion_id: a.habitacion.id, fecha_entrada: "2027-01-10",
      fecha_salida: "2027-01-12", estado: "cancelada", numero_huespedes: 1, total: "10.25",
    })));
    const query = { ...filters, estado: "cancelada", por_pagina: 1 };
    const preview = (await request(app).get(endpoint).query(query).auth(admin.token, { type: "bearer" })).body.data;
    expect(preview.registros).toHaveLength(1);
    expect(preview.resumen.reservas).toBe(81);
    const xlsx = await request(app).get(endpoint).query({ ...query, formato: "xlsx" }).auth(admin.token, { type: "bearer" }).buffer(true).parse(binary);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(xlsx.body);
    expect(workbook.getWorksheet("Reservas")!.actualRowCount).toBe(83); // header + 81 reservations + total
    const pdf = await request(app).get(endpoint).query({ ...query, formato: "pdf" }).auth(admin.token, { type: "bearer" }).buffer(true).parse(binary);
    expect(pdf.status).toBe(200);
    expect((pdf.body.toString('latin1').match(/\/Type \/Page\b/g) ?? []).length).toBeGreaterThan(1);
    if (process.env.REPORTES_QA_ARTIFACT_DIR) writeFileSync(join(process.env.REPORTES_QA_ARTIFACT_DIR, "reservas-multipagina-qa.pdf"), pdf.body);
  });
});
