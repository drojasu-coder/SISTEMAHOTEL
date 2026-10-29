import { QueryTypes, Transaction } from "sequelize";
import { ROLES } from "../../constants/roles";
import { AppError } from "../../utils/AppError";
import { RequesterContext } from "../../utils/paymentOwnership";
import { assertHasSede, assertSedeAccess, getSedeScope } from "../../utils/sedeScope";

const { sequelize } = require("../../models");
export interface PanoramaFilters { desde: string; hasta: string; sucursal_id?: number }

const GT = "America/Guatemala";
const day = (column: string) => `(${column} AT TIME ZONE '${GT}')::date`;
const num = (value: unknown) => Number(value ?? 0);
type Row = Record<string, string | number | null>;

/**
 * Datos agregados de solo lectura para las gráficas de Reportes y análisis.
 * Cada bloque declara qué fecha agrupa (creación, estancia o pago); no se mezclan.
 * Los pagos y las facturas no tienen sede atribuible, por lo que ignoran sucursal_id.
 */
export async function getPanorama(filters: PanoramaFilters, requester: RequesterContext) {
  if (requester.rol !== ROLES.ADMIN) throw new AppError(403, "INSUFFICIENT_PERMISSIONS", "No tiene permisos para consultar este reporte");
  const scope = await getSedeScope(requester);
  assertHasSede(scope);
  if (filters.sucursal_id) assertSedeAccess(scope, filters.sucursal_id);
  const replacements = { desde: filters.desde, hasta: filters.hasta, sucursal: filters.sucursal_id ?? null, sedes: scope.global ? [] : scope.sucursalIds };
  const sedeOk = (column: string) => `(:sucursal IS NULL OR ${column} = :sucursal) AND ${scope.global ? "TRUE" : `${column} IN (:sedes)`}`;
  const run = <T = Row>(sql: string, transaction: Transaction) => sequelize.query(sql, { replacements, type: QueryTypes.SELECT, transaction }) as Promise<T[]>;

  return sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ, readOnly: true }, async (t: Transaction) => {
    const room = `FROM reservas_habitacion r JOIN habitaciones h ON h.id = r.habitacion_id JOIN sucursales s ON s.id = h.sucursal_id WHERE ${sedeOk("h.sucursal_id")}`;
    const stay = `r.fecha_entrada <= CAST(:hasta AS date) AND r.fecha_salida > CAST(:desde AS date)`;
    const [creadas, llegadas, salidas, estadosHab, porSede, fisicas] = await Promise.all([
      run(`SELECT ${day('r."createdAt"')}::text AS fecha, COUNT(*) AS valor ${room} AND ${day('r."createdAt"')} BETWEEN CAST(:desde AS date) AND CAST(:hasta AS date) GROUP BY 1 ORDER BY 1`, t),
      run(`SELECT r.fecha_entrada::text AS fecha, COUNT(*) AS valor ${room} AND r.estado IN ('pendiente','confirmada','finalizada') AND r.fecha_entrada BETWEEN CAST(:desde AS date) AND CAST(:hasta AS date) GROUP BY 1 ORDER BY 1`, t),
      run(`SELECT r.fecha_salida::text AS fecha, COUNT(*) AS valor ${room} AND r.estado IN ('pendiente','confirmada','finalizada') AND r.fecha_salida BETWEEN CAST(:desde AS date) AND CAST(:hasta AS date) GROUP BY 1 ORDER BY 1`, t),
      run(`SELECT r.estado, COUNT(*) AS reservas, COALESCE(SUM(r.total),0) AS importe ${room} AND ${stay} GROUP BY 1 ORDER BY 1`, t),
      run(`SELECT s.id AS sucursal_id, s.nombre AS sede, COUNT(*) AS reservas, COALESCE(SUM(r.total) FILTER (WHERE r.estado IN ('pendiente','confirmada','finalizada')),0) AS importe_vigente ${room} AND ${stay} GROUP BY 1,2 ORDER BY 2`, t),
      run(`SELECT h.estado, COUNT(*) AS habitaciones FROM habitaciones h WHERE ${sedeOk("h.sucursal_id")} GROUP BY 1 ORDER BY 1`, t),
    ]);
    const [rest, act, citas, eventos, amen] = await Promise.all([
      run(`SELECT r.estado, COUNT(*) AS valor FROM reservas_mesa r JOIN mesas m ON m.id = r.mesa_id WHERE ${sedeOk("m.sucursal_id")} AND r.fecha BETWEEN CAST(:desde AS date) AND CAST(:hasta AS date) GROUP BY 1`, t),
      run(`SELECT r.estado, COUNT(*) AS valor FROM reservas_actividad r JOIN recursos_actividad a ON a.id = r.recurso_id WHERE ${sedeOk("a.sucursal_id")} AND r.fecha BETWEEN CAST(:desde AS date) AND CAST(:hasta AS date) GROUP BY 1`, t),
      run(`SELECT c.estado, COUNT(*) AS valor FROM citas_bienestar c JOIN servicios_bienestar b ON b.id = c.servicio_bienestar_id LEFT JOIN terapeutas te ON te.id = c.terapeuta_id WHERE ${sedeOk("COALESCE(b.sucursal_id, te.sucursal_id)")} AND c.fecha BETWEEN CAST(:desde AS date) AND CAST(:hasta AS date) GROUP BY 1`, t),
      run(`SELECT r.estado, COUNT(*) AS valor FROM reservas_evento r JOIN salones a ON a.id = r.salon_id WHERE ${sedeOk("a.sucursal_id")} AND r.fecha BETWEEN CAST(:desde AS date) AND CAST(:hasta AS date) GROUP BY 1`, t),
      run(`SELECT r.estado, COUNT(*) AS valor FROM reservas_amenidad r JOIN amenidades a ON a.id = r.amenidad_id WHERE ${sedeOk("a.sucursal_id")} AND r.fecha BETWEEN CAST(:desde AS date) AND CAST(:hasta AS date) GROUP BY 1`, t),
    ]);
    const inPeriod = (column: string) => `${day(column)} BETWEEN CAST(:desde AS date) AND CAST(:hasta AS date)`;
    const [pagos, cobradoDia, reembolsos, facturas] = await Promise.all([
      run(`SELECT estado, COUNT(*) AS cantidad, COALESCE(SUM(monto),0) AS importe FROM pagos WHERE moneda = 'GTQ' AND ${inPeriod('"createdAt"')} GROUP BY 1 ORDER BY 1`, t),
      run(`SELECT ${day("fecha_pago")}::text AS fecha, COUNT(*) AS cantidad, COALESCE(SUM(monto),0) AS valor FROM pagos WHERE moneda = 'GTQ' AND estado IN ('aprobado','reembolsado_parcial','reembolsado') AND fecha_pago IS NOT NULL AND ${inPeriod("fecha_pago")} GROUP BY 1 ORDER BY 1`, t),
      run(`SELECT estado, COUNT(*) AS cantidad, COALESCE(SUM(monto),0) AS importe FROM reembolsos WHERE moneda = 'GTQ' AND ${inPeriod('"createdAt"')} GROUP BY 1 ORDER BY 1`, t),
      run(`SELECT estado, COUNT(*) AS cantidad, COALESCE(SUM(total),0) AS importe FROM facturas WHERE ${inPeriod('"createdAt"')} GROUP BY 1 ORDER BY 1`, t),
    ]);
    const series = (rows: Row[]) => rows.map(r => ({ fecha: String(r.fecha), valor: num(r.valor) }));
    const estados = (rows: Row[]) => rows.map(r => ({ estado: String(r.estado), valor: num(r.valor) }));
    return {
      generado: new Date().toISOString(), zona_horaria: GT, moneda: "GTQ",
      filtros: { desde: filters.desde, hasta: filters.hasta, sucursal_id: filters.sucursal_id ?? null },
      habitaciones: {
        creadas_por_dia: series(creadas), llegadas_por_dia: series(llegadas), salidas_por_dia: series(salidas),
        estados_en_periodo: estadosHab.map(r => ({ estado: String(r.estado), reservas: num(r.reservas), importe: num(r.importe) })),
        por_sede: porSede.map(r => ({ sucursal_id: num(r.sucursal_id), sede: String(r.sede), reservas: num(r.reservas), importe_vigente: num(r.importe_vigente) })),
        estado_fisico_actual: fisicas.map(r => ({ estado: String(r.estado), habitaciones: num(r.habitaciones) })),
      },
      servicios: { restaurante: estados(rest), actividades: estados(act), bienestar: estados(citas), eventos: estados(eventos), amenidades: estados(amen) },
      finanzas: {
        atribuible_a_sede: false,
        pagos_por_estado: pagos.map(r => ({ estado: String(r.estado), cantidad: num(r.cantidad), importe: num(r.importe) })),
        cobrado_por_dia: cobradoDia.map(r => ({ fecha: String(r.fecha), valor: num(r.valor), cantidad: num(r.cantidad) })),
        reembolsos: reembolsos.map(r => ({ estado: String(r.estado), cantidad: num(r.cantidad), importe: num(r.importe) })),
        facturas_por_estado: facturas.map(r => ({ estado: String(r.estado), cantidad: num(r.cantidad), importe: num(r.importe) })),
      },
    };
  });
}
