import { QueryTypes } from "sequelize";
import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { createTestUser } from "../fixtures/users";
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
  terapeuta_id: number | null;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  usuario_nombre: string;
  usuario_email: string;
  servicio_nombre: string;
  servicio_duracion_minutos: number;
  servicio_precio: string;
  terapeuta_nombre: string | null;
  terapeuta_activo: boolean | null;
};

type AppointmentFixtureOptions = {
  suffix: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado?: string;
  withTherapist?: boolean;
};

const createAppointmentFixture = async ({
  suffix,
  fecha,
  horaInicio,
  horaFin,
  estado = "confirmada",
  withTherapist = true,
}: AppointmentFixtureOptions) => {
  const { usuario } = await createTestUser({
    rol: ROLES.CLIENTE,
    nombre: `Huesped QA Spa 005 ${suffix}`,
    email: `cliente-spa-005-${suffix}@hotel.test`,
  });
  const servicio = await ServicioBienestar.create({
    nombre: `Servicio QA Spa 005 ${suffix}`,
    duracion_minutos: 50,
    precio: "345.67",
  });
  const terapeuta = withTherapist
    ? await Terapeuta.create({
        nombre: `Terapeuta QA Spa 005 ${suffix}`,
        activo: suffix !== "asignada-inactiva",
      })
    : null;
  const cita = await CitaBienestar.create({
    usuario_id: usuario.id,
    servicio_bienestar_id: servicio.id,
    terapeuta_id: terapeuta?.id ?? null,
    fecha,
    hora_inicio: horaInicio,
    hora_fin: horaFin,
    estado,
  });

  return {
    citaId: Number(cita.id),
  };
};

