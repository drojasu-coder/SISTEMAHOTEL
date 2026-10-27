import { Router } from "express";
import * as inicioController from "../../controllers/inicio/inicio.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  updateInicioSchema,
  presignInicioImageSchema,
  confirmInicioImageSchema,
} from "../../validators/inicio/inicio.validator";

const router = Router();

/**
 * @openapi
 * /api/inicio:
 *   get:
 *     tags:
 *       - Inicio
 *     summary: Obtener contenido editorial y multimedia de la página de inicio
 *     description: Retorna los textos, enlaces, visibilidad y URLs prefirmadas de imágenes para la portada pública del hotel.
 *     security: []
 *     responses:
 *       200:
 *         description: Contenido obtenido correctamente
 */
router.get("/", inicioController.getInicio);

/**
 * @openapi
 * /api/inicio:
 *   put:
 *     tags:
 *       - Inicio
 *     summary: Actualizar contenido editorial de la página de inicio
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contenido actualizado correctamente
 */
router.put(
  "/",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  validateBody(updateInicioSchema),
  inicioController.updateInicio,
);

/**
 * @openapi
 * /api/inicio/imagen/{section}/presign:
 *   post:
 *     tags:
 *       - Inicio
 *     summary: Solicitar URL prefirmada para subir imagen de una sección de Inicio
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/imagen/:section/presign",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  validateBody(presignInicioImageSchema),
  inicioController.presignImage,
);

/**
 * @openapi
 * /api/inicio/imagen/{section}/confirmar:
 *   post:
 *     tags:
 *       - Inicio
 *     summary: Confirmar y publicar imagen subida para una sección de Inicio
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/imagen/:section/confirmar",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  validateBody(confirmInicioImageSchema),
  inicioController.confirmImage,
);

/**
 * @openapi
 * /api/inicio/imagen/{section}:
 *   delete:
 *     tags:
 *       - Inicio
 *     summary: Desvincular imagen de una sección de Inicio
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/imagen/:section",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  inicioController.removeImage,
);

export default router;
