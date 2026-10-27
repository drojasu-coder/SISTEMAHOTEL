import { Router } from "express";
import * as mediaController from "../../controllers/media/media.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";
import { validateBody } from "../../middlewares/validate.middleware";
import { presignImageSchema, confirmImageSchema } from "../../validators/sucursales/sucursal.validator";

const router = Router();

/**
 * @openapi
 * /api/media/branding:
 *   get:
 *     tags:
 *       - Multimedia
 *     summary: Obtener URLs prefirmadas de la identidad visual
 *     description: Retorna URLs temporales prefirmadas de lectura directa desde AWS S3 para los logos oficiales de HOTEL HUNAHPÚ. Endpoint público de acceso general.
 *     security: []
 *     responses:
 *       200:
 *         description: URLs prefirmadas de branding obtenidas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BrandingResponse'
 *       500:
 *         description: Error interno del servidor al comunicarse con el almacenamiento
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/branding", mediaController.getBranding);

router.post(
  "/branding/:variant/presign",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  validateBody(presignImageSchema),
  mediaController.presignBranding,
);

router.post(
  "/branding/:variant/confirmar",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  validateBody(confirmImageSchema),
  mediaController.confirmBranding,
);

export default router;
