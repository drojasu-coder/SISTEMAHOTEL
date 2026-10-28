import { Router, RequestHandler } from "express";
import { Op } from "sequelize";
import { z } from "zod";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { ROLES } from "../../constants/roles";
import { AppError } from "../../utils/AppError";
import { assertHasSede, assertSedeAccess, getSedeScope, parseSucursalIdQuery, sedeWhere, SedeScope } from "../../utils/sedeScope";
import * as rooms from "../../controllers/habitaciones/habitacion.controller";
import * as roomTypes from "../../controllers/habitaciones/tipoHabitacion.controller";

import * as service0 from "../../services/restaurante/mesa.service";
import * as service1 from "../../services/actividades/recursoActividad.service";
import * as service2 from "../../services/amenidades/amenidad.service";
import * as service3 from "../../services/eventos/salon.service";
import * as service4 from "../../services/bienestar/servicioSpa.service";
import * as service5 from "../../services/bienestar/terapeuta.service";
import * as service6 from "../../services/restaurante/reservaMesa.service";
import * as service7 from "../../services/actividades/reservaActividad.service";
import * as service8 from "../../services/amenidades/reservaAmenidad.service";
import * as service9 from "../../services/bienestar/citaSpa.service";
import * as service10 from "../../services/eventos/reservaEvento.service";
import * as service11 from "../../services/personal/empleado.service";
import * as service12 from "../../services/personal/turno.service";
import * as controller0 from "../../controllers/restaurante/mesa.controller";
import * as controller1 from "../../controllers/actividades/recursoActividad.controller";
import * as controller2 from "../../controllers/amenidades/amenidad.controller";
import * as controller3 from "../../controllers/eventos/salon.controller";
import * as controller4 from "../../controllers/bienestar/servicioSpa.controller";
import * as controller5 from "../../controllers/bienestar/terapeuta.controller";
import * as controller6 from "../../controllers/restaurante/reservaMesa.controller";
import * as controller7 from "../../controllers/actividades/reservaActividad.controller";
import * as controller8 from "../../controllers/amenidades/reservaAmenidad.controller";
import * as controller9 from "../../controllers/bienestar/citaSpa.controller";
import * as controller10 from "../../controllers/eventos/reservaEvento.controller";
import * as controller11 from "../../controllers/personal/empleado.controller";
import * as controller12 from "../../controllers/personal/turno.controller";
import * as validators0 from "../../validators/restaurante/mesa.validator";
import * as validators1 from "../../validators/actividades/recursoActividad.validator";
import * as validators2 from "../../validators/amenidades/amenidad.validator";
import * as validators3 from "../../validators/eventos/salon.validators";
import * as validators4 from "../../validators/bienestar/servicioSpa.validator";
import * as validators5 from "../../validators/bienestar/terapeuta.validator";
import * as validators6 from "../../validators/restaurante/reservaMesa.validator";
import * as validators7 from "../../validators/actividades/reservaActividad.validator";
import * as validators8 from "../../validators/amenidades/reservaAmenidad.validator";
import * as validators9 from "../../validators/bienestar/citaSpa.validator";
import * as validators10 from "../../validators/eventos/reservaEvento.validator";
import * as validators11 from "../../validators/personal/turno.validator";

