import { Router } from "express";

import * as usuarioController
  from "../../controllers/usuarios/usuario.controller";

import {
  validateBody,
  validateParams,
} from "../../middlewares/validate.middleware";

import { authMiddleware }
  from "../../middlewares/auth.middleware";

import { requireRole }
  from "../../middlewares/role.middleware";

import { ROLES }
  from "../../constants/roles";

import { idParamSchema }
  from "../../validators/common.validator";

import {
  createUsuarioAdminSchema,
  updateUsuarioEstadoSchema,
  updateUsuarioRolSchema,
  updateUsuarioSchema,
} from "../../validators/usuarios/usuario.validator";

const router = Router();

// Todo este módulo es administrativo.
router.use(
  authMiddleware,
  requireRole(ROLES.ADMIN)
);

/**
 * @openapi
 * /api/usuarios:
 *   get:
 *     tags:
 *       - Usuarios
 *     summary: Listar usuarios
 *     description: Obtiene todos los usuarios registrados. Requiere rol administrador.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuarios obtenidos correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Usuarios obtenidos correctamente
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Usuario'
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
 */
router.get(
  "/",
  usuarioController.getAll
);

/**
 * @openapi
 * /api/usuarios/{id}:
 *   get:
 *     tags:
 *       - Usuarios
 *     summary: Obtener usuario por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Usuario obtenido correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/:id",
  validateParams(idParamSchema),
  usuarioController.getById
);

/**
 * @openapi
 * /api/usuarios:
 *   post:
 *     tags:
 *       - Usuarios
 *     summary: Crear usuario administrativo
 *     description: Permite a un administrador crear usuarios con un rol determinado.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - email
 *               - password
 *               - rol
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Ana López
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ana@hotel.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Hotel1234
 *               rol:
 *                 type: string
 *                 enum:
 *                   - admin
 *                   - recepcionista
 *                   - gerente_restaurante
 *                   - gerente_habitaciones
 *                   - empleado_operativo
 *                   - cliente
 *                 example: recepcionista
 *               telefono:
 *                 type: string
 *                 nullable: true
 *                 example: "55554444"
 *     responses:
 *       201:
 *         description: Usuario creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: Usuario creado correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 *       409:
 *         description: El correo electrónico ya se encuentra registrado
 */
router.post(
  "/",
  validateBody(
    createUsuarioAdminSchema
  ),
  usuarioController.create
);

/**
 * @openapi
 * /api/usuarios/{id}:
 *   patch:
 *     tags:
 *       - Usuarios
 *     summary: Actualizar datos de un usuario
 *     description: Modifica nombre, correo o teléfono. No modifica rol, estado ni contraseña.
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
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Ana María López
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ana.lopez@hotel.com
 *               telefono:
 *                 type: string
 *                 nullable: true
 *                 example: "55554444"
 *     responses:
 *       200:
 *         description: Usuario actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: El correo electrónico ya está registrado
 */
router.patch(
  "/:id",
  validateParams(idParamSchema),
  validateBody(
    updateUsuarioSchema
  ),
  usuarioController.update
);

/**
 * @openapi
 * /api/usuarios/{id}/rol:
 *   patch:
 *     tags:
 *       - Usuarios
 *     summary: Cambiar rol de un usuario
 *     description: Cambia el rol de un usuario. Un administrador no puede modificar su propio rol.
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
 *             type: object
 *             required:
 *               - rol
 *             properties:
 *               rol:
 *                 type: string
 *                 enum:
 *                   - admin
 *                   - recepcionista
 *                   - gerente_restaurante
 *                   - gerente_habitaciones
 *                   - empleado_operativo
 *                   - cliente
 *                 example: gerente_habitaciones
 *     responses:
 *       200:
 *         description: Rol actualizado correctamente
 *       400:
 *         description: Rol o ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 *       404:
 *         description: Usuario no encontrado
 *       422:
 *         description: El administrador intentó modificar su propio rol
 */
router.patch(
  "/:id/rol",
  validateParams(idParamSchema),
  validateBody(
    updateUsuarioRolSchema
  ),
  usuarioController.updateRole
);

/**
 * @openapi
 * /api/usuarios/{id}/estado:
 *   patch:
 *     tags:
 *       - Usuarios
 *     summary: Activar o desactivar un usuario
 *     description: Modifica el estado de una cuenta sin eliminar su información histórica.
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
 *             type: object
 *             required:
 *               - activo
 *             properties:
 *               activo:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 *       404:
 *         description: Usuario no encontrado
 *       422:
 *         description: El administrador intentó deshabilitar su propia cuenta
 */
router.patch(
  "/:id/estado",
  validateParams(idParamSchema),
  validateBody(
    updateUsuarioEstadoSchema
  ),
  usuarioController.updateStatus
);

export default router;