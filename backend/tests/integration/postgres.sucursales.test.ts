import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createIsolatedTestDatabase, TestDatabase } from "./testDatabase";

describe("isolated PostgreSQL sucursales module", () => {
  let database: TestDatabase;
  let sucursalService: typeof import("../../src/modules/sucursales/sucursal.service");
  const createdBranchIds: number[] = [];
  const createdRoomIds: number[] = [];
  const createdRoomTypeIds: number[] = [];

  beforeAll(async () => {
    database = await createIsolatedTestDatabase();
    sucursalService = await import("../../src/modules/sucursales/sucursal.service");
  });

  afterAll(async () => {
    await database.sequelize.close();
  });

  afterEach(async () => {
    for (const id of createdRoomIds.splice(0)) {
      await database.Habitacion.destroy({ where: { id }, force: true });
    }
    for (const id of createdRoomTypeIds.splice(0)) {
      await database.TipoHabitacion.destroy({ where: { id }, force: true });
    }
    for (const id of createdBranchIds.splice(0)) {
      await database.Sucursal.destroy({ where: { id }, force: true });
    }
  });

  it("keeps CRUD behavior and alphabetical listing", async () => {
    const created = await sucursalService.create({
      nombre: `Sucursal piloto ${Date.now()}`,
      direccion: "Prueba",
      ciudad: "Guatemala",
    });
    createdBranchIds.push(created.id);
    const updated = await sucursalService.update(created.id, {
      nombre: `${created.nombre} actualizada`,
    });
    const found = await sucursalService.getById(created.id);
    const all = await sucursalService.getAll();

    expect(updated.nombre).toContain("actualizada");
    expect(found.id).toBe(created.id);
    expect(all.map((item: { nombre: string }) => item.nombre)).toEqual(
      [...all.map((item: { nombre: string }) => item.nombre)].sort(),
    );

    await sucursalService.remove(created.id);
    await expect(sucursalService.getById(created.id)).rejects.toMatchObject({
      statusCode: 404,
      code: "BRANCH_NOT_FOUND",
    });
  });

  it("preserves the conflict when a branch has rooms", async () => {
    const branch = await sucursalService.create({
      nombre: `Sucursal ocupada ${Date.now()}`,
    });
    createdBranchIds.push(branch.id);
    const roomType = await database.TipoHabitacion.create({
      nombre: `Tipo ${Date.now()}`,
      capacidad_maxima: 2,
      tarifa_noche: 100,
    });
    createdRoomTypeIds.push(roomType.id);
    const room = await database.Habitacion.create({
      sucursal_id: branch.id,
      tipo_habitacion_id: roomType.id,
      numero: `P${Date.now() % 1000000}`,
      estado: "disponible",
    });
    createdRoomIds.push(room.id);

    await expect(sucursalService.remove(branch.id)).rejects.toMatchObject({
      statusCode: 409,
      code: "BRANCH_IN_USE",
    });

    await room.destroy({ force: true });
    createdRoomIds.splice(createdRoomIds.indexOf(room.id), 1);
    await roomType.destroy({ force: true });
    createdRoomTypeIds.splice(createdRoomTypeIds.indexOf(roomType.id), 1);
    await sucursalService.remove(branch.id);
    createdBranchIds.splice(createdBranchIds.indexOf(branch.id), 1);
  });
});