const db = require("../../models");
type Where = Record<string | symbol, unknown>;
interface Operations {
  model: string;
  controller: Record<string, RequestHandler>;
  list: (where: Where, user: any, branch?: number, query?: Record<string, unknown>) => Promise<unknown>;
  query?: z.ZodType;
  parent?: { key: string; model: string };
  create?: z.ZodType;
  update?: z.ZodType;
  status?: z.ZodType;
  statusOnly?: boolean;
}
const serviceModules: Record<string, any> = {"restaurante/mesa": service0, "actividades/recursoActividad": service1, "amenidades/amenidad": service2, "eventos/salon": service3, "bienestar/servicioSpa": service4, "bienestar/terapeuta": service5, "restaurante/reservaMesa": service6, "actividades/reservaActividad": service7, "amenidades/reservaAmenidad": service8, "bienestar/citaSpa": service9, "eventos/reservaEvento": service10, "personal/empleado": service11, "personal/turno": service12};
const controllerModules: Record<string, any> = {"restaurante/mesa": controller0, "actividades/recursoActividad": controller1, "amenidades/amenidad": controller2, "eventos/salon": controller3, "bienestar/servicioSpa": controller4, "bienestar/terapeuta": controller5, "restaurante/reservaMesa": controller6, "actividades/reservaActividad": controller7, "amenidades/reservaAmenidad": controller8, "bienestar/citaSpa": controller9, "eventos/reservaEvento": controller10, "personal/empleado": controller11, "personal/turno": controller12};
const validatorsModules: Record<string, any> = {"restaurante/mesa.validator": validators0, "actividades/recursoActividad.validator": validators1, "amenidades/amenidad.validator": validators2, "eventos/salon.validators": validators3, "bienestar/servicioSpa.validator": validators4, "bienestar/terapeuta.validator": validators5, "restaurante/reservaMesa.validator": validators6, "actividades/reservaActividad.validator": validators7, "amenidades/reservaAmenidad.validator": validators8, "bienestar/citaSpa.validator": validators9, "eventos/reservaEvento.validator": validators10, "personal/turno.validator": validators11};
const service = (path: string) => serviceModules[path];
const controller = (path: string) => controllerModules[path];
const validators = (path: string) => validatorsModules[path];
const catalogs: Array<[string, string, string, string, string, string]> = [
  ["mesas", "Mesa", "restaurante/mesa", "restaurante/mesa.validator", "createMesaSchema", "updateMesaSchema"],
  ["recursos-actividad", "RecursoActividad", "actividades/recursoActividad", "actividades/recursoActividad.validator", "createRecursoActividadSchema", "updateRecursoActividadSchema"],
  ["amenidades", "Amenidad", "amenidades/amenidad", "amenidades/amenidad.validator", "createAmenidadSchema", "updateAmenidadSchema"],
  ["salones", "Salon", "eventos/salon", "eventos/salon.validators", "createSalonSchema", "updateSalonSchema"],
  ["servicios-spa", "ServicioBienestar", "bienestar/servicioSpa", "bienestar/servicioSpa.validator", "createServicioSpaSchema", "updateServicioSpaSchema"],
  ["terapeutas", "Terapeuta", "bienestar/terapeuta", "bienestar/terapeuta.validator", "createTerapeutaSchema", "updateTerapeutaSchema"],
];
const operations: Record<string, Operations> = {};
for (const [url, model, path, validation, create, update] of catalogs) {
  const source = service(path);
  operations[url] = { model, controller: controller(path), create: validators(validation)[create], update: validators(validation)[update],
    ...(url === "servicios-spa" ? { query: validators(validation).listServiciosSpaQuerySchema } : url === "terapeutas" ? { query: validators(validation).listTerapeutasQuerySchema } : {}),
    list: (where, _user, branch, query) => ["servicios-spa", "terapeutas"].includes(url) ? source.getAll({ sucursalId: branch, incluirInactivos: query?.incluir_inactivos === "true" }, where) : source.getAll(where) };
}
for (const [url, model, path, key, parentModel, validation, status] of [
  ["reservas-mesa", "ReservaMesa", "restaurante/reservaMesa", "mesa_id", "Mesa", "restaurante/reservaMesa.validator", "updateReservaMesaSchema"],
  ["reservas-actividad", "ReservaActividad", "actividades/reservaActividad", "recurso_id", "RecursoActividad", "actividades/reservaActividad.validator", "updateReservaActividadSchema"],
  ["reservas-amenidad", "ReservaAmenidad", "amenidades/reservaAmenidad", "amenidad_id", "Amenidad", "amenidades/reservaAmenidad.validator", "updateReservaAmenidadSchema"],
  ["citas-spa", "CitaBienestar", "bienestar/citaSpa", "servicio_bienestar_id", "ServicioBienestar", "bienestar/citaSpa.validator", "updateCitaSpaSchema"],
  ["reservas-evento", "ReservaEvento", "eventos/reservaEvento", "salon_id", "Salon", "eventos/reservaEvento.validator", "updateReservaEventoEstadoSchema"],
] as const) {
  const source = service(path);
  operations[url] = { model, parent: { key, model: parentModel }, controller: controller(path), statusOnly: true,
    status: validators(validation)[status], list: async (where, user, branch) => url === "reservas-mesa" ? source.getAll(await getSedeScope(user), branch) : url === "reservas-evento" ? source.getAll(user.id, user.rol, where) : url === "reservas-amenidad" ? source.getAll(user, where) : source.getAll(where) };
}
operations.empleados = { model: "Empleado", controller: controller("personal/empleado"), list: where => service("personal/empleado").getAll(where),
  update: z.object({ area: z.string().trim().min(2).max(50), fecha_contratacion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional() }).strict() };
