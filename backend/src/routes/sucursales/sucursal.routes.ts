import { Router } from "express";

import * as sucursalController from "../../modules/sucursales/sucursal.controller";

import {
  validateBody,
  validateParams,
} from "../../middlewares/validate.middleware";

import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";

import {
  createSucursalSchema,
  updateSucursalSchema,
  presignImageSchema,
  confirmImageSchema,
} from "../../modules/sucursales/sucursal.validator";

import { idParamSchema } from "../../validators/common.validator";

const router = Router();

/*
 * CONSULTA PÚBLICA
 */

/**
 * @openapi
 * /api/sucursales:
 *   get:
 *     tags:
 *       - Sucursales
 *     summary: Listar sucursales
 *     description: Obtiene todas las sucursales disponibles enriquecidas con la URL prefirmada de su fotografía principal si disponen de ella.
 *     responses:
 *       200:
 *         description: Sucursales obtenidas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SucursalesResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/",
  sucursalController.getAll
);

/**
 * @openapi
 * /api/sucursales/{id}:
 *   get:
 *     tags:
 *       - Sucursales
 *     summary: Obtener una sucursal por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Sucursal obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SucursalResponse'
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       404:
 *         description: Sucursal no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/:id",
  validateParams(idParamSchema),
  sucursalController.getById
);

/*
 * ADMINISTRACIÓN
 */

/**
 * @openapi
 * /api/sucursales:
 *   post:
 *     tags:
 *       - Sucursales
 *     summary: Crear una sucursal
 *     description: Crea una nueva sucursal. Requiere rol administrador.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSucursalRequest'
 *     responses:
 *       201:
 *         description: Sucursal creada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SucursalResponse'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Usuario sin permisos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Conflicto al crear la sucursal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  validateBody(createSucursalSchema),
  sucursalController.create
);

/**
 * @openapi
 * /api/sucursales/{id}:
 *   patch:
 *     tags:
 *       - Sucursales
 *     summary: Actualizar una sucursal
 *     description: Actualiza parcialmente una sucursal. Requiere rol administrador.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSucursalRequest'
 *     responses:
 *       200:
 *         description: Sucursal actualizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SucursalResponse'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Usuario sin permisos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Sucursal no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/:id",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  validateParams(idParamSchema),
  validateBody(updateSucursalSchema),
  sucursalController.update
);

/**
 * @openapi
 * /api/sucursales/{id}:
 *   delete:
 *     tags:
 *       - Sucursales
 *     summary: Eliminar una sucursal
 *     description: Elimina una sucursal si no está asociada a habitaciones existentes.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       204:
 *         description: Sucursal eliminada correctamente
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Usuario sin permisos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Sucursal no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: La sucursal está siendo utilizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/:id",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  validateParams(idParamSchema),
  sucursalController.remove
);

/**
 * @openapi
 * /api/sucursales/{id}/imagen-presign:
 *   post:
 *     tags:
 *       - Sucursales
 *     summary: Solicitar URL prefirmada para subida de imagen principal
 *     description: Genera una URL prefirmada PUT de corta duración hacia una clave temporal en S3, vinculando la subida al usuario y sede. Requiere rol administrador.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PresignImageRequest'
 *     responses:
 *       200:
 *         description: URL prefirmada y ticket de subida generados correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PresignImageResponse'
 *       400:
 *         description: Tipo de contenido inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos de administración
 *       404:
 *         description: Sucursal no encontrada
 */
router.post(
  "/:id/imagen-presign",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  validateParams(idParamSchema),
  validateBody(presignImageSchema),
  sucursalController.presignImage
);

/**
 * @openapi
 * /api/sucursales/{id}/imagen-confirmar:
 *   post:
 *     tags:
 *       - Sucursales
 *     summary: Confirmar y validar la subida de fotografía de sede
 *     description: Descarga el archivo de la clave temporal, valida sus bytes decodificables (formato JPEG/PNG/WebP, máx 5MB y dimensiones razonables), lo publica bajo una clave definitiva única y lo asocia a la sede. Requiere rol administrador.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConfirmImageRequest'
 *     responses:
 *       200:
 *         description: Imagen validada y asociada exitosamente a la sede
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SucursalResponse'
 *       400:
 *         description: Archivo corrupto, tamaño excedido o formato inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Ticket de subida no autorizado
 *       404:
 *         description: Sucursal o archivo temporal no encontrado
 */
router.post(
  "/:id/imagen-confirmar",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  validateParams(idParamSchema),
  validateBody(confirmImageSchema),
  sucursalController.confirmImage
);

/**
 * @openapi
 * /api/sucursales/{id}/imagen:
 *   delete:
 *     tags:
 *       - Sucursales
 *     summary: Quitar la imagen principal de la sede
 *     description: Desvincula la imagen principal de la sede y elimina el objeto en S3 si no está referenciado. Requiere rol administrador.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Imagen retirada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SucursalResponse'
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos de administración
 *       404:
 *         description: Sucursal no encontrada
 */
router.delete(
  "/:id/imagen",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  validateParams(idParamSchema),
  sucursalController.removeImage
);

export default router;
