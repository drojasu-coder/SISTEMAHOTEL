import { QueryTypes, Transaction } from "sequelize";
import { ROLES } from "../../constants/roles";
import { AppError } from "../../utils/AppError";
import { RequesterContext } from "../../utils/paymentOwnership";
import { assertHasSede, assertSedeAccess, getSedeScope } from "../../utils/sedeScope";
import { REPORT_AMOUNTS_NOTE, REPORT_CRITERION, RoomReportFilters, RoomReportRow, RoomReportSummary, RoomReservationsReport } from "./reportes.types";

const { sequelize, Sucursal } = require("../../models");
export const MAX_EXPORT_ROWS = 10000;

/** All predicates are applied in PostgreSQL. No customer identity or payment data is selected. */
export async function getRoomReservationsReport(filters: RoomReportFilters, requester: RequesterContext): Promise<RoomReservationsReport> {
  // Defense in depth for future callers outside the HTTP router.
  if (requester.rol !== ROLES.ADMIN) throw new AppError(403, "INSUFFICIENT_PERMISSIONS", "No tiene permisos para consultar este reporte");
  const scope = await getSedeScope(requester);
  assertHasSede(scope);
  if (filters.sucursal_id) assertSedeAccess(scope, filters.sucursal_id);

  return sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ, readOnly: true }, async (transaction: Transaction) => {
    let sede = "Todas las sedes autorizadas";
    if (filters.sucursal_id) {
      const selected = await Sucursal.findByPk(filters.sucursal_id, { attributes: ["nombre"], transaction });
      if (!selected) throw new AppError(404, "SEDE_NOT_FOUND", "La sede seleccionada no existe");
      sede = selected.nombre;
    }
    const replacements = {
      desde: filters.desde, hasta: filters.hasta, sucursal: filters.sucursal_id ?? null,
      estado: filters.estado ?? null, sedes: scope.global ? [] : scope.sucursalIds,
    };
    const from = `FROM reservas_habitacion r
      JOIN habitaciones h ON h.id = r.habitacion_id
      JOIN sucursales s ON s.id = h.sucursal_id
      JOIN tipos_habitacion t ON t.id = h.tipo_habitacion_id
      WHERE r.fecha_entrada <= CAST(:hasta AS date) AND r.fecha_salida > CAST(:desde AS date)
        AND (:sucursal IS NULL OR h.sucursal_id = :sucursal)
        AND (:estado IS NULL OR r.estado = :estado)
        AND ${scope.global ? "TRUE" : "h.sucursal_id IN (:sedes)"}`;
    const nights = "GREATEST(0, LEAST(r.fecha_salida, CAST(:hasta AS date) + 1) - GREATEST(r.fecha_entrada, CAST(:desde AS date)))";
    const [rawSummary] = await sequelize.query(`SELECT COUNT(*) AS reservas,
      COALESCE(SUM(r.numero_huespedes), 0) AS huespedes,
      COALESCE(SUM(${nights}), 0) AS noches_periodo,
      COALESCE(SUM(r.total), 0) AS importe_reservado,
      COUNT(*) FILTER (WHERE r.estado = 'cancelada') AS canceladas,
      COALESCE(SUM(r.total) FILTER (WHERE r.estado = 'cancelada'), 0) AS importe_cancelado ${from}`,
    { replacements, type: QueryTypes.SELECT, transaction }) as Record<keyof RoomReportSummary, string>[];
    const resumen: RoomReportSummary = {
      reservas: Number(rawSummary.reservas), huespedes: Number(rawSummary.huespedes),
      noches_periodo: Number(rawSummary.noches_periodo), importe_reservado: Number(rawSummary.importe_reservado),
      canceladas: Number(rawSummary.canceladas), importe_cancelado: Number(rawSummary.importe_cancelado),
    };
    const exporting = filters.formato !== "json";
    if (exporting && resumen.reservas > MAX_EXPORT_ROWS) {
      throw new AppError(422, "REPORT_TOO_LARGE", `La descarga admite hasta ${MAX_EXPORT_ROWS} reservas. Reduzca el período o seleccione una sede o estado.`);
    }
    const registros = await sequelize.query(`SELECT r.id, h.sucursal_id, s.nombre AS sede,
      h.numero AS habitacion, t.nombre AS tipo_habitacion,
      r.fecha_entrada::text, r.fecha_salida::text, r.estado, r.numero_huespedes AS huespedes,
      ${nights} AS noches_periodo, r.total AS importe_reservado ${from}
      ORDER BY r.fecha_entrada ASC, r.id ASC LIMIT :limite OFFSET :desplazamiento`, {
      replacements: { ...replacements, limite: exporting ? MAX_EXPORT_ROWS : filters.por_pagina,
        desplazamiento: exporting ? 0 : (filters.pagina - 1) * filters.por_pagina },
      type: QueryTypes.SELECT, transaction,
    }) as RoomReportRow[];
    return {
      reporte: "reservas-habitaciones", generado: new Date().toISOString(), moneda: "GTQ", sede,
      filtros: { desde: filters.desde, hasta: filters.hasta, sucursal_id: filters.sucursal_id ?? null, estado: filters.estado ?? null },
      criterio: REPORT_CRITERION, nota_importes: REPORT_AMOUNTS_NOTE, resumen,
      registros: registros.map(row => ({ ...row, importe_reservado: Number(row.importe_reservado) })),
      paginacion: { pagina: filters.pagina, por_pagina: filters.por_pagina,
        total_paginas: Math.ceil(resumen.reservas / filters.por_pagina) },
    };
  });
}
