import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import { ROLES } from "../constants/roles";
import * as configuracionController from "../controllers/configuracion.controller";
import { updateIvaSchema } from "../validators/configuracion.validator";

const router = Router();

/**
 * @openapi
 * /api/configuraciones/iva:
 *   get:
 *     tags: [Configuraciones]
 *     summary: Obtener el IVA vigente
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Configuración del IVA obtenida correctamente }
 *       401: { description: Usuario no autenticado }
 */
router.get("/iva", authMiddleware, configuracionController.getCurrentIva);

/**
 * @openapi
 * /api/configuraciones/iva:
 *   patch:
 *     tags: [Configuraciones]
 *     summary: Actualizar el IVA vigente
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [porcentaje_iva]
 *             properties:
 *               porcentaje_iva: { type: number, minimum: 0, maximum: 100 }
 *     responses:
 *       200: { description: Configuración del IVA actualizada correctamente }
 *       400: { description: Datos inválidos }
 *       401: { description: Usuario no autenticado }
 *       403: { description: Usuario sin permisos }
 */
router.patch(
  "/iva",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  validateBody(updateIvaSchema),
  configuracionController.updateIva
);

export default router;
