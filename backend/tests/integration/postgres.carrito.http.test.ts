import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { createIsolatedTestDatabase, TestDatabase } from "./testDatabase";
import { generateAccessToken } from "../../src/utils/jwt";

describe("HTTP Carrito & CarritoItems contract in isolated PostgreSQL (hotel_test_db)", () => {
  let database: TestDatabase;
  let app: (typeof import("../../src/app"))["default"];
  let clientToken: string;
  let otherClientToken: string;
  let clientUserId: number;
  let otherUserId: number;
  let branchId: number;
  let roomTypeId: number;
  let roomId: number;
  let testReservaId: number;
  let otherReservaId: number;

  beforeAll(async () => {
    database = await createIsolatedTestDatabase();
    ({ default: app } = await import("../../src/app"));

    const passwordHash = await bcrypt.hash("CarritoTest123!", 4);

    // Cliente propietario
    const clientUser = await database.Usuario.create({
      nombre: "Cliente Carrito QA",
      email: `cliente-carrito-${Date.now()}@hoteltest.test`,
      password_hash: passwordHash,
      rol: "cliente",
      activo: true,
    });
    clientUserId = clientUser.id;
    clientToken = generateAccessToken(clientUser);

    // Otro cliente (para pruebas de propiedad)
    const otherUser = await database.Usuario.create({
      nombre: "Otro Cliente QA",
      email: `otro-carrito-${Date.now()}@hoteltest.test`,
      password_hash: passwordHash,
      rol: "cliente",
      activo: true,
    });
    otherUserId = otherUser.id;
    otherToken = generateAccessToken(otherUser);

    // Sede, tipo y habitación
    const branch = await database.Sucursal.create({
      nombre: `Sucursal Carrito ${Date.now()}`,
      direccion: "Calle 10",
      ciudad: "Antigua Guatemala",
      activa: true,
    });
    branchId = branch.id;

    const roomType = await database.TipoHabitacion.create({
      nombre: "Deluxe Carrito",
      capacidad_maxima: 2,
      tarifa_noche: 350.0,
      descripcion: "Habitación para prueba de carrito",
      activa: true,
    });
    roomTypeId = roomType.id;

    const room = await database.Habitacion.create({
      sucursal_id: branchId,
      tipo_habitacion_id: roomTypeId,
      numero: `C-${Date.now().toString().slice(-4)}`,
      estado: "disponible",
      activa: true,
    });
    roomId = room.id;

    // Reserva del cliente propietario
    const reserva = await database.ReservaHabitacion.create({
      usuario_id: clientUserId,
      habitacion_id: roomId,
      fecha_entrada: "2026-11-10",
      fecha_salida: "2026-11-12",
      numero_huespedes: 2,
      total: 700.0,
      estado: "pendiente",
    });
    testReservaId = reserva.id;

    // Reserva de otro cliente
    const otherReserva = await database.ReservaHabitacion.create({
      usuario_id: otherUserId,
      habitacion_id: roomId,
      fecha_entrada: "2026-12-01",
      fecha_salida: "2026-12-03",
      numero_huespedes: 2,
      total: 700.0,
      estado: "pendiente",
    });
    otherReservaId = otherReserva.id;
  });

  let otherToken: string;
  let activeCartId: number;
  let createdItemId: number;

  it("POST /api/carritos crea un carrito activo y devuelve el envoltorio estándar", async () => {
    const res = await request(app)
      .post("/api/carritos")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.statusCode).toBe(201);
    expect(res.body.message).toContain("Carrito creado");
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.usuario_id).toBe(clientUserId);
    expect(res.body.data.estado).toBe("activo");
    expect(res.body.data.expira_en).toBeDefined();
    expect(res.body.data.createdAt).toBeDefined();
    expect(res.body.data.updatedAt).toBeDefined();

    activeCartId = res.body.data.id;
  });

  it("GET /api/carritos/actual obtiene el carrito activo con el envoltorio estándar", async () => {
    const res = await request(app)
      .get("/api/carritos/actual")
      .set("Authorization", `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.statusCode).toBe(200);
    expect(res.body.data.id).toBe(activeCartId);
    expect(res.body.data.estado).toBe("activo");
  });

  it("POST /api/carritos rechaza crear un segundo carrito activo con HTTP 409", async () => {
    const res = await request(app)
      .post("/api/carritos")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({});

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe("CART_ALREADY_ACTIVE");
  });

  it("POST /api/carritos/:carritoId/items rechaza añadir reserva ajena con HTTP 403", async () => {
    const res = await request(app)
      .post(`/api/carritos/${activeCartId}/items`)
      .set("Authorization", `Bearer ${clientToken}`)
      .send({
        tipo_item: "habitacion",
        referencia_id: otherReservaId,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe("CART_REFERENCE_NOT_OWNED");
  });

  it("POST /api/carritos/:carritoId/items añade la reserva propia con precio y cantidad", async () => {
    const res = await request(app)
      .post(`/api/carritos/${activeCartId}/items`)
      .set("Authorization", `Bearer ${clientToken}`)
      .send({
        tipo_item: "habitacion",
        referencia_id: testReservaId,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.statusCode).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.carrito_id).toBe(activeCartId);
    expect(res.body.data.tipo_item).toBe("habitacion");
    expect(res.body.data.referencia_id).toBe(testReservaId);
    expect(Number(res.body.data.precio)).toBe(700);
    expect(res.body.data.cantidad).toBe(1);
    expect(res.body.data.descripcion).toBeDefined();

    createdItemId = res.body.data.id;
  });

  it("POST /api/carritos/:carritoId/items rechaza duplicar la reserva en el carrito con HTTP 409", async () => {
    const res = await request(app)
      .post(`/api/carritos/${activeCartId}/items`)
      .set("Authorization", `Bearer ${clientToken}`)
      .send({
        tipo_item: "habitacion",
        referencia_id: testReservaId,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe("CART_ITEM_ALREADY_EXISTS");
  });

  it("GET /api/carritos/:carritoId/items lista los ítems y devuelve el total calculado por el backend", async () => {
    const res = await request(app)
      .get(`/api/carritos/${activeCartId}/items`)
      .set("Authorization", `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].id).toBe(createdItemId);
    expect(Number(res.body.data.items[0].precio)).toBe(700);
    expect(res.body.data.items[0].cantidad).toBe(1);
    expect(res.body.data.total).toBe(700);
  });

  it("DELETE /api/carritos/:carritoId/items/:id retira el ítem con HTTP 204 y conserva la reserva", async () => {
    const res = await request(app)
      .delete(`/api/carritos/${activeCartId}/items/${createdItemId}`)
      .set("Authorization", `Bearer ${clientToken}`);

    expect(res.status).toBe(204);
    expect(res.text).toBe("");

    // Verificación crítica: la reserva en ReservaHabitacion debe continuar existiendo y seguir pendiente
    const reservaDb = await database.ReservaHabitacion.findByPk(testReservaId);
    expect(reservaDb).not.toBeNull();
    expect(reservaDb?.estado).toBe("pendiente");
  });

  it("GET /api/carritos/:carritoId/items refleja el carrito vacío con total 0", async () => {
    const res = await request(app)
      .get(`/api/carritos/${activeCartId}/items`)
      .set("Authorization", `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(0);
    expect(res.body.data.total).toBe(0);
  });
});
