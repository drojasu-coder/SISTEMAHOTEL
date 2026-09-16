import {
  Router,
} from "express";

import {
  requireRole,
} from "../middlewares/role.middleware";

import {
  ROLES,
} from "../constants/roles";

import * as authController
  from "../controllers/auth.controller";

import {
  validateBody,
} from "../middlewares/validate.middleware";

import {
  authMiddleware,
} from "../middlewares/auth.middleware";

import {
  loginSchema,
  registerSchema,
} from "../validators/auth.validator";

const router =
  Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Registrar un nuevo cliente
 *     description: >
 *       Crea una nueva cuenta de usuario. El registro público
 *       siempre asigna automáticamente el rol cliente y activa
 *       la cuenta. La contraseña se almacena mediante hash y
 *       nunca es devuelta por la API.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRegisterRequest'
 *           example:
 *             nombre: Carlos Calán
 *             email: carlos@hotel.com
 *             password: Hotel1234
 *             telefono: "55555555"
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
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
 *                   example: Usuario registrado correctamente
 *                 data:
 *                   $ref: '#/components/schemas/AuthUser'
 *       400:
 *         description: Datos de registro inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       409:
 *         description: El correo electrónico ya se encuentra registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/register",
  validateBody(
    registerSchema
  ),
  authController.register
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Iniciar sesión
 *     description: >
 *       Valida las credenciales del usuario y devuelve un JWT
 *       de acceso. Por seguridad, la API no indica si falló
 *       específicamente el correo o la contraseña.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthLoginRequest'
 *           example:
 *             email: carlos@hotel.com
 *             password: Hotel1234
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
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
 *                   example: Inicio de sesión exitoso
 *                 data:
 *                   $ref: '#/components/schemas/AuthLoginData'
 *       400:
 *         description: Formato de credenciales inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Correo electrónico o contraseña incorrectos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: La cuenta del usuario se encuentra deshabilitada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/login",
  validateBody(
    loginSchema
  ),
  authController.login
);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Autenticación
 *     summary: Obtener el usuario autenticado
 *     description: >
 *       Obtiene la información actual del usuario asociado
 *       al JWT. El estado y el rol se consultan nuevamente
 *       en PostgreSQL, por lo que los cambios realizados
 *       después de emitir el token son respetados.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuario autenticado obtenido correctamente
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
 *                   example: Usuario autenticado
 *                 data:
 *                   $ref: '#/components/schemas/AuthUser'
 *       401:
 *         description: >
 *           Token ausente, inválido, expirado o correspondiente
 *           a un usuario que ya no existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: >
 *           Cuenta deshabilitada o con un rol no reconocido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/me",
  authMiddleware,
  authController.me
);

/**
 * @openapi
 * /api/auth/admin-test:
 *   get:
 *     tags:
 *       - Autenticación
 *     summary: Verificar acceso de administrador
 *     description: >
 *       Endpoint auxiliar para comprobar autenticación y
 *       autorización basada en el rol admin.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Acceso de administrador autorizado
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
 *                   example: Acceso de administrador autorizado
 *       401:
 *         description: Usuario no autenticado o token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: >
 *           El usuario no posee rol admin, está inactivo
 *           o tiene un rol no válido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/admin-test",
  authMiddleware,
  requireRole(
    ROLES.ADMIN
  ),
  (
    _req,
    res
  ) => {
    res.status(200).json({
      success: true,
      statusCode: 200,
      message:
        "Acceso de administrador autorizado",
    });
  }
);

export default router;