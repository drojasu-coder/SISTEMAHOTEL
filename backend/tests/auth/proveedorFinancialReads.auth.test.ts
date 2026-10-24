import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { createAuthenticatedUser } from "../helpers/auth";
import { assertTestDatabase } from "../helpers/db";

const db = require("../../src/models");
const { Proveedor, ProveedorProducto, CuentaPorPagar } = db;

const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

const snapshot = (record: any) =>
  record === null ? null : JSON.parse(JSON.stringify(record.toJSON()));

describe("Autorización de lecturas financieras de proveedores", () => {
  it("QA-AUTH-SEC-CANDIDATE-033: cliente no consulta proveedores, productos de proveedores ni cuentas por pagar", async () => {
    expect(await assertTestDatabase()).toBe("hotel_test_db");

    const client = await createAuthenticatedUser({
      rol: ROLES.CLIENTE,
      email: "qa-auth-client-033@hotel.test",
    });
    const admin = await createAuthenticatedUser({
      rol: ROLES.ADMIN,
      email: "qa-auth-admin-033@hotel.test",
    });

    const proveedor = await Proveedor.create({
      nombre: "Proveedor QA 033",
      nit: "QA033",
      contacto: "Contacto Interno QA 033",
      telefono: "55550333",
      email: "qa033@example.test",
    });
    const proveedorProducto = await ProveedorProducto.create({
      proveedor_id: proveedor.id,
      nombre_producto: "Insumo interno QA 033",
      descripcion: "Relación proveedor-producto QA 033",
    });
    const cuentaPorPagar = await CuentaPorPagar.create({
      proveedor_id: proveedor.id,
      monto: 3300.33,
      fecha_vencimiento: "2026-11-30",
      estado: "pendiente",
      factura_referencia: "CPP-QA-033",
    });

    const before = {
      proveedor: snapshot(await Proveedor.findByPk(proveedor.id)),
      proveedorProducto: snapshot(
        await ProveedorProducto.findByPk(proveedorProducto.id),
      ),
      cuentaPorPagar: snapshot(
        await CuentaPorPagar.findByPk(cuentaPorPagar.id),
      ),
      counts: {
        proveedores: await Proveedor.count(),
        proveedorProductos: await ProveedorProducto.count(),
        cuentasPorPagar: await CuentaPorPagar.count(),
      },
    };

    const clientListProveedores = await request(app)
      .get("/api/proveedores")
      .set(authHeader(client.token));
    const clientGetProveedor = await request(app)
      .get(`/api/proveedores/${proveedor.id}`)
      .set(authHeader(client.token));
    const clientListProveedorProductos = await request(app)
      .get("/api/proveedor-productos")
      .set(authHeader(client.token));
    const clientGetProveedorProducto = await request(app)
      .get(`/api/proveedor-productos/${proveedorProducto.id}`)
      .set(authHeader(client.token));
    const clientListCuentasPorPagar = await request(app)
      .get("/api/cuentas-por-pagar")
      .set(authHeader(client.token));
    const clientGetCuentaPorPagar = await request(app)
      .get(`/api/cuentas-por-pagar/${cuentaPorPagar.id}`)
      .set(authHeader(client.token));

    const adminGetProveedor = await request(app)
      .get(`/api/proveedores/${proveedor.id}`)
      .set(authHeader(admin.token));
    const adminGetCuentaPorPagar = await request(app)
      .get(`/api/cuentas-por-pagar/${cuentaPorPagar.id}`)
      .set(authHeader(admin.token));

    const proveedorFromList = Array.isArray(clientListProveedores.body?.data)
      ? clientListProveedores.body.data.find(
          (item: any) => Number(item.id) === Number(proveedor.id),
        )
      : undefined;
    const proveedorFromGet =
      Number(clientGetProveedor.body?.data?.id) === Number(proveedor.id)
        ? clientGetProveedor.body.data
        : undefined;
    const productoFromList = Array.isArray(
      clientListProveedorProductos.body?.data,
    )
      ? clientListProveedorProductos.body.data.find(
          (item: any) => Number(item.id) === Number(proveedorProducto.id),
        )
      : undefined;
    const productoFromGet =
      Number(clientGetProveedorProducto.body?.data?.id) ===
      Number(proveedorProducto.id)
        ? clientGetProveedorProducto.body.data
        : undefined;
    const cuentaFromList = Array.isArray(clientListCuentasPorPagar.body?.data)
      ? clientListCuentasPorPagar.body.data.find(
          (item: any) => Number(item.id) === Number(cuentaPorPagar.id),
        )
      : undefined;
    const cuentaFromGet =
      Number(clientGetCuentaPorPagar.body?.data?.id) ===
      Number(cuentaPorPagar.id)
        ? clientGetCuentaPorPagar.body.data
        : undefined;

    const after = {
      proveedor: snapshot(await Proveedor.findByPk(proveedor.id)),
      proveedorProducto: snapshot(
        await ProveedorProducto.findByPk(proveedorProducto.id),
      ),
      cuentaPorPagar: snapshot(
        await CuentaPorPagar.findByPk(cuentaPorPagar.id),
      ),
      counts: {
        proveedores: await Proveedor.count(),
        proveedorProductos: await ProveedorProducto.count(),
        cuentasPorPagar: await CuentaPorPagar.count(),
      },
    };
    const databaseModifiedByReads = JSON.stringify(after) !== JSON.stringify(before);

    console.log("[QA-AUTH-SEC-CANDIDATE-033 EVIDENCE]", JSON.stringify({
      database: "hotel_test_db",
      client: { id: Number(client.usuario.id), rol: client.usuario.rol },
      admin: { id: Number(admin.usuario.id), rol: admin.usuario.rol },
      fixtureIds: {
        proveedor: Number(proveedor.id),
        proveedorProducto: Number(proveedorProducto.id),
        cuentaPorPagar: Number(cuentaPorPagar.id),
      },
      clientResponses: {
        listProveedores: {
          status: clientListProveedores.status,
          code: clientListProveedores.body?.code ?? null,
          data: proveedorFromList
            ? {
                nombre: proveedorFromList.nombre,
                nit: proveedorFromList.nit,
                contacto: proveedorFromList.contacto,
                telefono: proveedorFromList.telefono,
                email: proveedorFromList.email,
              }
            : null,
        },
        getProveedor: {
          status: clientGetProveedor.status,
          code: clientGetProveedor.body?.code ?? null,
          data: proveedorFromGet
            ? {
                nombre: proveedorFromGet.nombre,
                nit: proveedorFromGet.nit,
                contacto: proveedorFromGet.contacto,
                telefono: proveedorFromGet.telefono,
                email: proveedorFromGet.email,
              }
            : null,
        },
        listProveedorProductos: {
          status: clientListProveedorProductos.status,
          code: clientListProveedorProductos.body?.code ?? null,
          data: productoFromList
            ? {
                id: Number(productoFromList.id),
                proveedor_id: Number(productoFromList.proveedor_id),
                nombre_producto: productoFromList.nombre_producto,
                descripcion: productoFromList.descripcion,
              }
            : null,
        },
        getProveedorProducto: {
          status: clientGetProveedorProducto.status,
          code: clientGetProveedorProducto.body?.code ?? null,
          data: productoFromGet
            ? {
                id: Number(productoFromGet.id),
                proveedor_id: Number(productoFromGet.proveedor_id),
                nombre_producto: productoFromGet.nombre_producto,
                descripcion: productoFromGet.descripcion,
              }
            : null,
        },
        listCuentasPorPagar: {
          status: clientListCuentasPorPagar.status,
          code: clientListCuentasPorPagar.body?.code ?? null,
          data: cuentaFromList
            ? {
                id: Number(cuentaFromList.id),
                proveedor_id: Number(cuentaFromList.proveedor_id),
                monto: cuentaFromList.monto,
                estado: cuentaFromList.estado,
                fecha_vencimiento: cuentaFromList.fecha_vencimiento,
              }
            : null,
        },
        getCuentaPorPagar: {
          status: clientGetCuentaPorPagar.status,
          code: clientGetCuentaPorPagar.body?.code ?? null,
          data: cuentaFromGet
            ? {
                id: Number(cuentaFromGet.id),
                proveedor_id: Number(cuentaFromGet.proveedor_id),
                monto: cuentaFromGet.monto,
                estado: cuentaFromGet.estado,
                fecha_vencimiento: cuentaFromGet.fecha_vencimiento,
              }
            : null,
        },
      },
      adminControl: {
        proveedorStatus: adminGetProveedor.status,
        cuentaPorPagarStatus: adminGetCuentaPorPagar.status,
      },
      databaseModifiedByReads,
      countsBefore: before.counts,
      countsAfter: after.counts,
    }, null, 2));

    expect.soft(clientListProveedores.status, "cliente: lista de proveedores").toBe(403);
    expect.soft(clientGetProveedor.status, "cliente: proveedor por ID").toBe(403);
    expect
      .soft(clientListProveedorProductos.status, "cliente: lista proveedor-productos")
      .toBe(403);
    expect
      .soft(clientGetProveedorProducto.status, "cliente: proveedor-producto por ID")
      .toBe(403);
    expect
      .soft(clientListCuentasPorPagar.status, "cliente: lista cuentas por pagar")
      .toBe(403);
    expect
      .soft(clientGetCuentaPorPagar.status, "cliente: cuenta por pagar por ID")
      .toBe(403);

    expect.soft(proveedorFromList, "la lista no expone el proveedor interno").toBeUndefined();
    expect.soft(proveedorFromGet, "el GET no expone el proveedor interno").toBeUndefined();
    expect.soft(productoFromList, "la lista no expone la relación interna").toBeUndefined();
    expect.soft(productoFromGet, "el GET no expone la relación interna").toBeUndefined();
    expect.soft(cuentaFromList, "la lista no expone la cuenta interna").toBeUndefined();
    expect.soft(cuentaFromGet, "el GET no expone la cuenta interna").toBeUndefined();

    expect.soft(adminGetProveedor.status, "control admin proveedor").toBe(200);
    expect.soft(adminGetProveedor.body?.data?.id).toBe(proveedor.id);
    expect.soft(adminGetCuentaPorPagar.status, "control admin cuenta por pagar").toBe(200);
    expect.soft(adminGetCuentaPorPagar.body?.data?.id).toBe(cuentaPorPagar.id);
    expect.soft(databaseModifiedByReads, "los GET no deben modificar PostgreSQL").toBe(false);
    expect.soft(after).toEqual(before);
  });
});
