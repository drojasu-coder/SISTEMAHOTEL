import {Router} from "express";

import * as authController from "../controllers/auth.controller";
import {validateBody} from "../middlewares/validate.middleware";
import {authMiddleware} from "../middlewares/auth.middleware";
import{
    loginSchema,
    registerSchema,
} from "../validators/auth.validator";

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Registrar un nuevo usuario
 *     description: Crea una cuenta nueva. Por defecto, todas las cuentas creadas aquí tienen el rol "cliente".
 *     security: []
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
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Juan Pérez"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan.perez@ejemplo.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Password123!"
 *               telefono:
 *                 type: string
 *                 example: "55551234"
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 201
 *               data:
 *                 id: 1
 *                 nombre: "Juan Pérez"
 *                 email: "juan.perez@ejemplo.com"
 *                 telefono: "55551234"
 *                 rol: "cliente"
 *                 activo: true
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: El correo electrónico ya se encuentra registrado
 */
router.post(
    "/register",
    validateBody(registerSchema),
    authController.register
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Iniciar sesión
 *     description: Inicia sesión y devuelve un JWT (accessToken) y la información del usuario.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan.perez@ejemplo.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Password123!"
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               data:
 *                 accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 usuario:
 *                   id: 1
 *                   nombre: "Juan Pérez"
 *                   email: "juan.perez@ejemplo.com"
 *                   telefono: "55551234"
 *                   rol: "cliente"
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Correo electrónico o contraseña incorrectos
 *       403:
 *         description: La cuenta de usuario se encuentra deshabilitada
 */
router.post(
    "/login",
    validateBody(loginSchema),
    authController.login
);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Autenticación
 *     summary: Obtener perfil del usuario actual
 *     description: Devuelve la información del usuario autenticado según su JWT.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información del usuario obtenida correctamente
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               data:
 *                 id: 1
 *                 nombre: "Juan Pérez"
 *                 email: "juan.perez@ejemplo.com"
 *                 telefono: "55551234"
 *                 rol: "cliente"
 *                 activo: true
 *       401:
 *         description: Usuario no autenticado o sesión expirada
 *       403:
 *         description: La cuenta de usuario se encuentra deshabilitada
 */
router.get(
    "/me",
    authMiddleware,
    authController.me
);

export default router;