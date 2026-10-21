import {
  describe,
  expect,
  it,
} from "vitest";

import request from "supertest";

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { createSucursal } from "../fixtures/hotel";
import { createAuthenticatedUser } from "../helpers/auth";

const db = require("../../src/models");
const { RecursoActividad } = db;

const uniqueResourceName = (operation: string) =>
  `QA RA ${operation} ${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const relevantResource = (resource: any) => {
  if (!resource) {
    return null;
  }

  return {
    id: resource.id,
    sucursal_id: resource.sucursal_id,
    tipo: resource.tipo,
    nombre: resource.nombre,
    precio_hora: resource.precio_hora,
    precio_equipo: resource.precio_equipo,
    precio_instructor_hora: resource.precio_instructor_hora,
  };
};

const relevantTariffs = (resource: any) => {
  if (!resource) {
    return null;
  }

  return {
    precio_hora: resource.precio_hora,
    precio_equipo: resource.precio_equipo,
    precio_instructor_hora: resource.precio_instructor_hora,
  };
};

describe("Administración de recursos de actividad", () => {
  it("QA-RA-FUNC-CANDIDATE-003 CREATE: admin configura tarifas al crear recurso", async () => {
    const sucursal = await createSucursal();
    const admin = await createAuthenticatedUser({
      rol: ROLES.ADMIN,
    });
    const nombre = uniqueResourceName("CREATE");

    const createResponse = await request(app)
      .post("/api/recursos-actividad")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        sucursal_id: sucursal.id,
        tipo: "tenis",
        nombre,
        precio_hora: 100.0,
        precio_equipo: 25.0,
        precio_instructor_hora: 50.0,
      });

    let getResponse: any = null;
    if (createResponse.status === 201 && createResponse.body?.data?.id != null) {
      getResponse = await request(app).get(
        `/api/recursos-actividad/${createResponse.body.data.id}`
      );
    }

    const persisted = await RecursoActividad.findOne({
      where: { nombre },
    });

    console.log(
      "[QA-RA-FUNC-CANDIDATE-003 CREATE]",
      JSON.stringify(
        {
          create: {
            status: createResponse.status,
            code: createResponse.body?.code,
            message: createResponse.body?.message,
            body: relevantResource(createResponse.body?.data),
            details: createResponse.body?.details,
          },
          get: getResponse
            ? {
                status: getResponse.status,
                code: getResponse.body?.code,
                message: getResponse.body?.message,
                body: relevantResource(getResponse.body?.data),
              }
            : null,
          database: relevantResource(persisted),
        },
        null,
        2
      )
    );

    expect.soft(
      [401, 403],
      "El admin autenticado debe superar autenticación y autorización"
    ).not.toContain(createResponse.status);
    expect.soft(createResponse.status, "CREATE debe responder HTTP 201").toBe(201);
    if (createResponse.status === 201) {
      expect.soft(createResponse.body?.status).toBe("success");
      expect.soft(relevantTariffs(createResponse.body?.data)).toEqual({
        precio_hora: "100.00",
        precio_equipo: "25.00",
        precio_instructor_hora: "50.00",
      });
      expect.soft(getResponse?.status, "GET posterior a CREATE debe responder 200").toBe(200);
      expect.soft(relevantTariffs(getResponse?.body?.data)).toEqual({
        precio_hora: "100.00",
        precio_equipo: "25.00",
        precio_instructor_hora: "50.00",
      });
    }

    expect.soft(
      relevantTariffs(persisted),
      "PostgreSQL debe persistir exactamente las tres tarifas de CREATE"
    ).toEqual({
      precio_hora: "100.00",
      precio_equipo: "25.00",
      precio_instructor_hora: "50.00",
    });
  });

  it("QA-RA-FUNC-CANDIDATE-003 UPDATE: admin configura tarifas al actualizar recurso", async () => {
    const sucursal = await createSucursal();
    const admin = await createAuthenticatedUser({
      rol: ROLES.ADMIN,
    });
    const nombre = uniqueResourceName("UPDATE");

    const setupCreateResponse = await request(app)
      .post("/api/recursos-actividad")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        sucursal_id: sucursal.id,
        tipo: "golf",
        nombre,
      });

    const recursoId = setupCreateResponse.body?.data?.id;
    if (setupCreateResponse.status !== 201 || recursoId == null) {
      console.log("[QA-RA-FUNC-CANDIDATE-003 UPDATE SETUP]", {
        status: setupCreateResponse.status,
        code: setupCreateResponse.body?.code,
        message: setupCreateResponse.body?.message,
        body: setupCreateResponse.body,
      });
      throw new Error(
        "Setup inválido: el admin no pudo crear por API el recurso base sin tarifas"
      );
    }

    const updateResponse = await request(app)
      .patch(`/api/recursos-actividad/${recursoId}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        precio_hora: 150.0,
        precio_equipo: 30.0,
        precio_instructor_hora: 60.0,
      });

    const getResponse = await request(app).get(
      `/api/recursos-actividad/${recursoId}`
    );
    const persisted = await RecursoActividad.findByPk(recursoId);

    console.log(
      "[QA-RA-FUNC-CANDIDATE-003 UPDATE]",
      JSON.stringify(
        {
          setupCreate: {
            status: setupCreateResponse.status,
            body: relevantResource(setupCreateResponse.body?.data),
          },
          update: {
            status: updateResponse.status,
            code: updateResponse.body?.code,
            message: updateResponse.body?.message,
            body: relevantResource(updateResponse.body?.data),
            details: updateResponse.body?.details,
          },
          get: {
            status: getResponse.status,
            code: getResponse.body?.code,
            message: getResponse.body?.message,
            body: relevantResource(getResponse.body?.data),
          },
          database: relevantResource(persisted),
        },
        null,
        2
      )
    );

    expect.soft(
      [401, 403],
      "El admin autenticado debe superar autenticación y autorización"
    ).not.toContain(updateResponse.status);
    expect.soft(updateResponse.status, "UPDATE debe responder HTTP 200").toBe(200);
    if (updateResponse.status === 200) {
      expect.soft(updateResponse.body?.status).toBe("success");
      expect.soft(relevantTariffs(updateResponse.body?.data)).toEqual({
        precio_hora: "150.00",
        precio_equipo: "30.00",
        precio_instructor_hora: "60.00",
      });
    }

    expect.soft(getResponse.status, "GET posterior a UPDATE debe responder 200").toBe(200);
    expect.soft(relevantTariffs(getResponse.body?.data)).toEqual({
      precio_hora: "150.00",
      precio_equipo: "30.00",
      precio_instructor_hora: "60.00",
    });

    expect.soft(
      relevantTariffs(persisted),
      "PostgreSQL debe persistir exactamente las tres tarifas de UPDATE"
    ).toEqual({
      precio_hora: "150.00",
      precio_equipo: "30.00",
      precio_instructor_hora: "60.00",
    });
  });
});
