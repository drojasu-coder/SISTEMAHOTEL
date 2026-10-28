import { Router } from "express";
import * as dashboardController from "../../controllers/admin/dashboard.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";

const router = Router();

/**
 * @openapi
 * /api/admin/alcance:
 *   get:
 *     tags:
 *       - Administración
 *     summary: Sedes autorizadas del usuario para el selector global del panel
 *     description: Devuelve solo el alcance de sede calculado en el servidor (administrador, todas; personal, su sede principal y sus sedes adicionales). No incluye métricas, inventario ni reservas y no concede acceso al resumen del dashboard.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sedes autorizadas obtenidas correctamente
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Rol sin panel administrativo o personal sin sede asignada
 */
router.get(
  "/",
  authMiddleware,
  requireRole(
    ROLES.ADMIN,
    ROLES.RECEPCIONISTA,
    ROLES.GERENTE_HABITACIONES,
    ROLES.GERENTE_RESTAURANTE,
    ROLES.EMPLEADO_OPERATIVO
  ),
  dashboardController.getScope
);

export default router;