operations.turnos = { model: "Turno", parent: { key: "empleado_id", model: "Empleado" }, controller: controller("personal/turno"), list: where => service("personal/turno").getAll(where),
  create: validators("personal/turno.validator").createTurnoSchema, update: validators("personal/turno.validator").updateTurnoSchema };

const forbidden = () => new AppError(403, "INSUFFICIENT_PERMISSIONS", "Esta operación está reservada al administrador general");
const validBody = (schema: z.ZodType | undefined, body: unknown) => {
  if (!schema) throw forbidden();
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new AppError(400, "VALIDATION_ERROR", "Los datos enviados no son válidos", parsed.error.issues);
  return parsed.data;
};
const idsAtSites = async (model: string, where: Where) => (await db[model].findAll({ where, attributes: ["id"], raw: true })).map((row: { id: number }) => row.id);
async function listWhere(spec: Operations, scope: SedeScope, requested?: number): Promise<Where> {
  const where = sedeWhere(scope, requested);
  if (!spec.parent) return where;
  const ids = await idsAtSites(spec.parent.model, where);
  if (spec.model !== "CitaBienestar") return { [spec.parent.key]: { [Op.in]: ids } };
  const general = await idsAtSites("ServicioBienestar", { sucursal_id: null });
  const therapists = await idsAtSites("Terapeuta", where);
  return { [Op.or]: [{ servicio_bienestar_id: { [Op.in]: ids } }, { servicio_bienestar_id: { [Op.in]: general }, terapeuta_id: { [Op.in]: therapists } }] };
}
async function assertRecord(spec: Operations, id: number, scope: SedeScope) {
  const record = await db[spec.model].findByPk(id);
  if (!record) throw new AppError(404, "RESOURCE_NOT_FOUND", "El registro solicitado no existe");
  let branch = record.sucursal_id;
  if (spec.parent) {
    const parent = await db[spec.parent.model].findByPk(record[spec.parent.key]);
    branch = parent?.sucursal_id;
    if (spec.model === "CitaBienestar" && branch == null && record.terapeuta_id) branch = (await db.Terapeuta.findByPk(record.terapeuta_id))?.sucursal_id;
  }
  assertSedeAccess(scope, branch);
}

/** Permission adapter over existing URLs, validators, serializers and business services.
 * Admin/client/historical requests continue through their original routers unchanged.
 * No identity is impersonated and no business operation is reimplemented here. */
