import { Router } from "express";
import * as pagoController from "../../controllers/pagos/pago.controller";
import { validateBody } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { createPaymentIntentSchema } from "../../validators/pagos/pago.validator";

const router = Router();

// 1. RUTAS PUBLICAS (Como el Webhook que llama Stripe)
router.post("/webhook", pagoController.webhookStripe);


// 2. BARRERA DE SEGURIDAD
router.use(authMiddleware); // A partir de aqui, TODO pide login


// 
// 3. RUTAS PROTEGIDAS (Solo usuarios logueados)
router.post(
  "/intent", 
  validateBody(createPaymentIntentSchema), 
  pagoController.createPaymentIntent // Corregido el nombre de la funcion
);

export default router;