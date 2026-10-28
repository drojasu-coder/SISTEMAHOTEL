import { QueryTypes, Transaction } from "sequelize";
import { ROLES } from "../../constants/roles";
import { AppError } from "../../utils/AppError";
import { RequesterContext } from "../../utils/paymentOwnership";
import { assertHasSede, assertSedeAccess, getSedeScope } from "../../utils/sedeScope";
import { MAX_EXPORT_ROWS } from "./reportes.service";
import { OperationalFilters, OperationalReport, OperationalReportKind, ReportField } from "./reportes.types";

const { sequelize, Sucursal } = require("../../models");
const field = (clave: string, etiqueta: string, etiqueta_en: string, formato?: ReportField["formato"]): ReportField => ({ clave, etiqueta, etiqueta_en, ...(formato ? { formato } : {}) });
const common = [field("referencia", "Referencia", "Reference"), field("sede", "Sede", "Site"), field("fecha", "Fecha del servicio", "Service date", "fecha")];
const times = [field("hora_inicio", "Inicio", "Start"), field("hora_fin", "Fin", "End")];
const state = field("estado", "Estado operativo", "Operational status");
const criterion = "Incluye la fecha programada del servicio entre ambas fechas, inclusive; no la fecha de creación. Los estados son los actuales.";
const criterionEn = "Includes the scheduled service date within both inclusive dates, not the creation date. Statuses are current.";

