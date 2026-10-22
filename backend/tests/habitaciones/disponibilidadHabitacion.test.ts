import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { createAuthenticatedUser } from "../helpers/auth";
import { createHotelFixture, createSucursal, createTipoHabitacion, createHabitacion } from "../fixtures/hotel";
const db = require("../../src/models");
const { ReservaHabitacion, Habitacion } = db;

describe("BE-012 — Disponibilidad real de habitaciones y BE-011 contratos", () => {
  describe("1. Autenticación", () => {
    it("rechaza peticiones sin token con 401 AUTH_TOKEN_REQUIRED", async () => {
      const response = await request(app)
        .get("/api/habitaciones/disponibles")
        .query({
          sucursal_id: 1,
          fecha_entrada: "2027-06-10",
          fecha_salida: "2027-06-15",
          numero_huespedes: 2,
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe("AUTH_TOKEN_REQUIRED");
    });

    it("rechaza tokens con formato inválido con 401 INVALID_TOKEN o INVALID_AUTH_FORMAT", async () => {
      const response = await request(app)
        .get("/api/habitaciones/disponibles")
        .set("Authorization", "Bearer token_falso_invalido")
        .query({
          sucursal_id: 1,
          fecha_entrada: "2027-06-10",
          fecha_salida: "2027-06-15",
          numero_huespedes: 2,
        });

      expect(response.status).toBe(401);
      expect(["INVALID_TOKEN", "INVALID_AUTH_FORMAT"]).toContain(response.body.code);
    });
  });

  describe("2. Enrutamiento", () => {
    it("la ruta /disponibles no es capturada como /:id", async () => {
      const hotel = await createHotelFixture();
      const auth = await createAuthenticatedUser({ rol: ROLES.CLIENTE });

      const response = await request(app)
        .get("/api/habitaciones/disponibles")
        .set("Authorization", `Bearer ${auth.token}`)
        .query({
          sucursal_id: hotel.sucursal.id,
          fecha_entrada: "2027-07-01",
          fecha_salida: "2027-07-05",
          numero_huespedes: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("3. Validación de parámetros de query (400 VALIDATION_ERROR)", () => {
    it("rechaza cuando falta sucursal_id", async () => {
      const auth = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      const response = await request(app)
        .get("/api/habitaciones/disponibles")
        .set("Authorization", `Bearer ${auth.token}`)
        .query({
          fecha_entrada: "2027-07-01",
          fecha_salida: "2027-07-05",
          numero_huespedes: 2,
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_ERROR");
    });

    it("rechaza sucursal_id vacío o no numérico", async () => {
      const auth = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      const resEmpty = await request(app)
        .get("/api/habitaciones/disponibles")
        .set("Authorization", `Bearer ${auth.token}`)
        .query({
          sucursal_id: "",
          fecha_entrada: "2027-07-01",
          fecha_salida: "2027-07-05",
          numero_huespedes: 2,
        });
      expect(resEmpty.status).toBe(400);

      const resAlpha = await request(app)
        .get("/api/habitaciones/disponibles")
        .set("Authorization", `Bearer ${auth.token}`)
        .query({
          sucursal_id: "abc",
          fecha_entrada: "2027-07-01",
          fecha_salida: "2027-07-05",
          numero_huespedes: 2,
        });
      expect(resAlpha.status).toBe(400);
    });

    it("rechaza sucursal_id no escalar (array u objeto)", async () => {
      const auth = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      const resArray = await request(app)
        .get("/api/habitaciones/disponibles?sucursal_id=1&sucursal_id=2&fecha_entrada=2027-07-01&fecha_salida=2027-07-05&numero_huespedes=2")
        .set("Authorization", `Bearer ${auth.token}`);
      expect(resArray.status).toBe(400);
    });

    it("rechaza fecha con formato inválido", async () => {
      const auth = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      const response = await request(app)
        .get("/api/habitaciones/disponibles")
        .set("Authorization", `Bearer ${auth.token}`)
        .query({
          sucursal_id: 1,
          fecha_entrada: "01-07-2027",
          fecha_salida: "2027-07-05",
          numero_huespedes: 2,
        });
      expect(response.status).toBe(400);
    });

    it("rechaza fecha calendario inexistente (ej. 2027-02-31)", async () => {
      const auth = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      const response = await request(app)
        .get("/api/habitaciones/disponibles")
        .set("Authorization", `Bearer ${auth.token}`)
        .query({
          sucursal_id: 1,
          fecha_entrada: "2027-02-31",
          fecha_salida: "2027-03-05",
          numero_huespedes: 2,
        });
      expect(response.status).toBe(400);
    });

    it("rechaza numero_huespedes faltante o no positivo", async () => {
      const auth = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      const resMissing = await request(app)
        .get("/api/habitaciones/disponibles")
        .set("Authorization", `Bearer ${auth.token}`)
        .query({
          sucursal_id: 1,
          fecha_entrada: "2027-07-01",
          fecha_salida: "2027-07-05",
        });
      expect(resMissing.status).toBe(400);

      const resZero = await request(app)
        .get("/api/habitaciones/disponibles")
        .set("Authorization", `Bearer ${auth.token}`)
        .query({
          sucursal_id: 1,
          fecha_entrada: "2027-07-01",
          fecha_salida: "2027-07-05",
          numero_huespedes: 0,
        });
      expect(resZero.status).toBe(400);
    });

    it("rechaza parámetros no permitidos (strict schema)", async () => {
      const auth = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      const response = await request(app)
        .get("/api/habitaciones/disponibles")
        .set("Authorization", `Bearer ${auth.token}`)
        .query({
          sucursal_id: 1,
          fecha_entrada: "2027-07-01",
          fecha_salida: "2027-07-05",
          numero_huespedes: 2,
          parametro_extranno: "hack",
        });
      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("4. Reglas semánticas (404 SUCURSAL_NOT_FOUND, 422 FECHAS_INVALIDAS / ROOM_RESERVATION_DATE_IN_PAST)", () => {
    it("devuelve 404 si la sucursal no existe", async () => {
      const auth = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      const response = await request(app)
        .get("/api/habitaciones/disponibles")
        .set("Authorization", `Bearer ${auth.token}`)
        .query({
          sucursal_id: 9999999,
          fecha_entrada: "2027-07-01",
          fecha_salida: "2027-07-05",
          numero_huespedes: 2,
        });

      expect(response.status).toBe(404);
      expect(response.body.code).toBe("SUCURSAL_NOT_FOUND");
    });

    it("devuelve 422 FECHAS_INVALIDAS si fecha_salida <= fecha_entrada", async () => {
      const hotel = await createHotelFixture();
      const auth = await createAuthenticatedUser({ rol: ROLES.CLIENTE });

      const resEqual = await request(app)
        .get("/api/habitaciones/disponibles")
        .set("Authorization", `Bearer ${auth.token}`)
        .query({
          sucursal_id: hotel.sucursal.id,
          fecha_entrada: "2027-07-05",
          fecha_salida: "2027-07-05",
          numero_huespedes: 2,
        });
      expect(resEqual.status).toBe(422);
      expect(resEqual.body.code).toBe("FECHAS_INVALIDAS");

      const resBefore = await request(app)
        .get("/api/habitaciones/disponibles")
        .set("Authorization", `Bearer ${auth.token}`)
        .query({
          sucursal_id: hotel.sucursal.id,
          fecha_entrada: "2027-07-05",
          fecha_salida: "2027-07-01",
          numero_huespedes: 2,
        });
      expect(resBefore.status).toBe(422);
      expect(resBefore.body.code).toBe("FECHAS_INVALIDAS");
    });

    it("devuelve 422 ROOM_RESERVATION_DATE_IN_PAST si fecha_entrada es en el pasado", async () => {
      const hotel = await createHotelFixture();
      const auth = await createAuthenticatedUser({ rol: ROLES.CLIENTE });

      const response = await request(app)
        .get("/api/habitaciones/disponibles")
        .set("Authorization", `Bearer ${auth.token}`)
        .query({
          sucursal_id: hotel.sucursal.id,
          fecha_entrada: "2020-01-01",
          fecha_salida: "2020-01-05",
          numero_huespedes: 2,
        });

      expect(response.status).toBe(422);
      expect(response.body.code).toBe("ROOM_RESERVATION_DATE_IN_PAST");
    });
  });

  describe("5. Criterios de elegibilidad de disponibilidad", () => {
    it("filtra por sede solicitada y capacidad suficiente", async () => {
      const sucursal1 = await createSucursal();
      const sucursal2 = await createSucursal();

      const tipoGrande = await createTipoHabitacion({ capacidad_maxima: 4, tarifa_noche: 200 });
      const tipoPequeno = await createTipoHabitacion({ capacidad_maxima: 2, tarifa_noche: 100 });

      // Habitación en sucursal 1 con capacidad 4
      const hab1 = await createHabitacion({
        sucursal_id: sucursal1.id,
        tipo_habitacion_id: tipoGrande.id,
        numero: "101",
      });

      // Habitación en sucursal 1 con capacidad 2
      await createHabitacion({
        sucursal_id: sucursal1.id,
        tipo_habitacion_id: tipoPequeno.id,
        numero: "102",
      });

      // Habitación en sucursal 2 con capacidad 4
      await createHabitacion({
        sucursal_id: sucursal2.id,
        tipo_habitacion_id: tipoGrande.id,
        numero: "201",
      });

      const auth = await createAuthenticatedUser({ rol: ROLES.CLIENTE });

      // Consulta en sucursal 1 para 3 huéspedes: solo hab1 debe calificar
      const response = await request(app)
        .get("/api/habitaciones/disponibles")
        .set("Authorization", `Bearer ${auth.token}`)
        .query({
          sucursal_id: sucursal1.id,
          fecha_entrada: "2027-08-01",
          fecha_salida: "2027-08-04",
          numero_huespedes: 3,
        });

      expect(response.status).toBe(200);
      const habIds = response.body.data.map((h: any) => h.id);
      expect(habIds).toContain(hab1.id);
      expect(habIds).not.toContain(hab1.id + 1); // 102 excluida por capacidad
      expect(response.body.data.every((h: any) => h.sucursal_id === sucursal1.id)).toBe(true);
    });

    it("filtra por tipo_habitacion_id opcional cuando se proporciona", async () => {
      const sucursal = await createSucursal();
      const tipoA = await createTipoHabitacion({ capacidad_maxima: 4 });
      const tipoB = await createTipoHabitacion({ capacidad_maxima: 4 });

      const habA = await createHabitacion({ sucursal_id: sucursal.id, tipo_habitacion_id: tipoA.id });
      const habB = await createHabitacion({ sucursal_id: sucursal.id, tipo_habitacion_id: tipoB.id });

      const auth = await createAuthenticatedUser({ rol: ROLES.CLIENTE });

      const response = await request(app)
        .get("/api/habitaciones/disponibles")
        .set("Authorization", `Bearer ${auth.token}`)
        .query({
          sucursal_id: sucursal.id,
          tipo_habitacion_id: tipoA.id,
          fecha_entrada: "2027-08-10",
          fecha_salida: "2027-08-14",
          numero_huespedes: 2,
        });

      expect(response.status).toBe(200);
      const ids = response.body.data.map((h: any) => h.id);
      expect(ids).toContain(habA.id);
      expect(ids).not.toContain(habB.id);
    });

    it("excluye habitaciones en estado mantenimiento", async () => {
      const sucursal = await createSucursal();
      const tipo = await createTipoHabitacion({ capacidad_maxima: 4 });

      const habNormal = await createHabitacion({ sucursal_id: sucursal.id, tipo_habitacion_id: tipo.id, estado: "disponible" });
      const habMantenimiento = await createHabitacion({ sucursal_id: sucursal.id, tipo_habitacion_id: tipo.id, estado: "mantenimiento" });

      const auth = await createAuthenticatedUser({ rol: ROLES.CLIENTE });

      const response = await request(app)
        .get("/api/habitaciones/disponibles")
        .set("Authorization", `Bearer ${auth.token}`)
        .query({
          sucursal_id: sucursal.id,
          fecha_entrada: "2027-08-15",
          fecha_salida: "2027-08-18",
          numero_huespedes: 2,
        });

      expect(response.status).toBe(200);
      const ids = response.body.data.map((h: any) => h.id);
      expect(ids).toContain(habNormal.id);
      expect(ids).not.toContain(habMantenimiento.id);
    });

    it("no excluye habitaciones con estado ocupada o limpieza si no tienen traslape en esas fechas", async () => {
      const sucursal = await createSucursal();
      const tipo = await createTipoHabitacion({ capacidad_maxima: 4 });

      const habOcupada = await createHabitacion({ sucursal_id: sucursal.id, tipo_habitacion_id: tipo.id, estado: "ocupada" });
      const habLimpieza = await createHabitacion({ sucursal_id: sucursal.id, tipo_habitacion_id: tipo.id, estado: "limpieza" });

      const auth = await createAuthenticatedUser({ rol: ROLES.CLIENTE });

      const response = await request(app)
        .get("/api/habitaciones/disponibles")
        .set("Authorization", `Bearer ${auth.token}`)
        .query({
          sucursal_id: sucursal.id,
          fecha_entrada: "2027-08-20",
          fecha_salida: "2027-08-23",
          numero_huespedes: 2,
        });

      expect(response.status).toBe(200);
      const ids = response.body.data.map((h: any) => h.id);
      expect(ids).toContain(habOcupada.id);
      expect(ids).toContain(habLimpieza.id);
    });

    it("excluye habitaciones con traslape en reservas pendientes o confirmadas", async () => {
      const hotel = await createHotelFixture();
      const auth = await createAuthenticatedUser({ rol: ROLES.CLIENTE });

      // Reserva confirmada del 2027-09-10 al 2027-09-15
      await ReservaHabitacion.create({
        usuario_id: auth.usuario.id,
        habitacion_id: hotel.habitacion.id,
        fecha_entrada: "2027-09-10",
        fecha_salida: "2027-09-15",
        numero_huespedes: 2,
        estado: "confirmada",
        total: "500.00",
      });

      // Consulta con solapamiento: del 2027-09-12 al 2027-09-17
      const response = await request(app)
        .get("/api/habitaciones/disponibles")
        .set("Authorization", `Bearer ${auth.token}`)
        .query({
          sucursal_id: hotel.sucursal.id,
          fecha_entrada: "2027-09-12",
          fecha_salida: "2027-09-17",
          numero_huespedes: 2,
        });

      expect(response.status).toBe(200);
      const ids = response.body.data.map((h: any) => h.id);
      expect(ids).not.toContain(hotel.habitacion.id);
    });

    it("permite estancias consecutivas sin solapamiento (fecha_salida == fecha_entrada)", async () => {
      const hotel = await createHotelFixture();
      const auth = await createAuthenticatedUser({ rol: ROLES.CLIENTE });

      // Reserva existente del 2027-09-10 al 2027-09-15
      await ReservaHabitacion.create({
        usuario_id: auth.usuario.id,
        habitacion_id: hotel.habitacion.id,
        fecha_entrada: "2027-09-10",
        fecha_salida: "2027-09-15",
        numero_huespedes: 2,
        estado: "confirmada",
        total: "500.00",
      });

      // Consulta consecutiva que inicia el día de salida: del 2027-09-15 al 2027-09-20
      const response = await request(app)
        .get("/api/habitaciones/disponibles")
        .set("Authorization", `Bearer ${auth.token}`)
        .query({
          sucursal_id: hotel.sucursal.id,
          fecha_entrada: "2027-09-15",
          fecha_salida: "2027-09-20",
          numero_huespedes: 2,
        });

      expect(response.status).toBe(200);
      const ids = response.body.data.map((h: any) => h.id);
      expect(ids).toContain(hotel.habitacion.id);
    });

    it("reservas canceladas, finalizadas o expiradas no bloquean la disponibilidad", async () => {
      const hotel = await createHotelFixture();
      const auth = await createAuthenticatedUser({ rol: ROLES.CLIENTE });

      for (const estado of ["cancelada", "finalizada", "expirada"]) {
        await ReservaHabitacion.create({
          usuario_id: auth.usuario.id,
          habitacion_id: hotel.habitacion.id,
          fecha_entrada: "2027-09-25",
          fecha_salida: "2027-09-30",
          numero_huespedes: 2,
          estado,
          total: "500.00",
        });
      }

      const response = await request(app)
        .get("/api/habitaciones/disponibles")
        .set("Authorization", `Bearer ${auth.token}`)
        .query({
          sucursal_id: hotel.sucursal.id,
          fecha_entrada: "2027-09-26",
          fecha_salida: "2027-09-29",
          numero_huespedes: 2,
        });

      expect(response.status).toBe(200);
      const ids = response.body.data.map((h: any) => h.id);
      expect(ids).toContain(hotel.habitacion.id);
    });

    it("devuelve resultado vacío válido (data: []) si no hay habitaciones elegibles", async () => {
      const sucursal = await createSucursal();
      const auth = await createAuthenticatedUser({ rol: ROLES.CLIENTE });

      const response = await request(app)
        .get("/api/habitaciones/disponibles")
        .set("Authorization", `Bearer ${auth.token}`)
        .query({
          sucursal_id: sucursal.id,
          fecha_entrada: "2027-10-01",
          fecha_salida: "2027-10-05",
          numero_huespedes: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });

  describe("6. Contrato de respuesta, importes y ausencia de efectos de escritura", () => {
    it("devuelve los campos acordados con formato decimal y consistencia con creación POST", async () => {
      const hotel = await createHotelFixture({ tarifa: 150.5, capacidad: 4 });
      const auth = await createAuthenticatedUser({ rol: ROLES.CLIENTE });

      const fechaEntrada = "2027-11-01";
      const fechaSalida = "2027-11-04"; // 3 noches

      // Comprobar que no hay efectos secundarios de escritura
      const totalReservasAntes = await ReservaHabitacion.count();
      const totalHabitacionesAntes = await Habitacion.count();

      const response = await request(app)
        .get("/api/habitaciones/disponibles")
        .set("Authorization", `Bearer ${auth.token}`)
        .query({
          sucursal_id: hotel.sucursal.id,
          fecha_entrada: fechaEntrada,
          fecha_salida: fechaSalida,
          numero_huespedes: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const totalReservasDespues = await ReservaHabitacion.count();
      const totalHabitacionesDespues = await Habitacion.count();
      expect(totalReservasDespues).toBe(totalReservasAntes);
      expect(totalHabitacionesDespues).toBe(totalHabitacionesAntes);

      const item = response.body.data.find((h: any) => h.id === hotel.habitacion.id);
      expect(item).toBeDefined();
      expect(item.id).toBe(hotel.habitacion.id);
      expect(item.numero).toBe(hotel.habitacion.numero);
      expect(item.sucursal_id).toBe(hotel.sucursal.id);
      expect(item.noches).toBe(3);
      expect(item.tarifa_noche).toBe("150.50");
      expect(item.total_estimado).toBe("451.50"); // 3 * 150.50 = 451.50

      expect(item.Sucursal).toBeDefined();
      expect(item.Sucursal.id).toBe(hotel.sucursal.id);
      expect(item.Sucursal.nombre).toBe(hotel.sucursal.nombre);
      expect(item.TipoHabitacion).toBeDefined();
      expect(item.TipoHabitacion.id).toBe(hotel.tipoHabitacion.id);
      expect(item.TipoHabitacion.capacidad_maxima).toBe(4);

      // Ahora creamos la reserva con POST y verificamos que el total coincide con total_estimado
      const postRes = await request(app)
        .post("/api/reservas-habitacion")
        .set("Authorization", `Bearer ${auth.token}`)
        .send({
          habitacion_id: hotel.habitacion.id,
          fecha_entrada: fechaEntrada,
          fecha_salida: fechaSalida,
          numero_huespedes: 2,
        });

      expect(postRes.status).toBe(201);
      expect(Number(postRes.body.data.total).toFixed(2)).toBe(item.total_estimado);
    });
  });

  describe("7. BE-011: Relación de Sucursal en Reservas, permisos y seguridad", () => {
    it("incluye Sucursal dentro de Habitacion en listado y detalle de reservas", async () => {
      const hotel = await createHotelFixture();
      const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });

      const postRes = await request(app)
        .post("/api/reservas-habitacion")
        .set("Authorization", `Bearer ${cliente.token}`)
        .send({
          habitacion_id: hotel.habitacion.id,
          fecha_entrada: "2027-12-01",
          fecha_salida: "2027-12-05",
          numero_huespedes: 2,
        });

      expect(postRes.status).toBe(201);
      const reservaId = postRes.body.data.id;

      // GET listado
      const listRes = await request(app)
        .get("/api/reservas-habitacion")
        .set("Authorization", `Bearer ${cliente.token}`);

      expect(listRes.status).toBe(200);
      const reservaEnLista = listRes.body.data.find((r: any) => r.id === reservaId);
      expect(reservaEnLista).toBeDefined();
      expect(reservaEnLista.Habitacion).toBeDefined();
      expect(reservaEnLista.Habitacion.Sucursal).toBeDefined();
      expect(reservaEnLista.Habitacion.Sucursal.id).toBe(hotel.sucursal.id);
      expect(reservaEnLista.Habitacion.Sucursal.nombre).toBe(hotel.sucursal.nombre);
      expect(typeof reservaEnLista.Habitacion.Sucursal.activa).toBe("boolean");

      // GET detalle
      const detailRes = await request(app)
        .get(`/api/reservas-habitacion/${reservaId}`)
        .set("Authorization", `Bearer ${cliente.token}`);

      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.Habitacion).toBeDefined();
      expect(detailRes.body.data.Habitacion.Sucursal).toBeDefined();
      expect(detailRes.body.data.Habitacion.Sucursal.id).toBe(hotel.sucursal.id);
      expect(detailRes.body.data.Habitacion.Sucursal.nombre).toBe(hotel.sucursal.nombre);
    });

    it("cliente no puede acceder al detalle de una reserva de otro usuario (403)", async () => {
      const hotel = await createHotelFixture();
      const cliente1 = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      const cliente2 = await createAuthenticatedUser({ rol: ROLES.CLIENTE });

      const postRes = await request(app)
        .post("/api/reservas-habitacion")
        .set("Authorization", `Bearer ${cliente1.token}`)
        .send({
          habitacion_id: hotel.habitacion.id,
          fecha_entrada: "2027-12-10",
          fecha_salida: "2027-12-12",
          numero_huespedes: 2,
        });

      expect(postRes.status).toBe(201);
      const reservaId = postRes.body.data.id;

      // cliente2 intenta acceder
      const resOtro = await request(app)
        .get(`/api/reservas-habitacion/${reservaId}`)
        .set("Authorization", `Bearer ${cliente2.token}`);

      expect(resOtro.status).toBe(403);
      expect(resOtro.body.code).toBe("INSUFFICIENT_PERMISSIONS");
    });

    it("búsqueda de disponibilidad seguida de reserva concurrente mantiene la protección transaccional de POST", async () => {
      const hotel = await createHotelFixture();
      const userA = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      const userB = await createAuthenticatedUser({ rol: ROLES.CLIENTE });

      // Ambos consultan disponibilidad y ven la habitación disponible
      const dispA = await request(app)
        .get("/api/habitaciones/disponibles")
        .set("Authorization", `Bearer ${userA.token}`)
        .query({
          sucursal_id: hotel.sucursal.id,
          fecha_entrada: "2027-12-15",
          fecha_salida: "2027-12-20",
          numero_huespedes: 2,
        });
      expect(dispA.body.data.map((h: any) => h.id)).toContain(hotel.habitacion.id);

      // Ambos intentan crear la reserva concurrentemente en POST
      const [res1, res2] = await Promise.all([
        request(app)
          .post("/api/reservas-habitacion")
          .set("Authorization", `Bearer ${userA.token}`)
          .send({
            habitacion_id: hotel.habitacion.id,
            fecha_entrada: "2027-12-15",
            fecha_salida: "2027-12-20",
            numero_huespedes: 2,
          }),
        request(app)
          .post("/api/reservas-habitacion")
          .set("Authorization", `Bearer ${userB.token}`)
          .send({
            habitacion_id: hotel.habitacion.id,
            fecha_entrada: "2027-12-15",
            fecha_salida: "2027-12-20",
            numero_huespedes: 2,
          }),
      ]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([201, 409]);
    });
  });
});
