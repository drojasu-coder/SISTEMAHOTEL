import {
  describe,
  expect,
  it,
} from "vitest";

import request from "supertest";

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { TEST_PASSWORD } from "../fixtures/users";
import { createAuthenticatedUser } from "../helpers/auth";
import { assertTestDatabase } from "../helpers/db";

const db = require("../../src/models");
const { Factura, FacturaItem } = db;

const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

const registerClient = async (nombre: string, email: string) => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      nombre,
      email,
      password: TEST_PASSWORD,
      telefono: "55550320",
    });

  expect(response.status).toBe(201);
  expect(response.body.data.rol).toBe(ROLES.CLIENTE);

  return response.body.data as {
    id: number;
    rol: string;
    email: string;
  };
};

const login = async (email: string) => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({
      email,
      password: TEST_PASSWORD,
    });

  expect(response.status).toBe(200);

  return {
    token: response.body.data.accessToken as string,
    usuario: response.body.data.usuario as {
      id: number;
      rol: string;
    },
  };
};

const facturaSnapshot = (factura: any) => ({
  id: Number(factura.id),
  usuario_id: Number(factura.usuario_id),
  nit: factura.nit,
  nombre_fiscal: factura.nombre_fiscal,
  direccion_fiscal: factura.direccion_fiscal,
  subtotal: String(factura.subtotal),
  iva: String(factura.iva),
  porcentaje_iva: String(factura.porcentaje_iva),
  total: String(factura.total),
  estado: factura.estado,
  fecha_emision: factura.fecha_emision?.toISOString() ?? null,
  createdAt: factura.createdAt.toISOString(),
  updatedAt: factura.updatedAt.toISOString(),
});

const itemSnapshot = (item: any) => ({
  id: Number(item.id),
  factura_id: Number(item.factura_id),
  descripcion: item.descripcion,
  cantidad: Number(item.cantidad),
  precio_unitario: String(item.precio_unitario),
  subtotal: String(item.subtotal),
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});