// Only trusted static SQL fragments. Values supplied by clients always use replacements.
const definitions = {
  "reservas-restaurante": {
    titulo: "Reservas de restaurante", titulo_en: "Restaurant reservations",
    nota: "Comensales: suma por reserva, no asistencia real. Mesas distintas: recursos con reservas en el período, no ocupación simultánea ni ventas. Incluye los estados seleccionados.",
    nota_en: "Diners are summed per reservation, not actual attendance. Distinct tables are resources with bookings during the period, not simultaneous occupancy or sales. Includes selected statuses.",
    source: `SELECT 'R-' || r.id AS referencia, r.id AS orden, m.sucursal_id, s.nombre AS sede,
      r.fecha, r.hora AS hora_inicio, r.estado, r.numero_comensales AS comensales,
      m.id AS mesa_id, m.zona FROM reservas_mesa r
      JOIN mesas m ON m.id = r.mesa_id JOIN sucursales s ON s.id = m.sucursal_id`,
    aggregates: `COALESCE(SUM(comensales), 0) AS comensales, COUNT(DISTINCT mesa_id) AS mesas_distintas,
      COUNT(*) FILTER (WHERE estado = 'cancelada') AS canceladas`,
    columnas: [...common, field("hora_inicio", "Hora", "Time"), field("mesa_id", "Mesa", "Table", "entero"), field("zona", "Zona registrada", "Recorded zone"), field("comensales", "Comensales reservados", "Reserved diners", "entero"), state],
    metricas: [field("registros", "Reservas", "Reservations", "entero"), field("comensales", "Comensales reservados", "Reserved diners", "entero"), field("mesas_distintas", "Mesas distintas", "Distinct tables", "entero"), field("canceladas", "Canceladas", "Cancelled", "entero")],
  },
  "actividades-bienestar": {
    titulo: "Actividades y Bienestar", titulo_en: "Activities and Wellness",
    nota: "Experiencias: participantes reservados, no asistentes reales; incluye canceladas si se seleccionan. Alquileres y citas se cuentan por separado. Horarios registrados, sin reconstruir disponibilidad. No se atribuyen precios históricos a citas. La sede de una cita procede del servicio o, si es general, del terapeuta; sin ambos se muestra sin sede registrada.",
    nota_en: "Experience participants are booked places, not actual attendees; includes cancellations when selected. Rentals and appointments are counted separately. Recorded schedules do not reconstruct availability. No historical appointment prices are inferred. Appointment site comes from the service or, for general services, the therapist; otherwise no site is assigned.",
    source: `SELECT 'A-' || r.id AS referencia, r.id AS orden, a.sucursal_id, s.nombre AS sede,
      r.fecha, r.hora_inicio, r.hora_fin, r.estado,
      CASE WHEN a.modalidad = 'experiencia' THEN 'experiencia' ELSE 'alquiler' END AS tipo_servicio,
      a.nombre AS servicio, CASE WHEN a.modalidad = 'experiencia' THEN r.numero_participantes ELSE NULL END AS participantes,
      NULL::text AS terapeuta FROM reservas_actividad r
      JOIN recursos_actividad a ON a.id = r.recurso_id JOIN sucursales s ON s.id = a.sucursal_id
      UNION ALL
      SELECT 'B-' || c.id, c.id, COALESCE(b.sucursal_id, t.sucursal_id), COALESCE(s.nombre, 'Sin sede registrada'),
      c.fecha, c.hora_inicio, c.hora_fin, c.estado, 'bienestar', b.nombre, NULL::integer, t.nombre
      FROM citas_bienestar c JOIN servicios_bienestar b ON b.id = c.servicio_bienestar_id
      LEFT JOIN terapeutas t ON t.id = c.terapeuta_id
      LEFT JOIN sucursales s ON s.id = COALESCE(b.sucursal_id, t.sucursal_id)`,
    aggregates: `COUNT(*) FILTER (WHERE tipo_servicio = 'experiencia') AS experiencias,
      COALESCE(SUM(participantes) FILTER (WHERE tipo_servicio = 'experiencia'), 0) AS participantes,
      COUNT(*) FILTER (WHERE tipo_servicio = 'alquiler') AS alquileres,
      COUNT(*) FILTER (WHERE tipo_servicio = 'bienestar') AS citas,
      COUNT(*) FILTER (WHERE sucursal_id IS NULL) AS sin_sede,
      COUNT(*) FILTER (WHERE estado = 'cancelada') AS canceladas`,
    columnas: [...common, field("tipo_servicio", "Tipo de servicio", "Service type"), field("servicio", "Servicio", "Service"), ...times, field("participantes", "Participantes reservados", "Booked participants", "entero"), field("terapeuta", "Terapeuta", "Therapist"), state],
    metricas: [field("registros", "Operaciones", "Operations", "entero"), field("experiencias", "Reservas de experiencias", "Experience bookings", "entero"), field("participantes", "Participantes reservados", "Booked participants", "entero"), field("alquileres", "Alquileres", "Rentals", "entero"), field("citas", "Citas de Bienestar", "Wellness appointments", "entero"), field("canceladas", "Canceladas", "Cancelled", "entero"), field("sin_sede", "Sin sede registrada", "No recorded site", "entero")],
  },
  "cotizaciones-eventos": {
    titulo: "Cotizaciones de eventos", titulo_en: "Event quotations",
    nota: "Importes cotizados completos guardados en cada solicitud, según los estados seleccionados. No son ingresos cobrados ni anticipos pagados. Invitados: suma solicitada, no asistencia real. No se recalcula con tarifas actuales ni se agregan servicios por separado.",
    nota_en: "Full quoted amounts stored on each request, according to selected statuses. These are not collected revenue or paid deposits. Guests are requested counts, not actual attendance. Current rates are not used and services are not added again.",
    source: `SELECT 'E-' || r.id AS referencia, r.id AS orden, a.sucursal_id, s.nombre AS sede,
      r.fecha, r.hora_inicio, r.hora_fin, r.estado, a.id AS salon_id, a.nombre AS salon,
      r.tipo_evento, r.numero_invitados AS invitados, r.total AS importe_cotizado
      FROM reservas_evento r JOIN salones a ON a.id = r.salon_id JOIN sucursales s ON s.id = a.sucursal_id`,
    aggregates: `COALESCE(SUM(invitados), 0) AS invitados, COUNT(DISTINCT salon_id) AS salones_distintos,
      COALESCE(SUM(importe_cotizado), 0) AS importe_cotizado, COUNT(*) FILTER (WHERE estado = 'cancelada') AS canceladas`,
    columnas: [...common, field("salon", "Salón", "Hall"), field("tipo_evento", "Tipo de evento", "Event type"), ...times, field("invitados", "Invitados solicitados", "Requested guests", "entero"), state, field("importe_cotizado", "Importe cotizado (GTQ)", "Quoted amount (GTQ)", "importe")],
    metricas: [field("registros", "Solicitudes", "Requests", "entero"), field("invitados", "Invitados solicitados", "Requested guests", "entero"), field("salones_distintos", "Salones distintos", "Distinct halls", "entero"), field("importe_cotizado", "Importe cotizado (GTQ)", "Quoted amount (GTQ)", "importe"), field("canceladas", "Canceladas", "Cancelled", "entero")],
  },
};

