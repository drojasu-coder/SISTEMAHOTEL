import { Op } from "sequelize";
import { AppError } from "./AppError";
import { ROLES, Role } from "../constants/roles";

const db = require("../models");
const { Empleado, EmpleadoSede, Sucursal } = db;

/**
 * Alcance por sede del personal administrativo.
 *
 * - admin: acceso global (único rol global).
 * - personal (cualquier otro rol que no sea cliente): solo la sede principal de su
 *   ficha de empleado (empleados.sucursal_id) y las sedes adicionales de
 *   empleado_sedes. Sin ficha de empleado no tiene ninguna sede.
 * - cliente: sin sedes; sus accesos se rigen por la propiedad de sus registros.
 *
 * Se calcula siempre en el servidor a partir del usuario autenticado; ningún
 * sucursal_id enviado por el cliente amplía este alcance.
 */
export type SedeScope =
  | { global: true }
  | { global: false; sucursalIds: number[] };

export interface ScopeRequester {
  id: number;
  rol: Role;
}

export const getSedeScope = async (requester: ScopeRequester): Promise<SedeScope> => {
  if (requester.rol === ROLES.ADMIN) return { global: true };
  if (requester.rol === ROLES.CLIENTE) return { global: false, sucursalIds: [] };

  const empleado = await Empleado.findOne({
    where: { usuario_id: requester.id },
    attributes: ["id", "sucursal_id"],
    include: [{ model: EmpleadoSede, as: "sedesAdicionales", attributes: ["sucursal_id"], required: false }],
  });
  if (!empleado) return { global: false, sucursalIds: [] };

  const ids = new Set<number>([Number(empleado.sucursal_id)]);
  for (const extra of empleado.sedesAdicionales ?? []) ids.add(Number(extra.sucursal_id));
  const valid = await Sucursal.findAll({ where: { id: { [Op.in]: [...ids].filter(id => Number.isSafeInteger(id) && id > 0) }, activa: true }, attributes: ["id"], raw: true });
  return { global: false, sucursalIds: valid.map((site: { id: number }) => site.id).sort((a: number, b: number) => a - b) };
};

export const canAccessSede = (scope: SedeScope, sucursalId: number | null | undefined) =>
  scope.global || (sucursalId != null && scope.sucursalIds.includes(Number(sucursalId)));

const sedeNotAuthorized = () =>
  new AppError(403, "SEDE_NOT_AUTHORIZED", "No tiene autorización para operar en esta sede");

/** Personal sin ninguna sede asignada: se deniega en lugar de asumir acceso global. */
export const assertHasSede = (scope: SedeScope) => {
  if (!scope.global && scope.sucursalIds.length === 0) {
    throw new AppError(403, "SEDE_NOT_ASSIGNED", "Su usuario no tiene ninguna sede asignada");
  }
};

export const assertSedeAccess = (scope: SedeScope, sucursalId: number | null | undefined) => {
  assertHasSede(scope);
  if (!canAccessSede(scope, sucursalId)) throw sedeNotAuthorized();
};

/**
 * Condición `where` para listados sobre la columna de sede indicada. Si se pide
 * una sede concreta, debe estar dentro del alcance; sin filtro se limita a las
 * sedes autorizadas.
 */
export const sedeWhere = (scope: SedeScope, requested?: number | null, column = "sucursal_id") => {
  if (requested != null) {
    assertSedeAccess(scope, requested);
    return { [column]: requested };
  }
  if (scope.global) return {};
  assertHasSede(scope);
  return { [column]: { [Op.in]: scope.sucursalIds } };
};

/**
 * Recursos compartidos por todas las sedes (p. ej. tipos de habitación sin sede):
 * modificarlos afecta a todas, por eso solo el alcance global puede hacerlo.
 */
export const assertGlobalScope = (scope: SedeScope) => {
  if (!scope.global) {
    throw new AppError(403, "SEDE_NOT_AUTHORIZED", "Solo la administración general puede modificar recursos compartidos por todas las sedes");
  }
};

/**
 * Filtro de visualización `?sucursal_id=` de los listados administrativos.
 * Ausente = todas las sedes del alcance; un valor inválido se rechaza (400)
 * en lugar de ignorarse en silencio. La autorización la decide sedeWhere.
 */
export const parseSucursalIdQuery = (value: unknown): number | undefined => {
  if (value === undefined || value === "") return undefined;
  const id = Number(value);
  if (typeof value !== "string" || !/^\d+$/.test(value) || !Number.isSafeInteger(id) || id <= 0) {
    throw new AppError(400, "VALIDATION_ERROR", "sucursal_id debe ser un entero positivo");
  }
  return id;
};
