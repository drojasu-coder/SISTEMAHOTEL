import { QueryTypes } from "sequelize";

const { sequelize } = require("../../models");

const RELATED_TABLES = [
  ["habitaciones", "habitaciones"],
  ["tipos_habitacion", "tipos_habitacion"],
  ["parqueos", "parqueos"],
  ["mesas", "mesas"],
  ["actividades", "recursos_actividad"],
  ["servicios_bienestar", "servicios_bienestar"],
  ["terapeutas", "terapeutas"],
  ["amenidades", "amenidades"],
  ["salones", "salones"],
  ["empleados", "empleados"],
] as const;

export interface SucursalRecursos { sucursal_id: number; [clave: string]: number }

/** Conteos de solo lectura por sede, a partir de la columna sucursal_id de cada recurso. */
export async function getResumenRecursos(): Promise<SucursalRecursos[]> {
  const columns = RELATED_TABLES.map(([key, table]) => `(SELECT COUNT(*) FROM ${table} t WHERE t.sucursal_id = s.id) AS ${key}`).join(", ");
  const rows = await sequelize.query(`SELECT s.id AS sucursal_id, ${columns} FROM sucursales s ORDER BY s.id`, { type: QueryTypes.SELECT }) as Record<string, string>[];
  return rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value)])) as SucursalRecursos);
}
