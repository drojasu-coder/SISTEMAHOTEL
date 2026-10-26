import { Router } from "express";
import * as mediaController from "../../controllers/media/media.controller";

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

export default router;
