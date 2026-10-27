import { QueryTypes } from "sequelize";
import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { createAuthenticatedUser } from "../helpers/auth";
import { sequelize } from "../helpers/db";

const db = require("../../src/models");
const {
  CitaBienestar,
  ServicioBienestar,
  Terapeuta,
} = db;

type PersistedAppointmentRow = {
  id: number;
  usuario_id: number;
  servicio_bienestar_id: number;
  terapeuta_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  usuario_nombre: string;
  usuario_email: string;
  servicio_nombre: string;
  servicio_duracion_minutos: number;
  servicio_precio: string;
  terapeuta_nombre: string;
  terapeuta_activo: boolean;
};

const createSpaAppointmentFixture = async () => {
  const cliente = await createAuthenticatedUser({
    rol: ROLES.CLIENTE,
    email: "cliente-detalle-spa-004@hotel.test",
  });
  await cliente.usuario.update({
    nombre: "Huesped QA Detalle Spa 004",
  });

  const servicioAlterno = await ServicioBienestar.create({
    nombre: "Servicio Alterno QA Spa 004",
    duracion_minutos: 25,
    precio: "111.11",
  });
  const servicio = await ServicioBienestar.create({
    nombre: "Ritual Jade QA Spa 004",
    duracion_minutos: 75,
    precio: "487.65",
  });

  const terapeutaAlterno = await Terapeuta.create({
    nombre: "Terapeuta Alterno QA Spa 004",
    activo: false,
  });
  const terapeuta = await Terapeuta.create({
    nombre: "Terapeuta Jade QA Spa 004",
    activo: true,
  });

  const cita = await CitaBienestar.create({
    usuario_id: cliente.usuario.id,
    servicio_bienestar_id: servicio.id,
    terapeuta_id: terapeuta.id,
    fecha: "2027-10-26",
    hora_inicio: "11:15:00",
    hora_fin: "12:30:00",
    estado: "confirmada",
  });

  expect(Number(servicioAlterno.id)).not.toBe(Number(servicio.id));
  expect(Number(terapeutaAlterno.id)).not.toBe(Number(terapeuta.id));

  return {
    citaId: Number(cita.id),
  };
};

const readPersistedAppointment = async (citaId: number) => {
  const rows = await sequelize.query<PersistedAppointmentRow>(
    `
      SELECT
        c.id,
        c.usuario_id,
        c.servicio_bienestar_id,
        c.terapeuta_id,
        c.fecha::text AS fecha,
        c.hora_inicio::text AS hora_inicio,
        c.hora_fin::text AS hora_fin,
        c.estado,
        u.nombre AS usuario_nombre,
        u.email AS usuario_email,
        sb.nombre AS servicio_nombre,
        sb.duracion_minutos AS servicio_duracion_minutos,
        sb.precio::text AS servicio_precio,
        t.nombre AS terapeuta_nombre,
        t.activo AS terapeuta_activo
      FROM citas_bienestar c
      INNER JOIN usuarios u
        ON u.id = c.usuario_id
      INNER JOIN servicios_bienestar sb
        ON sb.id = c.servicio_bienestar_id
      INNER JOIN terapeutas t
        ON t.id = c.terapeuta_id
      WHERE c.id = :citaId;
    `,
    {
      replacements: { citaId },
      type: QueryTypes.SELECT,
    }
  );

  expect(rows).toHaveLength(1);
  return rows[0];
};