export async function getOperationalReport(kind: OperationalReportKind, filters: OperationalFilters, requester: RequesterContext): Promise<OperationalReport> {
  if (requester.rol !== ROLES.ADMIN) throw new AppError(403, "INSUFFICIENT_PERMISSIONS", "No tiene permisos para consultar este reporte");
  const scope = await getSedeScope(requester);
  assertHasSede(scope);
  if (filters.sucursal_id) assertSedeAccess(scope, filters.sucursal_id);
  const definition = definitions[kind];
  return sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ, readOnly: true }, async (transaction: Transaction) => {
    let sede = "Todas las sedes autorizadas";
    if (filters.sucursal_id) {
      const selected = await Sucursal.findByPk(filters.sucursal_id, { attributes: ["nombre"], transaction });
      if (!selected) throw new AppError(404, "SEDE_NOT_FOUND", "La sede seleccionada no existe");
      sede = selected.nombre;
    }
    const replacements = { desde: filters.desde, hasta: filters.hasta, sucursal: filters.sucursal_id ?? null,
      estado: filters.estado ?? null, sedes: scope.global ? [] : scope.sucursalIds };
    const cte = `WITH source AS (${definition.source}), filtered AS (SELECT * FROM source
      WHERE fecha BETWEEN CAST(:desde AS date) AND CAST(:hasta AS date)
      AND (:sucursal IS NULL OR sucursal_id = :sucursal) AND (:estado IS NULL OR estado = :estado)
      AND ${scope.global ? "TRUE" : "sucursal_id IN (:sedes)"})`;
    const [summary] = await sequelize.query(`${cte} SELECT COUNT(*) AS registros, ${definition.aggregates} FROM filtered`,
      { replacements, type: QueryTypes.SELECT, transaction }) as Record<string, string>[];
    const resumen = Object.fromEntries(Object.entries(summary).map(([key, value]) => [key, Number(value)])) as OperationalReport["resumen"];
    const exporting = filters.formato !== "json";
    if (exporting && resumen.registros > MAX_EXPORT_ROWS) throw new AppError(422, "REPORT_TOO_LARGE", "La descarga admite hasta 10000 registros. Reduzca los filtros.");
    // No joins to item/payment tables: every operation contributes exactly once.
    const columns = [...new Set(["referencia", "sucursal_id", ...definition.columnas.map(column => column.clave)])];
    const rows = await sequelize.query(`${cte} SELECT ${columns.map(key => key === "fecha" ? "fecha::text" : key).join(", ")}
      FROM filtered ORDER BY fecha, hora_inicio, referencia LIMIT :limite OFFSET :desplazamiento`, {
      replacements: { ...replacements, limite: exporting ? MAX_EXPORT_ROWS : filters.por_pagina,
        desplazamiento: exporting ? 0 : (filters.pagina - 1) * filters.por_pagina }, type: QueryTypes.SELECT, transaction,
    }) as OperationalReport["registros"];
    const numeric = definition.columnas.filter(column => column.formato === "importe" || column.formato === "entero").map(column => column.clave);
    return { reporte: kind, titulo: definition.titulo, titulo_en: definition.titulo_en, generado: new Date().toISOString(), moneda: "GTQ", sede,
      filtros: { desde: filters.desde, hasta: filters.hasta, sucursal_id: filters.sucursal_id ?? null, estado: filters.estado ?? null },
      criterio: criterion, criterio_en: criterionEn, nota: definition.nota, nota_en: definition.nota_en,
      columnas: definition.columnas, metricas: definition.metricas, resumen,
      registros: rows.map(row => ({ ...row, ...Object.fromEntries(numeric.map(key => [key, row[key] == null ? null : Number(row[key])])) })),
      paginacion: { pagina: filters.pagina, por_pagina: filters.por_pagina, total_paginas: Math.ceil(resumen.registros / filters.por_pagina) } };
  });
}
