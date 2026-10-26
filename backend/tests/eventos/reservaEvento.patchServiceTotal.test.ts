import { describe, expect, it } from "vitest";

import request from "supertest";

import app from "../../src/app";
import { createSalonEvento } from "../fixtures/eventos";
import { createServicioEvento } from "../fixtures/eventoServicios";
import { createAuthenticatedUser } from "../helpers/auth";

const db = require("../../src/models");
const {
  ReservaEvento,
  ReservaEventoServicio,
  ServicioEvento,
  Salon,
} = db;

const TEST_NAME =
  "QA-EVT-FIN-CANDIDATE-036: PATCH de invitados conserva servicios, total y anticipo de la cotización";

describe("Integridad financiera al editar una reserva de evento", () => {
  it(TEST_NAME, async () => {
    const cliente = await createAuthenticatedUser();
    const authorization = `Bearer ${cliente.token}`;
    const salon = await createSalonEvento({
      capacidad_maxima: 100,
      tarifa_base: 5000,
    });
    const servicio = await createServicioEvento({
      precio: 300,
    });

    const createResponse = await request(app)
      .post("/api/reservas-evento")
      .set("Authorization", authorization)
      .send({
        salon_id: salon.id,
        tipo_evento: "boda",
        fecha: "2027-08-18",
        hora_inicio: "10:00",
        hora_fin: "14:00",
        numero_invitados: 50,
      });

    expect(createResponse.status).toBe(201);
    expect(Number(createResponse.body.data.total)).toBe(5000);

    const reservaId = Number(createResponse.body.data.id);
    const totalAntesServicio = Number(createResponse.body.data.total);
    const anticipoAntesServicio = Number(createResponse.body.data.anticipo);

    const addServiceResponse = await request(app)
      .post(`/api/reservas-evento/${reservaId}/servicios`)
      .set("Authorization", authorization)
      .send({
        servicio_evento_id: servicio.id,
        cantidad: 2,
      });

    expect(addServiceResponse.status).toBe(201);
    expect(Number(addServiceResponse.body.data.item.subtotal)).toBe(600);
    expect(Number(addServiceResponse.body.data.reserva.total)).toBe(5600);

    const associationId = Number(addServiceResponse.body.data.item.id);
    const reservaAntesPatch = await ReservaEvento.findByPk(reservaId);
    const associationAntesPatch = await ReservaEventoServicio.findByPk(
      associationId
    );

    expect(reservaAntesPatch).not.toBeNull();
    expect(associationAntesPatch).not.toBeNull();

    const totalDespuesServicio = Number(reservaAntesPatch.total);
    const totalAntesPatch = Number(reservaAntesPatch.total);
    const anticipoAntesPatch = Number(reservaAntesPatch.anticipo);
    const associationSnapshotAntes = {
      id: Number(associationAntesPatch.id),
      reserva_evento_id: Number(associationAntesPatch.reserva_evento_id),
      servicio_evento_id: Number(associationAntesPatch.servicio_evento_id),
      cantidad: Number(associationAntesPatch.cantidad),
      subtotal: Number(associationAntesPatch.subtotal),
      precio_snapshot:
        Number(associationAntesPatch.subtotal) /
        Number(associationAntesPatch.cantidad),
    };

    const patchResponse = await request(app)
      .patch(`/api/reservas-evento/${reservaId}`)
      .set("Authorization", authorization)
      .send({
        numero_invitados: 60,
      });

    const [
      reservaDespuesPatch,
      associationDespuesPatch,
      servicioPersistido,
      salonPersistido,
      asociacionesPersistidas,
    ] = await Promise.all([
      ReservaEvento.findByPk(reservaId),
      ReservaEventoServicio.findByPk(associationId),
      ServicioEvento.findByPk(servicio.id),
      Salon.findByPk(salon.id),
      ReservaEventoServicio.findAll({
        where: { reserva_evento_id: reservaId },
        order: [["id", "ASC"]],
      }),
    ]);

    expect(reservaDespuesPatch).not.toBeNull();
    expect(associationDespuesPatch).not.toBeNull();
    expect(servicioPersistido).not.toBeNull();
    expect(salonPersistido).not.toBeNull();

    const associationSnapshotDespues = {
      id: Number(associationDespuesPatch.id),
      reserva_evento_id: Number(associationDespuesPatch.reserva_evento_id),
      servicio_evento_id: Number(associationDespuesPatch.servicio_evento_id),
      cantidad: Number(associationDespuesPatch.cantidad),
      subtotal: Number(associationDespuesPatch.subtotal),
      precio_snapshot:
        Number(associationDespuesPatch.subtotal) /
        Number(associationDespuesPatch.cantidad),
    };
    const subtotalesPersistidos = asociacionesPersistidas.reduce(
      (sum: number, item: any) => sum + Number(item.subtotal),
      0
    );
    const totalEsperado =
      Number(salonPersistido.tarifa_base) + subtotalesPersistidos;
    const anticipoEsperado = totalEsperado * 0.3;
    const totalDespuesPatch = Number(reservaDespuesPatch.total);
    const anticipoDespuesPatch = Number(reservaDespuesPatch.anticipo);
    const financialViolation = totalDespuesPatch !== totalEsperado;

    console.log(
      "[QA-EVT-FIN-CANDIDATE-036]",
      JSON.stringify(
        {
          qaId: "QA-EVT-FIN-CANDIDATE-036",
          database: "hotel_test_db",
          invariant:
            "PATCH exclusivo de numero_invitados conserva la asociación y total = tarifa del salón + SUM(subtotales persistidos)",
          ids: {
            reserva: reservaId,
            salon: Number(salonPersistido.id),
            servicio: Number(servicioPersistido.id),
            asociacion: Number(associationDespuesPatch.id),
          },
          estado: reservaDespuesPatch.estado,
          precios: {
            tarifaSalon: Number(salonPersistido.tarifa_base).toFixed(2),
            servicioMaestro: Number(servicioPersistido.precio).toFixed(2),
            snapshotAsociacion:
              associationSnapshotDespues.precio_snapshot.toFixed(2),
          },
          asociacion: {
            cantidad: associationSnapshotDespues.cantidad,
            subtotal: associationSnapshotDespues.subtotal.toFixed(2),
            persistioIdentica:
              JSON.stringify(associationSnapshotDespues) ===
              JSON.stringify(associationSnapshotAntes),
          },
          totales: {
            antesServicio: totalAntesServicio.toFixed(2),
            despuesServicio: totalDespuesServicio.toFixed(2),
            antesPatch: totalAntesPatch.toFixed(2),
            esperadoDespuesPatch: totalEsperado.toFixed(2),
            despuesPatch: totalDespuesPatch.toFixed(2),
          },
          anticipo: {
            antesServicio: anticipoAntesServicio.toFixed(2),
            antesPatch: anticipoAntesPatch.toFixed(2),
            esperadoDespuesPatch: anticipoEsperado.toFixed(2),
            despuesPatch: anticipoDespuesPatch.toFixed(2),
          },
          patch: {
            campo: "numero_invitados",
            antes: 50,
            despues: Number(reservaDespuesPatch.numero_invitados),
            status: patchResponse.status,
            code: patchResponse.body.code ?? null,
          },
          financialViolation,
        },
        null,
        2
      )
    );

    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.code).toBeUndefined();
    expect(Number(reservaDespuesPatch.numero_invitados)).toBe(60);
    expect(reservaDespuesPatch.estado).toBe("cotizacion");
    expect(Number(salonPersistido.tarifa_base)).toBe(5000);
    expect(Number(servicioPersistido.precio)).toBe(300);
    expect(associationSnapshotDespues).toEqual(associationSnapshotAntes);
    expect(associationSnapshotDespues.precio_snapshot).toBe(300);
    expect(associationSnapshotDespues.cantidad).toBe(2);
    expect(associationSnapshotDespues.subtotal).toBe(600);
    expect(totalAntesPatch).toBe(5600);
    expect.soft(totalDespuesPatch).toBe(totalEsperado);
    expect.soft(anticipoDespuesPatch).toBe(anticipoEsperado);
    expect.soft(financialViolation).toBe(false);
  });
});
