import { Router } from "express";
import { ROLES } from "../../constants/roles";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validateQuery } from "../../middlewares/validate.middleware";
import { renderOperationalReportExcel, renderRoomReportExcel } from "./reportes.excel";
import { renderOperationalReportPdf, renderRoomReportPdf } from "./reportes.pdf";
import { getRoomReservationsReport } from "./reportes.service";
import { OperationalFilters, RoomReportFilters } from "./reportes.types";
import { activitiesReportQuerySchema, eventsReportQuerySchema, restaurantReportQuerySchema, roomReportQuerySchema } from "./reportes.validator";
import { getOperationalReport } from "./reportes.operativos";
import { getPanorama } from "./reportes.panorama";
import { panoramaQuerySchema } from "./reportes.validator";

const router = Router();
router.use(authMiddleware, requireRole(ROLES.ADMIN));

/**
 * @openapi
 * /api/reportes/reservas-habitaciones:
 *   get:
 *     tags: [Reportes]
 *     summary: Reservas con estancia que intersecta el período (solo admin)
 *     description: Fechas inclusivas, salida exclusiva. Importes completos reservados, no cobrados. JSON paginado; PDF y XLSX incluyen todas las filas filtradas (máximo 10000). Período máximo 366 días.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: desde, required: true, schema: { type: string, format: date } }
 *       - { in: query, name: hasta, required: true, schema: { type: string, format: date } }
 *       - { in: query, name: sucursal_id, schema: { type: integer, minimum: 1 }, description: Omitir para todas las sedes autorizadas }
 *       - { in: query, name: estado, schema: { type: string, enum: [pendiente, confirmada, cancelada, finalizada, expirada] } }
 *       - { in: query, name: formato, schema: { type: string, enum: [json, pdf, xlsx], default: json } }
 *       - { in: query, name: pagina, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: por_pagina, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *     responses:
 *       '200':
 *         description: Resumen y registros o archivo descargable con los filtros solicitados
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean }, data: { type: object } } }
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema: { type: string, format: binary }
 *       '400': { description: Filtros inválidos }
 *       '401': { description: Sesión requerida }
 *       '403': { description: Acceso exclusivo de administrador general }
 *       '404': { description: Sede inexistente }
 *       '422': { description: Demasiados registros para descargar; reduzca los filtros }
 */
router.get("/reservas-habitaciones", validateQuery(roomReportQuerySchema), async (req, res, next) => {
  try {
    const filters = req.query as unknown as RoomReportFilters;
    const report = await getRoomReservationsReport(filters, req.user!);
    res.setHeader("Cache-Control", "private, no-store");
    if (filters.formato === "json") {
      res.json({ success: true, statusCode: 200, data: report });
      return;
    }
    const content = filters.formato === "pdf" ? await renderRoomReportPdf(report) : await renderRoomReportExcel(report);
    res.setHeader("Content-Type", filters.formato === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    const filename = `reservas-habitaciones-${filters.desde}-${filters.hasta}-sede-${filters.sucursal_id ?? "todas"}.${filters.formato}`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(content);
  } catch (error) { next(error); }
});

// All new formats share the existing session + general administrator guard above.
// GET /api/reportes/{reservas-restaurante|actividades-bienestar|cotizaciones-eventos}
// Query contract: same inclusive dates, site, state, format and pagination as rooms.
for (const [kind, schema] of [
  ["reservas-restaurante", restaurantReportQuerySchema],
  ["actividades-bienestar", activitiesReportQuerySchema],
  ["cotizaciones-eventos", eventsReportQuerySchema],
] as const) {
  router.get(`/${kind}`, validateQuery(schema), async (req, res, next) => {
    try {
      const filters = req.query as unknown as OperationalFilters;
      const report = await getOperationalReport(kind, filters, req.user!);
      res.setHeader("Cache-Control", "private, no-store");
      if (filters.formato === "json") { res.json({ success: true, statusCode: 200, data: report }); return; }
      const content = filters.formato === "pdf" ? await renderOperationalReportPdf(report) : await renderOperationalReportExcel(report);
      res.setHeader("Content-Type", filters.formato === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${kind}-${filters.desde}-${filters.hasta}-sede-${filters.sucursal_id ?? "todas"}.${filters.formato}"`);
      res.send(content);
    } catch (error) { next(error); }
  });
}

// GET /api/reportes/panorama: agregados de solo lectura para gráficas (mismo guard de administrador general).
router.get("/panorama", validateQuery(panoramaQuerySchema), async (req, res, next) => {
  try {
    res.setHeader("Cache-Control", "private, no-store");
    res.json({ success: true, statusCode: 200, data: await getPanorama(req.query as never, req.user!) });
  } catch (error) { next(error); }
});

export default router;
