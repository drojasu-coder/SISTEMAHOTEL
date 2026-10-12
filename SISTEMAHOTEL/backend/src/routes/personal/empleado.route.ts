import { Router }
  from "express";

import * as empleadoController
  from "../../controllers/personal/empleado.controller";

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
  createEmpleadoSchema,
  updateEmpleadoSchema,
} from "../../validators/personal/empleado.validator";

const router = Router();

router.use(
  authMiddleware,
  requireRole(
    ROLES.ADMIN
  )
);

/**
 * @openapi
 * /api/empleados:
 *   get:
 *     tags:
 *       - Empleados
 *     summary: Listar empleados
 *     description: Obtiene todos los empleados registrados. Requiere rol administrador.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Empleados obtenidos correctamente
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
 *                   example: Empleados obtenidos correctamente
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Empleado'
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 */
router.get(
  "/",
  empleadoController.getAll
);

/**
 * @openapi
 * /api/empleados/{id}:
 *   get:
 *     tags:
 *       - Empleados
 *     summary: Obtener un empleado por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del empleado
 *     responses:
 *       200:
 *         description: Empleado obtenido correctamente
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
 *                   example: Empleado obtenido correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Empleado'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 *       404:
 *         description: Empleado no encontrado
 */
router.get(
  "/:id",
  validateParams(
    idParamSchema
  ),
  empleadoController.getById
);

/**
 * @openapi
 * /api/empleados:
 *   post:
 *     tags:
 *       - Empleados
 *     summary: Crear una ficha de empleado
 *     description: >
 *       Vincula una cuenta de usuario existente con una sucursal
 *       y crea su ficha laboral. Requiere rol administrador.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usuario_id
 *               - sucursal_id
 *               - area
 *             properties:
 *               usuario_id:
 *                 type: integer
 *                 example: 3
 *               sucursal_id:
 *                 type: integer
 *                 example: 1
 *               area:
 *                 type: string
 *                 example: Mantenimiento
 *               fecha_contratacion:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: "2026-09-01"
 *     responses:
 *       201:
 *         description: Empleado creado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 *       404:
 *         description: Usuario o sucursal no encontrados
 *       409:
 *         description: El usuario ya posee una ficha de empleado
 *       422:
 *         description: >
 *           Cuenta inactiva, usuario cliente, sucursal inactiva
 *           o fecha de contratación futura.
 */
router.post(
  "/",
  validateBody(
    createEmpleadoSchema
  ),
  empleadoController.create
);

/**
 * @openapi
 * /api/empleados/{id}:
 *   patch:
 *     tags:
 *       - Empleados
 *     summary: Actualizar un empleado
 *     description: >
 *       Permite modificar sucursal, área y fecha de contratación.
 *       El usuario asociado a la ficha no puede reasignarse.
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
 *               sucursal_id:
 *                 type: integer
 *                 example: 1
 *               area:
 *                 type: string
 *                 example: Atención al Cliente
 *               fecha_contratacion:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: "2026-09-01"
 *     responses:
 *       200:
 *         description: Empleado actualizado correctamente
 *       400:
 *         description: Datos o ID inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 *       404:
 *         description: Empleado o sucursal no encontrados
 *       422:
 *         description: Regla de negocio incumplida
 */
router.patch(
  "/:id",
  validateParams(
    idParamSchema
  ),
  validateBody(
    updateEmpleadoSchema
  ),
  empleadoController.update
);

/**
 * @openapi
 * /api/empleados/{id}:
 *   delete:
 *     tags:
 *       - Empleados
 *     summary: Eliminar una ficha de empleado
 *     description: >
 *       Elimina únicamente la ficha laboral. La cuenta de usuario
 *       permanece registrada. No se permite eliminar empleados
 *       que tengan turnos asociados.
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
 *         description: Empleado eliminado correctamente
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 *       404:
 *         description: Empleado no encontrado
 *       409:
 *         description: El empleado tiene turnos asociados
 */
router.delete(
  "/:id",
  validateParams(
    idParamSchema
  ),
  empleadoController.remove
);

export default router;