describe("Autorización por propietario de facturas", () => {
  it("QA-AUTH-SEC-CANDIDATE-032: cliente no consulta facturas ni ítems fiscales de otro usuario", async () => {
    expect(await assertTestDatabase()).toBe("hotel_test_db");

    const clientA = await registerClient(
      "Cliente A Factura QA 032",
      "qa-auth-factura-a-032@hotel.test"
    );
    const clientB = await registerClient(
      "Cliente B Factura QA 032",
      "qa-auth-factura-b-032@hotel.test"
    );

    const ownerLogin = await login(clientA.email);
    const foreignLogin = await login(clientB.email);
    const admin = await createAuthenticatedUser({
      rol: ROLES.ADMIN,
      nombre: "Admin Factura QA 032",
      email: "qa-auth-factura-admin-032@hotel.test",
    });

    expect(ownerLogin.usuario.id).toBe(clientA.id);
    expect(foreignLogin.usuario).toMatchObject({
      id: clientB.id,
      rol: ROLES.CLIENTE,
    });

    const createFactura = await request(app)
      .post("/api/facturas")
      .set(authHeader(admin.token))
      .send({
        usuario_id: clientA.id,
        nit: "NIT-QA-A-032",
        nombre_fiscal: "Cliente A Fiscal QA 032",
        direccion_fiscal: "Avenida Privada QA 032, Guatemala",
        subtotal: 0,
        fecha_emision: "2026-10-23T12:00:00.000Z",
      });

    expect(createFactura.status).toBe(201);
    const facturaAId = Number(createFactura.body.data.id);

    const createItem = await request(app)
      .post("/api/factura-items")
      .set(authHeader(admin.token))
      .send({
        factura_id: facturaAId,
        descripcion: "Servicio privado QA AUTH 032",
        cantidad: 2,
        precio_unitario: 62.5,
      });

    expect(createItem.status).toBe(201);
    const itemAId = Number(createItem.body.data.id);

    const facturaBefore = await Factura.findByPk(facturaAId);
    const itemBefore = await FacturaItem.findByPk(itemAId);
    expect(facturaBefore).not.toBeNull();
    expect(itemBefore).not.toBeNull();

    const persistedFacturaBefore = facturaSnapshot(facturaBefore);
    const persistedItemBefore = itemSnapshot(itemBefore);

    expect(persistedFacturaBefore).toMatchObject({
      id: facturaAId,
      usuario_id: clientA.id,
      nit: "NIT-QA-A-032",
      nombre_fiscal: "Cliente A Fiscal QA 032",
      direccion_fiscal: "Avenida Privada QA 032, Guatemala",
      subtotal: "125.00",
      iva: "15.00",
      total: "140.00",
      estado: "pendiente",
    });
    expect(persistedItemBefore).toMatchObject({
      id: itemAId,
      factura_id: facturaAId,
      descripcion: "Servicio privado QA AUTH 032",
      cantidad: 2,
      precio_unitario: "62.50",
      subtotal: "125.00",
    });

    const bListFacturas = await request(app)
      .get("/api/facturas")
      .set(authHeader(foreignLogin.token));
    const bGetFactura = await request(app)
      .get(`/api/facturas/${facturaAId}`)
      .set(authHeader(foreignLogin.token));
    const bListItems = await request(app)
      .get("/api/factura-items")
      .set(authHeader(foreignLogin.token));
    const bGetItem = await request(app)
      .get(`/api/factura-items/${itemAId}`)
      .set(authHeader(foreignLogin.token));

    const ownerGetFactura = await request(app)
      .get(`/api/facturas/${facturaAId}`)
      .set(authHeader(ownerLogin.token));
    const ownerGetItem = await request(app)
      .get(`/api/factura-items/${itemAId}`)
      .set(authHeader(ownerLogin.token));
    const adminGetFactura = await request(app)
      .get(`/api/facturas/${facturaAId}`)
      .set(authHeader(admin.token));
    const adminGetItem = await request(app)
      .get(`/api/factura-items/${itemAId}`)
      .set(authHeader(admin.token));

    const foreignFacturaInList =
      bListFacturas.status === 200 &&
      Array.isArray(bListFacturas.body.data) &&
      bListFacturas.body.data.some(
        (factura: any) => Number(factura.id) === facturaAId
      );
    const foreignFacturaBodyReturned =
      bGetFactura.status === 200 &&
      Number(bGetFactura.body.data?.id) === facturaAId &&
      Number(bGetFactura.body.data?.usuario_id) === clientA.id;
    const foreignItemInList =
      bListItems.status === 200 &&
      Array.isArray(bListItems.body.data) &&
      bListItems.body.data.some(
        (item: any) => Number(item.id) === itemAId
      );
    const foreignItemBodyReturned =
      bGetItem.status === 200 &&
      Number(bGetItem.body.data?.id) === itemAId &&
      Number(bGetItem.body.data?.factura_id) === facturaAId;
    const fiscalDataExposed =
      foreignFacturaInList ||
      (foreignFacturaBodyReturned &&
        bGetFactura.body.data.nit === "NIT-QA-A-032" &&
        bGetFactura.body.data.nombre_fiscal === "Cliente A Fiscal QA 032" &&
        bGetFactura.body.data.direccion_fiscal ===
          "Avenida Privada QA 032, Guatemala");

    const facturaAfter = await Factura.findByPk(facturaAId);
    const itemAfter = await FacturaItem.findByPk(itemAId);
    const persistedFacturaAfter = facturaSnapshot(facturaAfter);
    const persistedItemAfter = itemSnapshot(itemAfter);
    const facturaCount = await Factura.count();
    const itemCount = await FacturaItem.count();
    const databaseModifiedByReads =
      JSON.stringify(persistedFacturaAfter) !==
        JSON.stringify(persistedFacturaBefore) ||
      JSON.stringify(persistedItemAfter) !==
        JSON.stringify(persistedItemBefore) ||
      facturaCount !== 1 ||
      itemCount !== 1;

    console.log("[QA-AUTH-SEC-CANDIDATE-032 EVIDENCE]", {
      database: "hotel_test_db",
      clientA: { id: clientA.id, rol: clientA.rol },
      clientB: { id: clientB.id, rol: foreignLogin.usuario.rol },
      facturaA: persistedFacturaAfter,
      facturaItemA: persistedItemAfter,
      bListFacturas: {
        status: bListFacturas.status,
        code: bListFacturas.body?.code ?? null,
        foreignFacturaInList,
        body: bListFacturas.body,
      },
      bGetFacturaA: {
        status: bGetFactura.status,
        code: bGetFactura.body?.code ?? null,
        foreignFacturaBodyReturned,
        body: bGetFactura.body,
      },
      bListFacturaItems: {
        status: bListItems.status,
        code: bListItems.body?.code ?? null,
        foreignItemInList,
        body: bListItems.body,
      },
      bGetFacturaItemA: {
        status: bGetItem.status,
        code: bGetItem.body?.code ?? null,
        foreignItemBodyReturned,
        body: bGetItem.body,
      },
      fiscalDataExposed,
      ownerControl: {
        facturaStatus: ownerGetFactura.status,
        itemStatus: ownerGetItem.status,
      },
      adminControl: {
        facturaStatus: adminGetFactura.status,
        itemStatus: adminGetItem.status,
      },
      databaseModifiedByReads,
      facturaCount,
      itemCount,
    });

    expect.soft(
      [403, 200],
      "La lista de facturas debe denegar al cliente o filtrar por propietario"
    ).toContain(bListFacturas.status);
    expect.soft(
      foreignFacturaInList,
      "La lista del Cliente B no debe contener la factura del Cliente A"
    ).toBe(false);
    expect.soft(
      [403, 404],
      "La consulta directa de una factura ajena debe ocultarla o denegarla"
    ).toContain(bGetFactura.status);
    expect.soft(
      foreignFacturaBodyReturned,
      "La consulta directa no debe devolver la factura ajena"
    ).toBe(false);
    expect.soft(fiscalDataExposed, "No deben exponerse datos fiscales ajenos").toBe(
      false
    );
    expect.soft(
      [403, 200],
      "La lista de ítems debe denegar al cliente o filtrar por factura propia"
    ).toContain(bListItems.status);
    expect.soft(
      foreignItemInList,
      "La lista del Cliente B no debe contener el ítem de la factura del Cliente A"
    ).toBe(false);
    expect.soft(
      [403, 404],
      "La consulta directa de un ítem ajeno debe ocultarlo o denegarla"
    ).toContain(bGetItem.status);
    expect.soft(
      foreignItemBodyReturned,
      "La consulta directa no debe devolver el ítem ajeno"
    ).toBe(false);

    expect.soft(ownerGetFactura.status).toBe(200);
    expect.soft(ownerGetFactura.body.data).toMatchObject({
      id: facturaAId,
      usuario_id: clientA.id,
    });
    expect.soft(ownerGetItem.status).toBe(200);
    expect.soft(ownerGetItem.body.data).toMatchObject({
      id: itemAId,
      factura_id: facturaAId,
    });
    expect.soft(adminGetFactura.status).toBe(200);
    expect.soft(adminGetItem.status).toBe(200);
    expect.soft(databaseModifiedByReads).toBe(false);
    expect.soft(persistedFacturaAfter).toEqual(persistedFacturaBefore);
    expect.soft(persistedItemAfter).toEqual(persistedItemBefore);
  });
});
