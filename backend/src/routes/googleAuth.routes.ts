import { Router, RequestHandler } from "express";
import { z } from "zod";
import { env } from "../config/env";
import { configuredOrigins, authenticationRateLimiter } from "../config/httpSecurity";
import { createRateLimiter } from "../middlewares/rateLimit.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import { AppError } from "../utils/AppError";
import { createGoogleChallenge, loginWithGoogle } from "../services/googleAuth.service";

export const googleLoginSchema = z.object({
  credential: z.string().min(1).max(16384),
  challengeId: z.string().uuid(),
  password: z.string().min(1).max(256).optional(),
}).strict();

// GIS callback JavaScript, no POST de redirección ni autenticación por cookies.
// Origin + JSON + cabecera no simple obligan al navegador a superar el preflight.
// El nonce de servidor también se verifica dentro del JWT y se consume una sola vez.
export const googleRequestGuard: RequestHandler = (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  if (!env.GOOGLE_LOGIN_ENABLED) return next(new AppError(503, "GOOGLE_DISABLED", "El acceso con Google no está disponible"));
  const origin = req.get("Origin");
  if (!origin || !configuredOrigins.includes(origin) || !req.is("application/json") || !req.get("X-Google-CSRF")) {
    return next(new AppError(403, "GOOGLE_CSRF_REJECTED", "No se pudo verificar el origen de la solicitud"));
  }
  next();
};

const router = Router();
const limiter = createRateLimiter({ max: 10, windowMs: 15 * 60 * 1000 });
router.use(googleRequestGuard, authenticationRateLimiter, limiter.middleware);

/**
 * @openapi
 * /api/auth/google/challenge:
 *   post:
 *     tags: [Autenticación]
 *     summary: Preparar Google Identity Services (nonce válido diez minutos)
 *     description: Requiere Origin permitido, Content-Type application/json y X-Google-CSRF init. No utiliza cookies. Devuelve data con challengeId, nonce, expiresAt y clientId. No almacenar estos valores ni cachear la respuesta.
 *     security: []
 *     responses:
 *       200:
 *         description: Desafío creado
 *       403:
 *         description: Origen o cabecera inválidos
 *       429:
 *         description: Demasiados intentos
 *       503:
 *         description: Google deshabilitado o servicio no disponible
 */
router.post("/challenge", validateBody(z.object({}).strict()), async (req, res) => {
  if (req.get("X-Google-CSRF") !== "init") throw new AppError(403, "GOOGLE_CSRF_REJECTED", "Solicitud inválida");
  res.json({ success: true, statusCode: 200, data: await createGoogleChallenge() });
});

/**
 * @openapi
 * /api/auth/google:
 *   post:
 *     tags: [Autenticación]
 *     summary: Iniciar sesión o registrar un cliente con Google
 *     description: Requiere Origin permitido y X-Google-CSRF igual al nonce del desafío. Ante GOOGLE_LINK_REQUIRED se solicita consentimiento y la contraseña vigente, y se repite con el mismo credential/challengeId/nonce. No vincula por correo automáticamente. El nonce se consume al completar la transacción; tras vencimiento o éxito se requiere otro desafío y otro ID token.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required: [credential, challengeId]
 *             properties:
 *               credential:
 *                 type: string
 *                 maxLength: 16384
 *               challengeId:
 *                 type: string
 *                 format: uuid
 *               password:
 *                 type: string
 *                 maxLength: 256
 *     responses:
 *       200:
 *         description: Mismo JWT y perfil que login tradicional
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Token, correo verificado, desafío o contraseña inválidos
 *       403:
 *         description: CSRF, cuenta inactiva o cuenta del personal
 *       409:
 *         description: Confirmación de contraseña requerida, vínculo incompatible o concurrencia; nunca se vincula automáticamente
 *       429:
 *         description: Demasiados intentos
 *       503:
 *         description: Google deshabilitado o servicio no disponible
 */
router.post("/", validateBody(googleLoginSchema), async (req, res) => {
  const nonce = req.get("X-Google-CSRF")!;
  if (!/^[A-Za-z0-9_-]{43}$/.test(nonce)) throw new AppError(403, "GOOGLE_CSRF_REJECTED", "Solicitud inválida");
  const data = await loginWithGoogle(req.body, nonce);
  res.json({ success: true, statusCode: 200, message: "Inicio de sesión exitoso", data });
});

export default router;
