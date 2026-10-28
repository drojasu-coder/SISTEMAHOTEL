import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { createAuthenticatedUser } from "../helpers/auth";
import { ROLES } from "../../src/constants/roles";

const { Factura, FacturaItem } = require("../../src/models");
async function setup(included = true) {
  const admin = await createAuthenticatedUser({ rol: ROLES.ADMIN });
  const customer = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
  const response = await request(app).post("/api/facturas").set("Authorization", `Bearer ${admin.token}`).send({ usuario_id: customer.usuario.id, nit: "CF", nombre_fiscal: "Verificación fiscal", subtotal: 0, precios_incluyen_impuestos: included });
  expect(response.status).toBe(201);
  const invoice = response.body.data;
  const add = (price: number, type = "servicio", quantity = 1) => request(app).post("/api/factura-items").set("Authorization", `Bearer ${admin.token}`).send({ factura_id: invoice.id, descripcion: "Concepto de verificación", cantidad: quantity, precio_unitario: price, tipo_concepto: type });
  return { admin, customer, invoice, add };
}

describe("Facturas con tarifas finales: IVA e INGUAT incluidos", () => {
  it("no añade impuestos al precio final del hospedaje", async () => {
    const { invoice, add } = await setup();
    expect((await add(122, "hospedaje")).status).toBe(201);
    const stored = await Factura.findByPk(invoice.id);
    expect(Number(stored.subtotal)).toBe(100); expect(Number(stored.iva)).toBe(12);
    expect(Number(stored.inguat)).toBe(10); expect(Number(stored.total)).toBe(122);
  });

  it("una factura mixta no grava otros servicios con INGUAT", async () => {
    const { invoice, add } = await setup();
    await add(122, "hospedaje", 2); await add(112, "servicio");
    const stored = await Factura.findByPk(invoice.id);
    expect(Number(stored.subtotal)).toBe(300); expect(Number(stored.iva)).toBe(36);
    expect(Number(stored.inguat)).toBe(20); expect(Number(stored.total)).toBe(356);
  });

  it("conserva el contrato de facturas anteriores con precios base", async () => {
    const { invoice, add } = await setup(false);
    await add(100);
    const stored = await Factura.findByPk(invoice.id);
    expect(Number(stored.subtotal)).toBe(100); expect(Number(stored.iva)).toBe(12);
    expect(Number(stored.inguat)).toBe(0); expect(Number(stored.total)).toBe(112);
  });

  it("rechaza importes derivados del cliente y protege al propietario", async () => {
    const { admin, customer, invoice, add } = await setup();
    expect((await add(122, "hospedaje")).status).toBe(201);
    const override = await request(app).patch(`/api/facturas/${invoice.id}`).set("Authorization", `Bearer ${admin.token}`).send({ subtotal: 1 });
    expect(override.status).toBe(422);
    const forbidden = await request(app).post('/api/factura-items').set("Authorization", `Bearer ${customer.token}`).send({ factura_id: invoice.id, descripcion: "No autorizado", cantidad: 1, precio_unitario: 1 });
    expect(forbidden.status).toBe(403);
    expect(Number((await Factura.findByPk(invoice.id)).total)).toBe(122);
  });

  it("20 altas simultáneas no pierden conceptos ni impuestos persistidos", async () => {
    const { invoice, add } = await setup();
    const responses = await Promise.all(Array.from({ length: 20 }, (_, i) => add(i % 2 ? 112 : 122, i % 2 ? "servicio" : "hospedaje")));
    expect(responses.every(r => r.status === 201)).toBe(true);
    expect(await FacturaItem.count({ where: { factura_id: invoice.id } })).toBe(20);
    const stored = await Factura.findByPk(invoice.id);
    expect(Number(stored.subtotal)).toBe(2000); expect(Number(stored.iva)).toBe(240);
    expect(Number(stored.inguat)).toBe(100); expect(Number(stored.total)).toBe(2340);
  });

  it("actualiza y retira conceptos manteniendo el total final y las tasas históricas", async () => {
    const { admin, invoice, add } = await setup();
    const created = await add(1250, "hospedaje");
    const id = created.body.data.id;
    const update = await request(app).patch(`/api/factura-items/${id}`).set("Authorization", `Bearer ${admin.token}`).send({ cantidad: 2 });
    expect(update.status).toBe(200);
    const stored = await Factura.findByPk(invoice.id);
    expect(Number(stored.total)).toBe(2500);
    expect(Math.round((Number(stored.subtotal) + Number(stored.iva) + Number(stored.inguat)) * 100)).toBe(250000);
    expect((await request(app).delete(`/api/factura-items/${id}`).set("Authorization", `Bearer ${admin.token}`)).status).toBe(200);
    await stored.reload(); expect(Number(stored.total)).toBe(0);
  });
});
