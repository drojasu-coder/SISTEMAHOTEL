import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { createAuthenticatedUser } from "../helpers/auth";
import { createHotelFixture } from "../fixtures/hotel";

describe("Consulta administrativa de reservas de habitación (control de acceso y aislamiento)", () => {
  it("coincidencia de roles: admin, recepcionista y gerente_habitaciones pueden listar y consultar cualquier reserva; cliente solo la suya", async () => {
    // 1. Preparar fixture de hotel y dos clientes distintos con reservas
    const hotel = await createHotelFixture({
      capacidad: 4,
      tarifa: 150,
    });

    const clienteA = await createAuthenticatedUser({
      rol: ROLES.CLIENTE,
    });

    const clienteB = await createAuthenticatedUser({
      rol: ROLES.CLIENTE,
    });

    // Reserva creada por clienteA
    const resA = await request(app)
      .post("/api/reservas-habitacion")
      .set("Authorization", `Bearer ${clienteA.token}`)
      .send({
        habitacion_id: hotel.habitacion.id,
        fecha_entrada: "2027-09-01",
        fecha_salida: "2027-09-05",
        numero_huespedes: 2,
      });

    expect(resA.status).toBe(201);
    const reservaAId = resA.body.data.id;

    // 2. Roles autorizados por 'habitaciones.gestionar' (rolesGestionHabitaciones)
    const rolesAdministrativos = [
      ROLES.ADMIN,
      ROLES.RECEPCIONISTA,
      ROLES.GERENTE_HABITACIONES,
    ];

    for (const rol of rolesAdministrativos) {
      const staffUser = await createAuthenticatedUser({ rol });

      // Listado administrativo: debe incluir la reserva del clienteA
      const listRes = await request(app)
        .get("/api/reservas-habitacion")
        .set("Authorization", `Bearer ${staffUser.token}`);

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body.data)).toBe(true);
      const foundInList = listRes.body.data.some(
        (r: any) => r.id === reservaAId
      );
      expect(
        foundInList,
        `Rol ${rol} debe poder listar la reserva ${reservaAId}`
      ).toBe(true);

      // Detalle administrativo por ID: debe poder consultar cualquier reserva
      const detailRes = await request(app)
        .get(`/api/reservas-habitacion/${reservaAId}`)
        .set("Authorization", `Bearer ${staffUser.token}`);

      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.id).toBe(reservaAId);
      expect(detailRes.body.data.usuario_id).toBe(clienteA.usuario.id);
    }

    // 3. Aislamiento estricto de cliente:
    // clienteB consulta listado general -> NO debe contener la reserva de clienteA
    const listClienteB = await request(app)
      .get("/api/reservas-habitacion")
      .set("Authorization", `Bearer ${clienteB.token}`);

    expect(listClienteB.status).toBe(200);
    const leakedReservation = listClienteB.body.data.some(
      (r: any) => r.id === reservaAId
    );
    expect(
      leakedReservation,
      "El listado para clienteB no debe contener reservas de clienteA"
    ).toBe(false);

    // clienteB intenta consultar el detalle de la reserva de clienteA por ID -> 403
    const detailClienteB = await request(app)
      .get(`/api/reservas-habitacion/${reservaAId}`)
      .set("Authorization", `Bearer ${clienteB.token}`);

    expect(detailClienteB.status).toBe(403);
    expect(detailClienteB.body.code).toBe("INSUFFICIENT_PERMISSIONS");

    // clienteA consulta su propia reserva por ID -> 200
    const detailClienteA = await request(app)
      .get(`/api/reservas-habitacion/${reservaAId}`)
      .set("Authorization", `Bearer ${clienteA.token}`);

    expect(detailClienteA.status).toBe(200);
    expect(detailClienteA.body.data.id).toBe(reservaAId);
  });
});