const readPersistedAppointments = async (appointmentIds: number[]) => {
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
      LEFT JOIN terapeutas t
        ON t.id = c.terapeuta_id
      WHERE c.id IN (:appointmentIds)
      ORDER BY c.id ASC;
    `,
    {
      replacements: { appointmentIds },
      type: QueryTypes.SELECT,
    }
  );

  expect(rows).toHaveLength(appointmentIds.length);
  return rows;
};

const expectedBaseAppointment = (row: PersistedAppointmentRow) => ({
  id: row.id,
  usuario_id: row.usuario_id,
  servicio_bienestar_id: row.servicio_bienestar_id,
  terapeuta_id: row.terapeuta_id,
  fecha: row.fecha,
  hora_inicio: row.hora_inicio,
  hora_fin: row.hora_fin,
  estado: row.estado,
});

const expectedAssociations = (row: PersistedAppointmentRow) => ({
  Usuario: {
    nombre: row.usuario_nombre,
    email: row.usuario_email,
  },
  ServicioBienestar: {
    nombre: row.servicio_nombre,
    duracion_minutos: row.servicio_duracion_minutos,
    precio: row.servicio_precio,
  },
  Terapeuta:
    row.terapeuta_id === null
      ? null
      : {
          nombre: row.terapeuta_nombre,
          activo: row.terapeuta_activo,
        },
});

describe("QA-ADMIN-SPA-CITA-FUNC-005", () => {
  it("QA-ADMIN-SPA-CITA-FUNC-005 A1: listado admin normaliza cada terapeuta y coincide con PostgreSQL y detalle", async () => {
    const admin = await createAuthenticatedUser({
      rol: ROLES.ADMIN,
      email: "admin-listado-spa-005-a1@hotel.test",
    });
    const assignedActive = await createAppointmentFixture({
      suffix: "asignada-activa",
      fecha: "2027-11-10",
      horaInicio: "09:00:00",
      horaFin: "09:50:00",
    });
    const assignedInactive = await createAppointmentFixture({
      suffix: "asignada-inactiva",
      fecha: "2027-11-11",
      horaInicio: "15:30:00",
      horaFin: "16:20:00",
      estado: "cancelada",
    });
    const persistedRows = await readPersistedAppointments([
      assignedActive.citaId,
      assignedInactive.citaId,
    ]);

    for (const row of persistedRows) {
      expect(row.terapeuta_id).not.toBeNull();
      expect(row.terapeuta_nombre).toBeTypeOf("string");
      expect(row.terapeuta_activo).toBeTypeOf("boolean");
    }

    const authorization = `Bearer ${admin.token}`;
    const collectionResponse = await request(app)
      .get("/api/citas-spa")
      .set("Authorization", authorization);

    expect(collectionResponse.status).toBe(200);
    expect(collectionResponse.body.status).toBe("success");

    for (const row of persistedRows) {
      const collectionItem = collectionResponse.body.data.find(
        (item: any) => Number(item.id) === row.id
      );
      const associations = expectedAssociations(row);

      expect(collectionItem).toBeDefined();
      expect(collectionItem).toMatchObject(expectedBaseAppointment(row));
      expect(collectionItem.Usuario).toEqual(associations.Usuario);
      expect(collectionItem.ServicioBienestar).toEqual(
        associations.ServicioBienestar
      );
      expect(collectionItem.Usuario).not.toHaveProperty("password_hash");
      expect.soft(collectionItem).toHaveProperty("Terapeuta");
      expect.soft(collectionItem).not.toHaveProperty("Terapeutum");
      expect.soft(collectionItem.Terapeuta).toEqual(associations.Terapeuta);
    }

    const persistedDetail = persistedRows.find(
      (row) => row.id === assignedActive.citaId
    )!;
    const collectionDetail = collectionResponse.body.data.find(
      (item: any) => Number(item.id) === assignedActive.citaId
    );
    const detailResponse = await request(app)
      .get(`/api/citas-spa/${assignedActive.citaId}`)
      .set("Authorization", authorization);

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.status).toBe("success");
    expect(detailResponse.body.data).toMatchObject(
      expectedBaseAppointment(persistedDetail)
    );
    expect(detailResponse.body.data.Usuario).toEqual(collectionDetail.Usuario);
    expect(detailResponse.body.data.ServicioBienestar).toEqual(
      collectionDetail.ServicioBienestar
    );
    expect.soft(detailResponse.body.data.Terapeuta).toEqual(
      collectionDetail.Terapeuta
    );
  });

  it("QA-ADMIN-SPA-CITA-FUNC-005 A2: listado admin conserva fecha DESC y hora_inicio DESC", async () => {
    const admin = await createAuthenticatedUser({
      rol: ROLES.ADMIN,
      email: "admin-listado-spa-005-a2@hotel.test",
    });
    const olderDate = await createAppointmentFixture({
      suffix: "orden-fecha-anterior",
      fecha: "2027-12-14",
      horaInicio: "18:00:00",
      horaFin: "18:50:00",
    });
    const latestDateEarlierTime = await createAppointmentFixture({
      suffix: "orden-hora-temprana",
      fecha: "2027-12-15",
      horaInicio: "08:15:00",
      horaFin: "09:05:00",
    });
    const latestDateLaterTime = await createAppointmentFixture({
      suffix: "orden-hora-tardia",
      fecha: "2027-12-15",
      horaInicio: "17:45:00",
      horaFin: "18:35:00",
    });
    const fixtureIds = [
      olderDate.citaId,
      latestDateEarlierTime.citaId,
      latestDateLaterTime.citaId,
    ];
    const persistedRows = await readPersistedAppointments(fixtureIds);

    expect(
      persistedRows.map(({ id, fecha, hora_inicio }) => ({
        id,
        fecha,
        hora_inicio,
      }))
    ).toEqual([
      {
        id: olderDate.citaId,
        fecha: "2027-12-14",
        hora_inicio: "18:00:00",
      },
      {
        id: latestDateEarlierTime.citaId,
        fecha: "2027-12-15",
        hora_inicio: "08:15:00",
      },
      {
        id: latestDateLaterTime.citaId,
        fecha: "2027-12-15",
        hora_inicio: "17:45:00",
      },
    ]);

    const response = await request(app)
      .get("/api/citas-spa")
      .set("Authorization", `Bearer ${admin.token}`);

    expect(response.status).toBe(200);
    const orderedFixtureItems = response.body.data.filter((item: any) =>
      fixtureIds.includes(Number(item.id))
    );
    expect(
      orderedFixtureItems.map((item: any) => ({
        id: Number(item.id),
        fecha: item.fecha,
        hora_inicio: item.hora_inicio,
      }))
    ).toEqual([
      {
        id: latestDateLaterTime.citaId,
        fecha: "2027-12-15",
        hora_inicio: "17:45:00",
      },
      {
        id: latestDateEarlierTime.citaId,
        fecha: "2027-12-15",
        hora_inicio: "08:15:00",
      },
      {
        id: olderDate.citaId,
        fecha: "2027-12-14",
        hora_inicio: "18:00:00",
      },
    ]);
  });

  it("QA-ADMIN-SPA-CITA-FUNC-005 A3: listado admin serializa Terapeuta null cuando la FK nullable no tiene asignacion", async () => {
    const admin = await createAuthenticatedUser({
      rol: ROLES.ADMIN,
      email: "admin-listado-spa-005-a3@hotel.test",
    });
    const unassigned = await createAppointmentFixture({
      suffix: "sin-asignar",
      fecha: "2027-11-20",
      horaInicio: "12:10:00",
      horaFin: "13:00:00",
      withTherapist: false,
    });
    const [persisted] = await readPersistedAppointments([
      unassigned.citaId,
    ]);

    expect(persisted.terapeuta_id).toBeNull();
    expect(persisted.terapeuta_nombre).toBeNull();
    expect(persisted.terapeuta_activo).toBeNull();

    const response = await request(app)
      .get("/api/citas-spa")
      .set("Authorization", `Bearer ${admin.token}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    const collectionItem = response.body.data.find(
      (item: any) => Number(item.id) === persisted.id
    );
    const associations = expectedAssociations(persisted);

    expect(collectionItem).toBeDefined();
    expect(collectionItem).toMatchObject(expectedBaseAppointment(persisted));
    expect(collectionItem.Usuario).toEqual(associations.Usuario);
    expect(collectionItem.ServicioBienestar).toEqual(
      associations.ServicioBienestar
    );
    expect.soft(collectionItem).toHaveProperty("Terapeuta", null);
    expect.soft(collectionItem).not.toHaveProperty("Terapeutum");
  });

  it("QA-ADMIN-SPA-CITA-FUNC-005 A4: cliente no puede listar citas globales ni recibe datos", async () => {
    const persistedFixture = await createAppointmentFixture({
      suffix: "protegida",
      fecha: "2027-11-25",
      horaInicio: "10:00:00",
      horaFin: "10:50:00",
    });
    const [persisted] = await readPersistedAppointments([
      persistedFixture.citaId,
    ]);
    const nonAdmin = await createAuthenticatedUser({
      rol: ROLES.CLIENTE,
      email: "cliente-no-admin-listado-spa-005@hotel.test",
    });

    expect(persisted.id).toBe(persistedFixture.citaId);
    expect(persisted.terapeuta_id).not.toBeNull();

    const response = await request(app)
      .get("/api/citas-spa")
      .set("Authorization", `Bearer ${nonAdmin.token}`);

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
    expect(response.body).not.toHaveProperty("Terapeutum");
  });
});
