import { Router } from "express";
import * as reservaAmenidadController from "../../controllers/amenidades/reservaAmenidad.controller";
import { validateBody, validateParams } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";
import { createReservaAmenidadSchema, updateReservaAmenidadSchema } from "../../validators/amenidades/reservaAmenidad.validator";
import { idParamSchema } from "../../validators/common.validator";

const router = Router();

router.use(authMiddleware);

// Clientes y admins pueden reservar
router.post(
  "/",
  validateBody(createReservaAmenidadSchema),
  reservaAmenidadController.create
);

// Solo admins o encargados pueden ver el total de las reservas
router.get("/", requireRole(ROLES.ADMIN), reservaAmenidadController.getAll);

router.get("/:id", requireRole(ROLES.ADMIN), validateParams(idParamSchema), reservaAmenidadController.getById);

router.patch(
  "/:id/estado",
  requireRole(ROLES.ADMIN),
  validateParams(idParamSchema),
  validateBody(updateReservaAmenidadSchema),
  reservaAmenidadController.updateStatus
);

export default router;