const router = Router();
const financial = new Set(["pagos", "facturas", "factura-items"]);
const roomReservations = new Set(["reservas-habitacion", "reservas-parqueo"]);
const globalCatalogs = new Set(["promociones", "instructores", "servicios-evento"]);
router.use((req, res, next) => {
  const prefix = req.path.split("/")[1];
  if ((!operations[prefix] && !financial.has(prefix) && !roomReservations.has(prefix) && !globalCatalogs.has(prefix) && !["habitaciones", "tipos-habitacion"].includes(prefix)) || !req.headers.authorization) return next("router");
  authMiddleware(req, res, error => {
    if (error) return next(error);
    if (financial.has(prefix) && [ROLES.RECEPCIONISTA, ROLES.GERENTE_HABITACIONES, ROLES.EMPLEADO_OPERATIVO].includes(req.user!.rol as any)) return next(forbidden());
    // Keep the legacy identity valid without exposing a fifth management interface.
    if (req.user!.rol === ROLES.GERENTE_RESTAURANTE && operations[prefix] && (!catalogs.some(([url]) => url === prefix) || !["GET", "HEAD"].includes(req.method))) return next(forbidden());
    if (globalCatalogs.has(prefix)) {
      if (!["GET", "HEAD"].includes(req.method) && req.user!.rol !== ROLES.ADMIN) return next(forbidden());
      return next("router");
    }
    if (roomReservations.has(prefix)) return req.user!.rol === ROLES.EMPLEADO_OPERATIVO ? next(forbidden()) : next("router");
    if (![ROLES.GERENTE_HABITACIONES, ROLES.EMPLEADO_OPERATIVO].includes(req.user!.rol as any)) return next("router");
    next();
  });
});
router.use(async (req, res, next) => {
  try {
    const [prefix, rawId, action] = req.path.split("/").filter(Boolean);
    const scope = await getSedeScope(req.user!); assertHasSede(scope);
    const id = rawId === undefined ? undefined : Number(rawId);
    if (rawId !== undefined && (!/^\d+$/.test(rawId) || !Number.isSafeInteger(id) || id! < 1)) throw new AppError(400, "VALIDATION_ERROR", "Identificador inválido");
    req.params.id = id === undefined ? "" : String(id);
    const branch = parseSucursalIdQuery(req.query.sucursal_id);
    if (branch !== undefined) assertSedeAccess(scope, branch);
    const housekeeper = req.user!.rol === ROLES.EMPLEADO_OPERATIVO;
    if (prefix === "habitaciones" || prefix === "tipos-habitacion") {
      if (!housekeeper) return next("router"); // Existing room services already enforce this manager's scope.
      if (req.method === "GET" && !action) {
        if (prefix === "habitaciones") return id ? rooms.getHabitacionById(req, res, next) : rooms.getAllHabitaciones(req, res, next);
        return id ? roomTypes.getTipoHabitacionById(req, res, next) : roomTypes.getAllTipoHabitaciones(req, res, next);
      }
      if (prefix === "habitaciones" && req.method === "PATCH" && id && !action) {
        req.body = validBody(z.object({ estado: z.enum(["disponible", "ocupada", "limpieza", "mantenimiento"]) }).strict(), req.body);
        req.params.id = String(id);
        return rooms.updateHabitacion(req, res, next);
      }
      throw forbidden();
    }
    if (housekeeper) throw forbidden();
    const spec = operations[prefix];
    if (!spec) return next("router");
    req.params.id = id === undefined ? "" : String(id);
    if (id !== undefined) await assertRecord(spec, id, scope);
    if (req.method === "GET") {
      if (!id) { const query = spec.query ? validBody(spec.query, req.query) as Record<string, unknown> : req.query; const data = await spec.list(await listWhere(spec, scope, branch), req.user, branch, query); res.json({ success: true, status: "success", statusCode: 200, data }); return; }
      if (action) return next("router"); // Existing public availability endpoints, after the resource's scope check.
      return spec.controller.getById(req, res, next);
    }
    if (spec.statusOnly) {
      if (req.method !== "PATCH" || !id || action !== "estado") throw forbidden();
      req.body = validBody(spec.status, req.body);
      return spec.controller.updateStatus(req, res, next);
    }
    if (req.method === "POST" && !id) {
      req.body = validBody(spec.create, req.body);
      if (spec.parent) { const parent = await db[spec.parent.model].findByPk(req.body[spec.parent.key]); assertSedeAccess(scope, parent?.sucursal_id); }
      else assertSedeAccess(scope, req.body.sucursal_id);
      return spec.controller.create(req, res, next);
    }
    if (req.method === "PATCH" && id && !action) {
      req.body = validBody(spec.update, req.body);
      if (Object.prototype.hasOwnProperty.call(req.body, "sucursal_id")) assertSedeAccess(scope, req.body.sucursal_id);
      return spec.controller.update(req, res, next);
    }
    if (req.method === "DELETE" && id && !action && prefix !== "empleados") return spec.controller.remove(req, res, next);
    throw forbidden();
  } catch (error) { next(error); }
});
export default router;
