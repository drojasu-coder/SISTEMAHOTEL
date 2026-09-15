import { Router } from "express";
import * as pagoController from "../../controllers/pagos/pago.controller";
import { validateBody } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { createPaymentIntentSchema } from "../../validators/pagos/pago.validator";

const router = Router();

router.use(authMiddleware); //solo usuarios logueados pueden pagar

router.post("/intent", validateBody(createPaymentIntentSchema), pagoController.createIntent);

export default router;