describe("QA-ADMIN-SPA-CITA-FUNC-004", () => {
  it("QA-ADMIN-SPA-CITA-FUNC-004 A1: detalle admin incluye asociaciones persistidas y la coleccion conserva su proyeccion", async () => {
    const admin = await createAuthenticatedUser({
      rol: ROLES.ADMIN,
      email: "admin-detalle-spa-004@hotel.test",
    });
    const { citaId } = await createSpaAppointmentFixture();
    const persisted = await readPersistedAppointment(citaId);
    const authorization = `Bearer ${admin.token}`;

    const expectedBaseAppointment = {
      id: persisted.id,
      usuario_id: persisted.usuario_id,
      servicio_bienestar_id: persisted.servicio_bienestar_id,
      terapeuta_id: persisted.terapeuta_id,
      fecha: persisted.fecha,
      hora_inicio: persisted.hora_inicio,
      hora_fin: persisted.hora_fin,
      estado: persisted.estado,
    };
    const expectedAssociations = {
      Usuario: {
        nombre: persisted.usuario_nombre,
        email: persisted.usuario_email,
      },
      ServicioBienestar: {
        nombre: persisted.servicio_nombre,
        duracion_minutos: persisted.servicio_duracion_minutos,
        precio: persisted.servicio_precio,
      },
      Terapeuta: {
        nombre: persisted.terapeuta_nombre,
        activo: persisted.terapeuta_activo,
      },
    };

    const collectionResponse = await request(app)
      .get("/api/citas-spa")
      .set("Authorization", authorization);

    expect(collectionResponse.status).toBe(200);
    expect(collectionResponse.body.status).toBe("success");

    const collectionItem = collectionResponse.body.data.find(
      (item: any) => Number(item.id) === persisted.id
    );
    console.log("[QA-ADMIN-SPA-CITA-FUNC-004 A1 COLLECTION]", {
      postgres: persisted,
      actualCollectionItem: collectionItem,
    });
    expect(collectionItem).toBeDefined();
    expect(collectionItem).toMatchObject({
      ...expectedBaseAppointment,
      Usuario: expectedAssociations.Usuario,
      ServicioBienestar: expectedAssociations.ServicioBienestar,
    });
    expect(
      collectionItem.Terapeuta ?? collectionItem.Terapeutum
    ).toMatchObject(expectedAssociations.Terapeuta);
    expect(collectionItem.Usuario).not.toHaveProperty("password_hash");

    const detailResponse = await request(app)
      .get(`/api/citas-spa/${persisted.id}`)
      .set("Authorization", authorization);

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.status).toBe("success");
    expect(detailResponse.body.data).toMatchObject(expectedBaseAppointment);

    console.log("[QA-ADMIN-SPA-CITA-FUNC-004 A1]", {
      postgres: persisted,
      collection: collectionItem,
      expectedDetailAssociations: expectedAssociations,
      actualDetail: detailResponse.body.data,
    });

    expect.soft(detailResponse.body.data.Usuario).toMatchObject(
      expectedAssociations.Usuario
    );
    expect.soft(detailResponse.body.data.ServicioBienestar).toMatchObject(
      expectedAssociations.ServicioBienestar
    );
    expect.soft(detailResponse.body.data.Terapeuta).toMatchObject(
      expectedAssociations.Terapeuta
    );
  });

  it("QA-ADMIN-SPA-CITA-FUNC-004 A2: detalle admin inexistente mantiene 404 y contrato de error", async () => {
    const admin = await createAuthenticatedUser({
      rol: ROLES.ADMIN,
      email: "admin-spa-404-004@hotel.test",
    });

    const response = await request(app)
      .get("/api/citas-spa/999999")
      .set("Authorization", `Bearer ${admin.token}`);

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      statusCode: 404,
      code: "APPOINTMENT_NOT_FOUND",
      message: "La cita de bienestar no existe",
    });
    expect(response.body).not.toHaveProperty("data");
  });

  it("QA-ADMIN-SPA-CITA-FUNC-004 A3: cliente no accede al detalle global ni recibe asociaciones sensibles", async () => {
    const { citaId } = await createSpaAppointmentFixture();
    const clienteNoAdmin = await createAuthenticatedUser({
      rol: ROLES.CLIENTE,
      email: "cliente-no-admin-spa-004@hotel.test",
    });

    const response = await request(app)
      .get(`/api/citas-spa/${citaId}`)
      .set("Authorization", `Bearer ${clienteNoAdmin.token}`);

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      success: false,
      statusCode: 403,
      code: "INSUFFICIENT_PERMISSIONS",
      message: "No tiene permisos para realizar esta operación",
    });
    expect(response.body).not.toHaveProperty("data");
    expect(response.body).not.toHaveProperty("Usuario");
    expect(response.body).not.toHaveProperty("ServicioBienestar");
    expect(response.body).not.toHaveProperty("Terapeuta");
  });
});
