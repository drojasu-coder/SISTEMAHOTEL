import { Router } from "express";
import * as dashboardController from "../../controllers/admin/dashboard.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";

const router = Router();

/**
 * @openapi
 * /api/admin/dashboard:
 *   get:
 *     tags:
 *       - Admin Dashboard
 *     summary: Obtener métricas e indicadores operativos en tiempo real
 *     description: Estancias confirmadas que incluyen hoy sobre inventario actual, estado físico separado, movimientos confirmados del día y reservas pendientes/actualizadas. Todas las consultas se limitan a las sedes autorizadas del usuario. No incluye facturación ni cobros. vista=alcance devuelve únicamente las sedes autorizadas, sin consultar inventario ni reservas.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sucursal_id
 *         schema:
 *           type: integer
 *         required: false
 *         description: ID de la sucursal para filtrar los datos. Omitir para consolidar todas las sedes.
 *       - in: query
 *         name: vista
 *         schema:
 *           type: string
 *           enum: [alcance]
 *         description: Solo metadatos del alcance de sede para los controles del panel.
 *     responses:
 *       200:
 *         description: Métricas obtenidas correctamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.get(
  "/",
  authMiddleware,
  requireRole(
    ROLES.ADMIN,
    ROLES.RECEPCIONISTA,
    ROLES.GERENTE_HABITACIONES
  ),
  dashboardController.getDashboard
);

export default router;
