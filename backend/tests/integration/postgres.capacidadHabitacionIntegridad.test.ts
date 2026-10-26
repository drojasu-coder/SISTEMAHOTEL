import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { createIsolatedTestDatabase, TestDatabase } from "./testDatabase";
import { generateAccessToken } from "../../src/utils/jwt";
import { getTodayDate } from "../../src/services/habitaciones/reservaHabitacion.service";

describe("Integridad de Capacidades y Tipos de Habitación (PostgreSQL Aislado)", () => {
  let database: TestDatabase;
  let app: (typeof import("../../src/app"))["default"];
  let adminToken: string;
  let clientToken: string;
  let adminUserId: number;
  let clientUserId: number;
  let sucursalId: number;

  const today = getTodayDate();
  // Fechas futuras
  const d = new Date();
  d.setDate(d.getDate() + 10);
  const futureEntry = d.toISOString().slice(0, 10);
  d.setDate(d.getDate() + 4);
  const futureExit = d.toISOString().slice(0, 10);

  // Estancia en curso: check-in ayer o hace 2 días, check-out en 3 días
  const dInPast = new Date();
  dInPast.setDate(dInPast.getDate() - 2);
  const currentStayEntry = dInPast.toISOString().slice(0, 10);
  const dInFuture = new Date();
  dInFuture.setDate(dInFuture.getDate() + 3);
  const currentStayExit = dInFuture.toISOString().slice(0, 10);

  // Estancia finalizada en el pasado: check-in hace 10 días, check-out ayer
  const dOldIn = new Date();
  dOldIn.setDate(dOldIn.getDate() - 10);
  const pastEntry = dOldIn.toISOString().slice(0, 10);
  const dOldOut = new Date();
  dOldOut.setDate(dOldOut.getDate() - 2);
  const pastExit = dOldOut.toISOString().slice(0, 10);

  beforeAll(async () => {
    database = await createIsolatedTestDatabase();
    ({ default: app } = await import("../../src/app"));

    const passwordHash = await bcrypt.hash("CapacidadTest123!", 4);

    const adminUser = await database.Usuario.create({
      nombre: "Admin Integridad Capacidad",
      email: `admin-cap-${Date.now()}@hoteltest.test`,
      password_hash: passwordHash,
      rol: "admin",
      activo: true,
    });
    adminUserId = adminUser.id;
    adminToken = generateAccessToken(adminUser);

    const clientUser = await database.Usuario.create({
      nombre: "Cliente Integridad Capacidad",
      email: `cliente-cap-${Date.now()}@hoteltest.test`,
      password_hash: passwordHash,
      rol: "cliente",
      activo: true,
    });
    clientUserId = clientUser.id;
    clientToken = generateAccessToken(clientUser);

    const sucursal = await database.Sucursal.create({
      nombre: `Sede QA Capacidades ${Date.now()}`,
      ciudad: "Guatemala",
      activa: true,
    });
    sucursalId = sucursal.id;
  });

  afterAll(async () => {
    try {
      if (adminUserId) {
        await database.Usuario.destroy({ where: { id: adminUserId }, force: true });
      }
      if (clientUserId) {
        await database.Usuario.destroy({ where: { id: clientUserId }, force: true });
      }
      if (sucursalId) {
        await database.Sucursal.destroy({ where: { id: sucursalId }, force: true });
      }
    } finally {
      await database.sequelize.close();
    }
  });

  it("1. Rechaza reducir capacidad_maxima si existe una reserva PENDIENTE futura con más huéspedes (409)", async () => {
    const tipo = await database.TipoHabitacion.create({
      nombre: `Tipo Suite QA-1 ${Date.now()}`,
      capacidad_maxima: 4,
      tarifa_noche: 1000,
    });

    const hab = await database.Habitacion.create({
      sucursal_id: sucursalId,
      tipo_habitacion_id: tipo.id,
      numero: `S1-${Date.now().toString().slice(-4)}`,
      estado: "disponible",
    });

    const reserva = await database.ReservaHabitacion.create({
      usuario_id: clientUserId,
      habitacion_id: hab.id,
      fecha_entrada: futureEntry,
      fecha_salida: futureExit,
      numero_huespedes: 4,
      estado: "pendiente",
      total: 4000,
    });

    // Intento de reducir capacidad a 2
    const res = await request(app)
      .patch(`/api/tipos-habitacion/${tipo.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ capacidad_maxima: 2 });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("CAPACITY_REDUCTION_CONFLICT");
    expect(res.body.message).toMatch(/existen reservas activas.*4 huéspedes/i);

    // Verificar conservación de datos
    const reloadedTipo = await database.TipoHabitacion.findByPk(tipo.id);
    expect(reloadedTipo.capacidad_maxima).toBe(4);

    const reloadedReserva = await database.ReservaHabitacion.findByPk(reserva.id);
    expect(reloadedReserva.numero_huespedes).toBe(4);
    expect(Number(reloadedReserva.total)).toBe(4000);

    // Limpieza
    await reserva.destroy({ force: true });
    await hab.destroy({ force: true });
    await tipo.destroy({ force: true });
  });

  it("2. Rechaza reducir capacidad_maxima si existe una reserva CONFIRMADA futura con más huéspedes (409)", async () => {
    const tipo = await database.TipoHabitacion.create({
      nombre: `Tipo Suite QA-2 ${Date.now()}`,
      capacidad_maxima: 3,
      tarifa_noche: 800,
    });

    const hab = await database.Habitacion.create({
      sucursal_id: sucursalId,
      tipo_habitacion_id: tipo.id,
      numero: `S2-${Date.now().toString().slice(-4)}`,
      estado: "disponible",
    });

    const reserva = await database.ReservaHabitacion.create({
      usuario_id: clientUserId,
      habitacion_id: hab.id,
      fecha_entrada: futureEntry,
      fecha_salida: futureExit,
      numero_huespedes: 3,
      estado: "confirmada",
      total: 3200,
    });

    const res = await request(app)
      .patch(`/api/tipos-habitacion/${tipo.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ capacidad_maxima: 2 });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("CAPACITY_REDUCTION_CONFLICT");

    const reloadedTipo = await database.TipoHabitacion.findByPk(tipo.id);
    expect(reloadedTipo.capacidad_maxima).toBe(3);

    await reserva.destroy({ force: true });
    await hab.destroy({ force: true });
    await tipo.destroy({ force: true });
  });

  it("3. Protege ESTANCIAS EN CURSO (check-in en pasado y check-out en futuro) ante reducción de capacidad (409)", async () => {
    const tipo = await database.TipoHabitacion.create({
      nombre: `Tipo Suite QA-3 ${Date.now()}`,
      capacidad_maxima: 4,
      tarifa_noche: 900,
    });

    const hab = await database.Habitacion.create({
      sucursal_id: sucursalId,
      tipo_habitacion_id: tipo.id,
      numero: `S3-${Date.now().toString().slice(-4)}`,
      estado: "ocupada",
    });

    const reservaEnCurso = await database.ReservaHabitacion.create({
      usuario_id: clientUserId,
      habitacion_id: hab.id,
      fecha_entrada: currentStayEntry,
      fecha_salida: currentStayExit,
      numero_huespedes: 4,
      estado: "confirmada",
      total: 4500,
    });

    const res = await request(app)
      .patch(`/api/tipos-habitacion/${tipo.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ capacidad_maxima: 3 });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("CAPACITY_REDUCTION_CONFLICT");

    await reservaEnCurso.destroy({ force: true });
    await hab.destroy({ force: true });
    await tipo.destroy({ force: true });
  });

  it("4. Permite reducir capacidad si las reservas activas caben dentro del nuevo límite (200 OK)", async () => {
    const tipo = await database.TipoHabitacion.create({
      nombre: `Tipo Suite QA-4 ${Date.now()}`,
      capacidad_maxima: 4,
      tarifa_noche: 900,
    });

    const hab = await database.Habitacion.create({
      sucursal_id: sucursalId,
      tipo_habitacion_id: tipo.id,
      numero: `S4-${Date.now().toString().slice(-4)}`,
      estado: "disponible",
    });

    // Reserva con 2 huéspedes (cabe si se reduce a 2)
    const reserva = await database.ReservaHabitacion.create({
      usuario_id: clientUserId,
      habitacion_id: hab.id,
      fecha_entrada: futureEntry,
      fecha_salida: futureExit,
      numero_huespedes: 2,
      estado: "confirmada",
      total: 3600,
    });

    const res = await request(app)
      .patch(`/api/tipos-habitacion/${tipo.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ capacidad_maxima: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data.capacidad_maxima).toBe(2);

    await reserva.destroy({ force: true });
    await hab.destroy({ force: true });
    await tipo.destroy({ force: true });
  });

  it("5. Reservas canceladas, finalizadas o pasadas con mayor cantidad de huéspedes NO bloquean la reducción (200 OK)", async () => {
    const tipo = await database.TipoHabitacion.create({
      nombre: `Tipo Suite QA-5 ${Date.now()}`,
      capacidad_maxima: 4,
      tarifa_noche: 900,
    });

    const hab = await database.Habitacion.create({
      sucursal_id: sucursalId,
      tipo_habitacion_id: tipo.id,
      numero: `S5-${Date.now().toString().slice(-4)}`,
      estado: "disponible",
    });

    // 1. Reserva cancelada con 4 huéspedes
    const reservaCancelada = await database.ReservaHabitacion.create({
      usuario_id: clientUserId,
      habitacion_id: hab.id,
      fecha_entrada: futureEntry,
      fecha_salida: futureExit,
      numero_huespedes: 4,
      estado: "cancelada",
      total: 3600,
    });

    // 2. Reserva pasada finalizada con 4 huéspedes
    const reservaPasada = await database.ReservaHabitacion.create({
      usuario_id: clientUserId,
      habitacion_id: hab.id,
      fecha_entrada: pastEntry,
      fecha_salida: pastExit,
      numero_huespedes: 4,
      estado: "finalizada",
      total: 3600,
    });

    const res = await request(app)
      .patch(`/api/tipos-habitacion/${tipo.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ capacidad_maxima: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data.capacidad_maxima).toBe(2);

    await reservaCancelada.destroy({ force: true });
    await reservaPasada.destroy({ force: true });
    await hab.destroy({ force: true });
    await tipo.destroy({ force: true });
  });

  it("6. Rechaza cambio de tipo de una habitación si sus reservas activas superan la capacidad del nuevo tipo (409)", async () => {
    const tipoSuite = await database.TipoHabitacion.create({
      nombre: `Suite Original QA-6 ${Date.now()}`,
      capacidad_maxima: 4,
      tarifa_noche: 1200,
    });

    const tipoIndividual = await database.TipoHabitacion.create({
      nombre: `Individual Destino QA-6 ${Date.now()}`,
      capacidad_maxima: 1,
      tarifa_noche: 500,
    });

    const hab = await database.Habitacion.create({
      sucursal_id: sucursalId,
      tipo_habitacion_id: tipoSuite.id,
      numero: `H6-${Date.now().toString().slice(-4)}`,
      estado: "disponible",
    });

    // Reserva con 3 personas
    const reservaActiva = await database.ReservaHabitacion.create({
      usuario_id: clientUserId,
      habitacion_id: hab.id,
      fecha_entrada: futureEntry,
      fecha_salida: futureExit,
      numero_huespedes: 3,
      estado: "confirmada",
      total: 4800,
    });

    // Intento de reasignar la habitación al tipo Individual (capacidad 1)
    const res = await request(app)
      .patch(`/api/habitaciones/${hab.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ tipo_habitacion_id: tipoIndividual.id });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("ROOM_TYPE_CHANGE_CAPACITY_CONFLICT");
    expect(res.body.message).toMatch(/reservas activas con 3 huéspedes/i);

    // Comprobar que conserva el tipo original
    const reloadedHab = await database.Habitacion.findByPk(hab.id);
    expect(reloadedHab.tipo_habitacion_id).toBe(tipoSuite.id);

    await reservaActiva.destroy({ force: true });
    await hab.destroy({ force: true });
    await tipoSuite.destroy({ force: true });
    await tipoIndividual.destroy({ force: true });
  });

  it("7. Permite cambio de tipo de una habitación cuando sus reservas activas no superan la capacidad de destino (200 OK)", async () => {
    const tipoOriginal = await database.TipoHabitacion.create({
      nombre: `Tipo Original QA-7 ${Date.now()}`,
      capacidad_maxima: 2,
      tarifa_noche: 600,
    });

    const tipoDestino = await database.TipoHabitacion.create({
      nombre: `Tipo Destino QA-7 ${Date.now()}`,
      capacidad_maxima: 4,
      tarifa_noche: 1100,
    });

    const hab = await database.Habitacion.create({
      sucursal_id: sucursalId,
      tipo_habitacion_id: tipoOriginal.id,
      numero: `H7-${Date.now().toString().slice(-4)}`,
      estado: "disponible",
    });

    const reserva = await database.ReservaHabitacion.create({
      usuario_id: clientUserId,
      habitacion_id: hab.id,
      fecha_entrada: futureEntry,
      fecha_salida: futureExit,
      numero_huespedes: 2,
      estado: "confirmada",
      total: 2400,
    });

    const res = await request(app)
      .patch(`/api/habitaciones/${hab.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ tipo_habitacion_id: tipoDestino.id });

    expect(res.status).toBe(200);
    expect(res.body.data.tipo_habitacion_id).toBe(tipoDestino.id);

    await reserva.destroy({ force: true });
    await hab.destroy({ force: true });
    await tipoOriginal.destroy({ force: true });
    await tipoDestino.destroy({ force: true });
  });

  it("8. Concurrencia: reducción de capacidad compite contra creación de reserva y se mantiene la consistencia", async () => {
    const tipoConcurrente = await database.TipoHabitacion.create({
      nombre: `Tipo Concurrente QA-8 ${Date.now()}`,
      capacidad_maxima: 4,
      tarifa_noche: 800,
    });

    const hab = await database.Habitacion.create({
      sucursal_id: sucursalId,
      tipo_habitacion_id: tipoConcurrente.id,
      numero: `C8-${Date.now().toString().slice(-4)}`,
      estado: "disponible",
    });

    // Lanzamos concurrentemente:
    // Petición A: cliente crea reserva para 4 personas
    // Petición B: admin reduce capacidad a 2
    const [resReserva, resUpdateTipo] = await Promise.all([
      request(app)
        .post("/api/reservas-habitacion")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({
          habitacion_id: hab.id,
          fecha_entrada: futureEntry,
          fecha_salida: futureExit,
          numero_huespedes: 4,
        }),
      request(app)
        .patch(`/api/tipos-habitacion/${tipoConcurrente.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ capacidad_maxima: 2 }),
    ]);

    // Evaluación del resultado concurrente:
    // Escenario 1: Ganó la reserva (201) -> La reducción de capacidad a 2 debió ser RECHAZADA (409 CAPACITY_REDUCTION_CONFLICT).
    // Escenario 2: Ganó la reducción de capacidad (200) -> La reserva para 4 debió ser RECHAZADA (422 CAPACIDAD_EXCEDIDA).
    // En ningún caso se permite que ambos triunfen simultáneamente dejando una reserva de 4 en un tipo de 2.
    const reservaExitosa = resReserva.status === 201;
    const reduccionExitosa = resUpdateTipo.status === 200;

    expect(reservaExitosa && reduccionExitosa).toBe(false);

    if (reservaExitosa) {
      expect(resUpdateTipo.status).toBe(409);
      expect(resUpdateTipo.body.code).toBe("CAPACITY_REDUCTION_CONFLICT");
    } else {
      expect(resReserva.status).toBe(422);
      expect(resReserva.body.code).toBe("CAPACIDAD_EXCEDIDA");
      expect(reduccionExitosa).toBe(true);
    }

    // Limpieza
    await database.ReservaHabitacion.destroy({ where: { habitacion_id: hab.id }, force: true });
    await hab.destroy({ force: true });
    await tipoConcurrente.destroy({ force: true });
  });
  it("9. Concurrencia con sincronización explícita: edición de reserva aumentando numero_huespedes compitiendo contra reducción de capacidad", async () => {
    const tipo = await database.TipoHabitacion.create({
      nombre: `Tipo Sync Edicion QA-9 ${Date.now()}`,
      capacidad_maxima: 4,
      tarifa_noche: 1000,
    });

    const hab = await database.Habitacion.create({
      sucursal_id: sucursalId,
      tipo_habitacion_id: tipo.id,
      numero: `E9-${Date.now().toString().slice(-4)}`,
      estado: "disponible",
    });

    const reserva = await database.ReservaHabitacion.create({
      usuario_id: clientUserId,
      habitacion_id: hab.id,
      fecha_entrada: futureEntry,
      fecha_salida: futureExit,
      numero_huespedes: 2,
      estado: "confirmada",
      total: 4000,
    });

    // Conexión 1: Transacción explícita que bloquea TipoHabitacion con LOCK.UPDATE
    const t1 = await database.sequelize.transaction();
    await database.TipoHabitacion.findByPk(tipo.id, {
      transaction: t1,
      lock: t1.LOCK.UPDATE,
    });

    // Conexión 2: Solicitud HTTP que intenta aumentar huéspedes de 2 a 4
    let httpFinished = false;
    const httpPromise = request(app)
      .patch(`/api/reservas-habitacion/${reserva.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ numero_huespedes: 4 })
      .then((res) => {
        httpFinished = true;
        return res;
      });

    // Demostrar sincronización y solapamiento real: la conexión 2 está bloqueada en Postgres
    await new Promise((r) => setTimeout(r, 60));
    expect(httpFinished).toBe(false);

    // Conexión 1 actualiza capacidad a 2 y confirma la transacción
    await database.TipoHabitacion.update(
      { capacidad_maxima: 2 },
      { where: { id: tipo.id }, transaction: t1 }
    );
    await t1.commit();

    // Conexión 2 se desbloquea en PostgreSQL, lee la nueva capacidad bajo lock y rechaza
    const res = await httpPromise;
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("CAPACIDAD_EXCEDIDA");

    // Aserciones de cierre: conservación de datos e importes
    const reloadedReserva = await database.ReservaHabitacion.findByPk(reserva.id);
    expect(reloadedReserva.numero_huespedes).toBe(2);
    expect(Number(reloadedReserva.total)).toBe(4000);

    const reloadedTipo = await database.TipoHabitacion.findByPk(tipo.id);
    expect(reloadedTipo.capacidad_maxima).toBe(2);

    // Limpieza
    await reserva.destroy({ force: true });
    await hab.destroy({ force: true });
    await tipo.destroy({ force: true });
  });

  it("10. Concurrencia con sincronización explícita: mover reserva a otra habitación compitiendo contra reducción de capacidad de la habitación destino", async () => {
    const tipoOrigen = await database.TipoHabitacion.create({
      nombre: `Tipo Origen QA-10 ${Date.now()}`,
      capacidad_maxima: 2,
      tarifa_noche: 500,
    });

    const tipoDestino = await database.TipoHabitacion.create({
      nombre: `Tipo Destino QA-10 ${Date.now()}`,
      capacidad_maxima: 4,
      tarifa_noche: 1000,
    });

    const habOrigen = await database.Habitacion.create({
      sucursal_id: sucursalId,
      tipo_habitacion_id: tipoOrigen.id,
      numero: `O10-${Date.now().toString().slice(-4)}`,
      estado: "disponible",
    });

    const habDestino = await database.Habitacion.create({
      sucursal_id: sucursalId,
      tipo_habitacion_id: tipoDestino.id,
      numero: `D10-${Date.now().toString().slice(-4)}`,
      estado: "disponible",
    });

    const reserva = await database.ReservaHabitacion.create({
      usuario_id: clientUserId,
      habitacion_id: habOrigen.id,
      fecha_entrada: futureEntry,
      fecha_salida: futureExit,
      numero_huespedes: 2,
      estado: "confirmada",
      total: 2000,
    });

    // Conexión 1: Bloquea tipoDestino con LOCK.UPDATE
    const t1 = await database.sequelize.transaction();
    await database.TipoHabitacion.findByPk(tipoDestino.id, {
      transaction: t1,
      lock: t1.LOCK.UPDATE,
    });

    // Conexión 2: Intenta reasignar reserva a habDestino y aumentar huéspedes a 4
    let httpFinished = false;
    const httpPromise = request(app)
      .patch(`/api/reservas-habitacion/${reserva.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        habitacion_id: habDestino.id,
        numero_huespedes: 4,
      })
      .then((res) => {
        httpFinished = true;
        return res;
      });

    // Comprobar que la conexión 2 está suspendida esperando el lock
    await new Promise((r) => setTimeout(r, 60));
    expect(httpFinished).toBe(false);

    // Conexión 1 reduce capacidad de tipoDestino a 2 y hace commit
    await database.TipoHabitacion.update(
      { capacidad_maxima: 2 },
      { where: { id: tipoDestino.id }, transaction: t1 }
    );
    await t1.commit();

    const res = await httpPromise;
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("CAPACIDAD_EXCEDIDA");

    // Aserciones de conservación
    const reloadedReserva = await database.ReservaHabitacion.findByPk(reserva.id);
    expect(reloadedReserva.habitacion_id).toBe(habOrigen.id);
    expect(reloadedReserva.numero_huespedes).toBe(2);
    expect(Number(reloadedReserva.total)).toBe(2000);

    // Limpieza
    await reserva.destroy({ force: true });
    await habOrigen.destroy({ force: true });
    await habDestino.destroy({ force: true });
    await tipoOrigen.destroy({ force: true });
    await tipoDestino.destroy({ force: true });
  });

  it("11. Concurrencia con sincronización explícita: reasignación de habitación a otro tipo compitiendo contra reducción de capacidad del tipo destino", async () => {
    const tipoOriginal = await database.TipoHabitacion.create({
      nombre: `Suite Hab QA-11 ${Date.now()}`,
      capacidad_maxima: 4,
      tarifa_noche: 1200,
    });

    const tipoDestino = await database.TipoHabitacion.create({
      nombre: `Destino Concurrente QA-11 ${Date.now()}`,
      capacidad_maxima: 4,
      tarifa_noche: 900,
    });

    const hab = await database.Habitacion.create({
      sucursal_id: sucursalId,
      tipo_habitacion_id: tipoOriginal.id,
      numero: `H11-${Date.now().toString().slice(-4)}`,
      estado: "disponible",
    });

    // Reserva activa para 3 personas en la habitación
    const reserva = await database.ReservaHabitacion.create({
      usuario_id: clientUserId,
      habitacion_id: hab.id,
      fecha_entrada: futureEntry,
      fecha_salida: futureExit,
      numero_huespedes: 3,
      estado: "confirmada",
      total: 4800,
    });

    // Conexión 1: Bloquea tipoDestino con LOCK.UPDATE para reducir su capacidad a 2
    const t1 = await database.sequelize.transaction();
    await database.TipoHabitacion.findByPk(tipoDestino.id, {
      transaction: t1,
      lock: t1.LOCK.UPDATE,
    });

    // Conexión 2: Admin intenta cambiar hab a tipoDestino (debe adquirir LOCK.SHARE en tipoDestino)
    let httpFinished = false;
    const httpPromise = request(app)
      .patch(`/api/habitaciones/${hab.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ tipo_habitacion_id: tipoDestino.id })
      .then((res) => {
        httpFinished = true;
        return res;
      });

    // Verificar que la petición HTTP queda bloqueada esperando en PostgreSQL
    await new Promise((r) => setTimeout(r, 60));
    expect(httpFinished).toBe(false);

    // Conexión 1 reduce la capacidad a 2 y confirma la transacción
    await database.TipoHabitacion.update(
      { capacidad_maxima: 2 },
      { where: { id: tipoDestino.id }, transaction: t1 }
    );
    await t1.commit();

    // Conexión 2 se desbloquea, lee capacidad 2 bajo lock, detecta la reserva activa de 3 huéspedes y rechaza
    const res = await httpPromise;
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("ROOM_TYPE_CHANGE_CAPACITY_CONFLICT");
    expect(res.body.message).toMatch(/reservas activas con 3 huéspedes/i);

    // Aserciones de conservación
    const reloadedHab = await database.Habitacion.findByPk(hab.id);
    expect(reloadedHab.tipo_habitacion_id).toBe(tipoOriginal.id);

    const reloadedReserva = await database.ReservaHabitacion.findByPk(reserva.id);
    expect(reloadedReserva.numero_huespedes).toBe(3);
    expect(Number(reloadedReserva.total)).toBe(4800);

    // Limpieza
    await reserva.destroy({ force: true });
    await hab.destroy({ force: true });
    await tipoOriginal.destroy({ force: true });
    await tipoDestino.destroy({ force: true });
  });

  it("12. Concurrencia con sincronización explícita: cambio de tipo de habitación compitiendo contra creación de reserva en dicha habitación", async () => {
    const tipoSuite = await database.TipoHabitacion.create({
      nombre: `Suite Inicial QA-12 ${Date.now()}`,
      capacidad_maxima: 4,
      tarifa_noche: 1000,
    });

    const tipoIndividual = await database.TipoHabitacion.create({
      nombre: `Individual Destino QA-12 ${Date.now()}`,
      capacidad_maxima: 1,
      tarifa_noche: 400,
    });

    const hab = await database.Habitacion.create({
      sucursal_id: sucursalId,
      tipo_habitacion_id: tipoSuite.id,
      numero: `H12-${Date.now().toString().slice(-4)}`,
      estado: "disponible",
    });

    // Conexión 1: Bloquea la habitación con LOCK.UPDATE para cambiar su tipo a Individual
    const t1 = await database.sequelize.transaction();
    await database.Habitacion.findByPk(hab.id, {
      transaction: t1,
      lock: t1.LOCK.UPDATE,
    });

    // Conexión 2: Cliente intenta reservar la habitación para 3 personas
    let httpFinished = false;
    const httpPromise = request(app)
      .post("/api/reservas-habitacion")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({
        habitacion_id: hab.id,
        fecha_entrada: futureEntry,
        fecha_salida: futureExit,
        numero_huespedes: 3,
      })
      .then((res) => {
        httpFinished = true;
        return res;
      });

    // Verificar que la creación de reserva está bloqueada en la habitación
    await new Promise((r) => setTimeout(r, 60));
    expect(httpFinished).toBe(false);

    // Conexión 1 actualiza la habitación a tipo Individual (capacidad 1) y confirma
    await database.Habitacion.update(
      { tipo_habitacion_id: tipoIndividual.id },
      { where: { id: hab.id }, transaction: t1 }
    );
    await t1.commit();

    // Conexión 2 se desbloquea, lee el nuevo tipo (capacidad 1) y rechaza la reserva
    const res = await httpPromise;
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("CAPACIDAD_EXCEDIDA");

    // Aserciones de conservación: ninguna reserva fue creada
    const reservasEnHab = await database.ReservaHabitacion.count({
      where: { habitacion_id: hab.id },
    });
    expect(reservasEnHab).toBe(0);

    const reloadedHab = await database.Habitacion.findByPk(hab.id);
    expect(reloadedHab.tipo_habitacion_id).toBe(tipoIndividual.id);

    // Limpieza
    await hab.destroy({ force: true });
    await tipoSuite.destroy({ force: true });
    await tipoIndividual.destroy({ force: true });
  });

  it("13. Reglas de estados terminales y fechas: expiradas, canceladas y checkout del día de hoy NO bloquean reducciones", async () => {
    const tipo = await database.TipoHabitacion.create({
      nombre: `Tipo Terminales QA-13 ${Date.now()}`,
      capacidad_maxima: 4,
      tarifa_noche: 900,
    });

    const hab = await database.Habitacion.create({
      sucursal_id: sucursalId,
      tipo_habitacion_id: tipo.id,
      numero: `T13-${Date.now().toString().slice(-4)}`,
      estado: "disponible",
    });

    // 1. Reserva expirada con 4 huéspedes (fechas futuras)
    const resExpirada = await database.ReservaHabitacion.create({
      usuario_id: clientUserId,
      habitacion_id: hab.id,
      fecha_entrada: futureEntry,
      fecha_salida: futureExit,
      numero_huespedes: 4,
      estado: "expirada",
      total: 3600,
    });

    // 2. Reserva cancelada con 4 huéspedes (fechas futuras)
    const resCancelada = await database.ReservaHabitacion.create({
      usuario_id: clientUserId,
      habitacion_id: hab.id,
      fecha_entrada: futureEntry,
      fecha_salida: futureExit,
      numero_huespedes: 4,
      estado: "cancelada",
      total: 3600,
    });

    // 3. Reserva con salida el día de hoy (checkout hoy: fecha_salida === today)
    const resSalidaHoy = await database.ReservaHabitacion.create({
      usuario_id: clientUserId,
      habitacion_id: hab.id,
      fecha_entrada: pastEntry,
      fecha_salida: today,
      numero_huespedes: 4,
      estado: "confirmada",
      total: 7200,
    });

    // Intento de reducir capacidad a 2: debe PERMITIRSE porque ninguna reserva activa tiene fecha_salida > today
    const res = await request(app)
      .patch(`/api/tipos-habitacion/${tipo.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ capacidad_maxima: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data.capacidad_maxima).toBe(2);

    // Aserciones de preservación
    const rExp = await database.ReservaHabitacion.findByPk(resExpirada.id);
    expect(rExp.estado).toBe("expirada");
    expect(Number(rExp.total)).toBe(3600);

    const rCanc = await database.ReservaHabitacion.findByPk(resCancelada.id);
    expect(rCanc.estado).toBe("cancelada");
    expect(Number(rCanc.total)).toBe(3600);

    const rHoy = await database.ReservaHabitacion.findByPk(resSalidaHoy.id);
    expect(rHoy.estado).toBe("confirmada");
    expect(Number(rHoy.total)).toBe(7200);

    // Limpieza
    await resExpirada.destroy({ force: true });
    await resCancelada.destroy({ force: true });
    await resSalidaHoy.destroy({ force: true });
    await hab.destroy({ force: true });
    await tipo.destroy({ force: true });
  });
});
