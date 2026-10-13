import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { createIsolatedTestDatabase, TestDatabase } from "./testDatabase";

describe("isolated PostgreSQL reservation baseline", () => {
  let database: TestDatabase;
  let roomService: typeof import("../../src/services/habitaciones/reservaHabitacion.service");
  let tableService: typeof import("../../src/services/restaurante/reservaMesa.service");
  let activityService: typeof import("../../src/services/actividades/reservaActividad.service");
  let userId: number;
  let roomId: number;
  let tableId: number;
  let resourceId: number;
  let instructorId: number;
  let roomTypeId: number;
  let branchId: number;
  const branchName = `Sucursal integración ${Date.now()}`;
  const reservationIds: Record<string, number[]> = {
    ReservaHabitacion: [],
    ReservaMesa: [],
    ReservaActividad: [],
  };

  beforeAll(async () => {
    database = await createIsolatedTestDatabase();
    roomService = await import("../../src/services/habitaciones/reservaHabitacion.service");
    tableService = await import("../../src/services/restaurante/reservaMesa.service");
    activityService = await import("../../src/services/actividades/reservaActividad.service");

    const branch = await database.Sucursal.create({
      nombre: branchName,
      direccion: "Prueba",
      ciudad: "Guatemala",
    });
    const roomType = await database.TipoHabitacion.create({
      nombre: "Tipo integración",
      capacidad_maxima: 4,
      tarifa_noche: 250,
      descripcion: "Fixture aislado",
    });
    const room = await database.Habitacion.create({
      sucursal_id: branch.id,
      tipo_habitacion_id: roomType.id,
      numero: "T-01",
      estado: "disponible",
    });
    const table = await database.Mesa.create({
      sucursal_id: branch.id,
      zona: "Interior",
      numero: "M-01",
      capacidad: 4,
      estado: "disponible",
    });
    const resource = await database.RecursoActividad.create({
      sucursal_id: branch.id,
      tipo: "cancha",
      nombre: "Recurso integración",
    });
    const instructor = await database.Instructor.create({
      nombre: "Instructor integración",
      especialidad: "Prueba",
      activo: true,
    });
    const user = await database.Usuario.create({
      nombre: "Usuario integración",
      email: `integration-${Date.now()}@example.com`,
      password_hash: "not-used-by-service-test",
      rol: "cliente",
      activo: true,
    });

    userId = user.id;
    roomId = room.id;
    tableId = table.id;
    resourceId = resource.id;
    instructorId = instructor.id;
    roomTypeId = roomType.id;
    branchId = branch.id;
  });

  afterAll(async () => {
    for (const [modelName, ids] of Object.entries(reservationIds)) {
      for (const id of ids) {
        await database[modelName].destroy({ where: { id }, force: true });
      }
    }
    await database.Instructor.destroy({ where: { id: instructorId }, force: true });
    await database.RecursoActividad.destroy({ where: { id: resourceId }, force: true });
    await database.Mesa.destroy({ where: { id: tableId }, force: true });
    await database.Habitacion.destroy({ where: { sucursal_id: branchId }, force: true });
    await database.TipoHabitacion.destroy({ where: { id: roomTypeId }, force: true });
    await database.Usuario.destroy({ where: { id: userId }, force: true });
    await database.Sucursal.destroy({ where: { id: branchId }, force: true });
    await database.sequelize.close();
  });

  it("persists a room reservation and rejects an overlapping interval", async () => {
    const first = await roomService.createReservaHabitacion({
      usuario_id: userId,
      habitacion_id: roomId,
      fecha_entrada: "2099-01-10",
      fecha_salida: "2099-01-12",
      numero_huespedes: 2,
    });

    expect(first.id).toBeGreaterThan(0);
    reservationIds.ReservaHabitacion.push(first.id);
    await expect(roomService.createReservaHabitacion({
      usuario_id: userId,
      habitacion_id: roomId,
      fecha_entrada: "2099-01-11",
      fecha_salida: "2099-01-13",
      numero_huespedes: 2,
    })).rejects.toMatchObject({ statusCode: 409 });
  });

  it("allows an adjacent room interval according to the current service rule", async () => {
    const adjacent = await roomService.createReservaHabitacion({
      usuario_id: userId,
      habitacion_id: roomId,
      fecha_entrada: "2099-01-12",
      fecha_salida: "2099-01-14",
      numero_huespedes: 2,
    });

    expect(adjacent.id).toBeGreaterThan(0);
    reservationIds.ReservaHabitacion.push(adjacent.id);
  });

  it("persists a table reservation and rejects the same slot", async () => {
    const first = await tableService.create({
      usuario_id: userId,
      mesa_id: tableId,
      fecha: "2099-02-10",
      hora: "20:00",
      numero_comensales: 2,
    });

    expect(first.id).toBeGreaterThan(0);
    reservationIds.ReservaMesa.push(first.id);
    await expect(tableService.create({
      usuario_id: userId,
      mesa_id: tableId,
      fecha: "2099-02-10",
      hora: "20:00",
      numero_comensales: 2,
    })).rejects.toMatchObject({ statusCode: 409 });
  });

  it("persists an activity reservation and rejects a resource overlap", async () => {
    const first = await activityService.create({
      usuario_id: userId,
      recurso_id: resourceId,
      instructor_id: instructorId,
      fecha: "2099-03-10",
      hora_inicio: "10:00",
      hora_fin: "11:00",
    });

    expect(first.id).toBeGreaterThan(0);
    reservationIds.ReservaActividad.push(first.id);
    await expect(activityService.create({
      usuario_id: userId,
      recurso_id: resourceId,
      instructor_id: instructorId,
      fecha: "2099-03-10",
      hora_inicio: "10:30",
      hora_fin: "11:30",
    })).rejects.toMatchObject({ statusCode: 409 });
  });

  it("protects a room slot when two independent requests arrive concurrently", async () => {
    const concurrentRoom = await database.Habitacion.create({
      sucursal_id: branchId,
      tipo_habitacion_id: roomTypeId,
      numero: `C${String(Date.now()).slice(-8)}`,
      estado: "disponible",
    });
    const attempts = [
      roomService.createReservaHabitacion({
        usuario_id: userId,
        habitacion_id: concurrentRoom.id,
        fecha_entrada: "2099-06-10",
        fecha_salida: "2099-06-12",
        numero_huespedes: 1,
      }),
      roomService.createReservaHabitacion({
        usuario_id: userId,
        habitacion_id: concurrentRoom.id,
        fecha_entrada: "2099-06-10",
        fecha_salida: "2099-06-12",
        numero_huespedes: 1,
      }),
    ];
    const results = await Promise.race([
      Promise.allSettled(attempts),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("ROOM_CONCURRENCY_TIMEOUT")), 5_000),
      ),
    ]);
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    const persisted = await database.ReservaHabitacion.findAll({
      where: { habitacion_id: concurrentRoom.id },
    });
    await database.ReservaHabitacion.destroy({
      where: { habitacion_id: concurrentRoom.id },
      force: true,
    });
    await database.Habitacion.destroy({ where: { id: concurrentRoom.id }, force: true });
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(persisted).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({
      statusCode: 409,
      code: "HABITACION_NO_DISPONIBLE",
    });
  }, 10_000);

  it("serializes three concurrent requests for one room", async () => {
    const concurrentRoom = await database.Habitacion.create({
      sucursal_id: branchId,
      tipo_habitacion_id: roomTypeId,
      numero: `T${String(Date.now()).slice(-8)}`,
      estado: "disponible",
    });
    const results = await Promise.race([
      Promise.allSettled([1, 2, 3].map(() =>
        roomService.createReservaHabitacion({
          usuario_id: userId,
          habitacion_id: concurrentRoom.id,
          fecha_entrada: "2099-08-10",
          fecha_salida: "2099-08-12",
          numero_huespedes: 1,
        }),
      )),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("ROOM_CONCURRENCY_TIMEOUT")), 5_000),
      ),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.filter((result) => result.status === "rejected");
    expect(rejected).toHaveLength(2);
    expect(rejected.every((result) =>
      (result as PromiseRejectedResult).reason?.statusCode === 409 &&
      (result as PromiseRejectedResult).reason?.code === "HABITACION_NO_DISPONIBLE"
    )).toBe(true);
    expect(await database.ReservaHabitacion.count({
      where: { habitacion_id: concurrentRoom.id },
    })).toBe(1);
    await database.ReservaHabitacion.destroy({
      where: { habitacion_id: concurrentRoom.id },
      force: true,
    });
    await database.Habitacion.destroy({ where: { id: concurrentRoom.id }, force: true });
  }, 10_000);

  it("does not serialize reservations for different rooms", async () => {
    const rooms = await database.Habitacion.bulkCreate([
      {
        sucursal_id: branchId,
        tipo_habitacion_id: roomTypeId,
        numero: `D${String(Date.now()).slice(-7)}A`,
        estado: "disponible",
      },
      {
        sucursal_id: branchId,
        tipo_habitacion_id: roomTypeId,
        numero: `D${String(Date.now()).slice(-7)}B`,
        estado: "disponible",
      },
    ]);
    const results = await Promise.all([
      roomService.createReservaHabitacion({
        usuario_id: userId,
        habitacion_id: rooms[0].id,
        fecha_entrada: "2099-09-10",
        fecha_salida: "2099-09-12",
        numero_huespedes: 1,
      }),
      roomService.createReservaHabitacion({
        usuario_id: userId,
        habitacion_id: rooms[1].id,
        fecha_entrada: "2099-09-10",
        fecha_salida: "2099-09-12",
        numero_huespedes: 1,
      }),
    ]);
    expect(results).toHaveLength(2);
    await database.ReservaHabitacion.destroy({
      where: { habitacion_id: rooms.map((room) => room.id) },
      force: true,
    });
    await database.Habitacion.destroy({
      where: { id: rooms.map((room) => room.id) },
      force: true,
    });
  });

  it("allows a new reservation after cancellation and rolls back rejected inserts", async () => {
    const first = await roomService.createReservaHabitacion({
      usuario_id: userId,
      habitacion_id: roomId,
      fecha_entrada: "2099-10-10",
      fecha_salida: "2099-10-12",
      numero_huespedes: 1,
    });
    await roomService.deleteReservaHabitacion(first.id);
    expect((await database.ReservaHabitacion.findByPk(first.id)).estado).toBe("cancelada");

    const replacement = await roomService.createReservaHabitacion({
      usuario_id: userId,
      habitacion_id: roomId,
      fecha_entrada: "2099-10-10",
      fecha_salida: "2099-10-12",
      numero_huespedes: 1,
    });
    expect(await database.ReservaHabitacion.count({
      where: { habitacion_id: roomId, fecha_entrada: "2099-10-10" },
    })).toBe(2);
    await expect(roomService.createReservaHabitacion({
      usuario_id: userId,
      habitacion_id: roomId,
      fecha_entrada: "2099-10-10",
      fecha_salida: "2099-10-12",
      numero_huespedes: 5,
    })).rejects.toMatchObject({ statusCode: 422 });
    expect(await database.ReservaHabitacion.findByPk(replacement.id)).not.toBeNull();
    reservationIds.ReservaHabitacion.push(first.id, replacement.id);
  });
});
