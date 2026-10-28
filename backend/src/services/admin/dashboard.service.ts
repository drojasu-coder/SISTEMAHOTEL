import { Op, Transaction } from "sequelize";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { getSedeScope, sedeWhere, ScopeRequester } from "../../utils/sedeScope";

const { sequelize, Habitacion, TipoHabitacion, Sucursal, ReservaHabitacion } = require("../../models");

export interface DashboardFilter {
  sucursal_id?: number;
  vista?: "alcance";
}

const hotelToday = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: env.APP_TIMEZONE || "America/Guatemala",
  year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());

/** Authorized sites of the requester (utils/sedeScope); no inventory or reservations. */
async function authorizedSites(scope: Awaited<ReturnType<typeof getSedeScope>>) {
  return Sucursal.findAll({
    where: sedeWhere(scope, undefined, "id"),
    attributes: ["id", "nombre", "activa"], order: [["nombre", "ASC"]], raw: true,
  });
}

/** Site options for the panel's global selector, for every staff role with a panel. */
export async function getAdminScope(requester: ScopeRequester) {
  const scope = await getSedeScope(requester);
  return { global: scope.global, sedes: await authorizedSites(scope) };
}

/** Uses the existing server-side scope; this does not grant or change any role. */
export async function getAdminDashboardData(filter: DashboardFilter, requester: ScopeRequester) {
  const scope = await getSedeScope(requester);
  const roomWhere = sedeWhere(scope, filter.sucursal_id);
  const sedes = await authorizedSites(scope);
  if (filter.sucursal_id && !sedes.some((site: any) => site.id === filter.sucursal_id)) {
    throw new AppError(404, "SUCURSAL_NOT_FOUND", "La sede seleccionada no existe");
  }
  const alcance = { global: scope.global, sedes };
  // The panel needs authoritative site options even when a site has no rooms or types.
  if (filter.vista === "alcance") return alcance;

  return sequelize.transaction({
    readOnly: true, isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
  }, async (transaction: Transaction) => {
    const today = hotelToday();
    const rooms = await Habitacion.findAll({
      where: roomWhere, attributes: ["id", "estado"], raw: true, transaction,
    });
    const countState = (state: string) => rooms.filter((room: any) => room.estado === state).length;
    const roomInclude = {
      model: Habitacion, required: true, where: roomWhere,
      attributes: ["id", "numero", "sucursal_id"],
      include: [
        { model: TipoHabitacion, attributes: ["id", "nombre"] },
        { model: Sucursal, attributes: ["id", "nombre"] },
      ],
    };
    const activeWhere = { estado: "confirmada", fecha_entrada: { [Op.lte]: today }, fecha_salida: { [Op.gt]: today } };
    const arrivalsWhere = { estado: "confirmada", fecha_entrada: today };
    const departuresWhere = { estado: "confirmada", fecha_salida: today };
    const pendingWhere = { estado: "pendiente" };
    const count = (where: Record<string | symbol, unknown>) => ReservaHabitacion.count({
      where, include: [roomInclude], transaction,
    });
    const activeRooms = await ReservaHabitacion.count({
      where: activeWhere, include: [roomInclude], distinct: true, col: "habitacion_id", transaction,
    });
    const arrivalsCount = await count(arrivalsWhere);
    const departuresCount = await count(departuresWhere);
    const pendingCount = await count(pendingWhere);
    const list = (where: Record<string, unknown> | undefined, order: [string, string][]) => ReservaHabitacion.findAll({
      where, include: [roomInclude], order, limit: 6, transaction,
      attributes: ["id", "fecha_entrada", "fecha_salida", "numero_huespedes", "estado", "createdAt", "updatedAt"],
    });
    const arrivals = await list(arrivalsWhere, [["id", "ASC"]]);
    const departures = await list(departuresWhere, [["id", "ASC"]]);
    const recent = await list(undefined, [["updatedAt", "DESC"], ["id", "DESC"]]);
    const pending = await list(pendingWhere, [["fecha_entrada", "ASC"], ["id", "ASC"]]);
    const normalize = (reservation: any) => ({
      id: reservation.id,
      habitacion_numero: reservation.Habitacion.numero,
      tipo_habitacion: reservation.Habitacion.TipoHabitacion.nombre,
      sucursal_id: reservation.Habitacion.sucursal_id,
      sucursal_nombre: reservation.Habitacion.Sucursal.nombre,
      fecha_entrada: reservation.fecha_entrada,
      fecha_salida: reservation.fecha_salida,
      numero_huespedes: reservation.numero_huespedes,
      estado: reservation.estado,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
    });
    const operational = {
      habitaciones_disponibles: countState("disponible"),
      habitaciones_ocupadas: countState("ocupada"),
      habitaciones_mantenimiento: countState("mantenimiento"),
      habitaciones_limpieza: countState("limpieza"),
    };
    const knownRooms = Object.values(operational).reduce((sum, value) => sum + value, 0);
    return {
      ...alcance, fecha_consulta: today, consultado_en: new Date().toISOString(),
      sucursal_filtro: filter.sucursal_id ?? null,
      resumen: {
        total_habitaciones: rooms.length, ...operational,
        habitaciones_otro_estado: rooms.length - knownRooms,
        // Confirmed room-nights today / current room inventory. Physical status is separate.
        porcentaje_ocupacion: rooms.length ? Number((activeRooms * 100 / rooms.length).toFixed(1)) : null,
        reservas_activas: activeRooms,
        llegadas_hoy: arrivalsCount, salidas_hoy: departuresCount, reservas_pendientes: pendingCount,
      },
      llegadas: arrivals.map(normalize),
      salidas: departures.map(normalize),
      reservas_recientes: recent.map(normalize),
      pendientes_atencion: pending.map((reservation: any) => ({
        tipo: "reserva_pendiente", id: reservation.id,
        habitacion_numero: reservation.Habitacion.numero,
        sucursal_nombre: reservation.Habitacion.Sucursal.nombre,
        fecha: reservation.fecha_entrada,
        link: "/admin/reservas/" + reservation.id,
      })),
    };
  });
}
