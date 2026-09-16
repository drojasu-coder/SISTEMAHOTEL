import { Router } from "express";
import * as controller from "../../controllers/restaurante/reservaMesa.controller";
import { validateBody, validateParams } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";
import { createReservaMesaSchema, updateReservaMesaSchema } from "../../validators/restaurante/reservaMesa.validator";
import { idParamSchema } from "../../validators/common.validator";

const router = Router();

// Todas las reservas requieren inicio de sesión
router.use(authMiddleware);

// Cualquier usuario puede crear una reserva para sí mismo
router.post("/", validateBody(createReservaMesaSchema), controller.create);

// Solo el Admin (o Gerente) puede ver TODAS las reservas del restaurante
router.get("/", requireRole(ROLES.ADMIN), controller.getAll);
router.get("/:id", requireRole(ROLES.ADMIN), validateParams(idParamSchema), controller.getById);
router.patch("/:id/estado", requireRole(ROLES.ADMIN), validateParams(idParamSchema), validateBody(updateReservaMesaSchema), controller.updateStatus);

export default router;