import { Router } from "express";
import * as reservaActividadController from "../../controllers/actividades/reservaActividad.controller";
import { validateBody, validateParams } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";
import { createReservaActividadSchema, updateReservaActividadSchema } from "../../validators/actividades/reservaActividad.validator";
import { idParamSchema } from "../../validators/common.validator";

const router = Router();

// Todas las reservas exigen inicio de sesión
router.use(authMiddleware);

// Un cliente o admin puede crear una reserva
router.post(
  "/",
  validateBody(createReservaActividadSchema),
  reservaActividadController.create
);

// Solo administradores (o encargados) pueden ver todas las reservas globales
router.get(
  "/",
  requireRole(ROLES.ADMIN),
  reservaActividadController.getAll
);

router.get(
  "/:id",
  requireRole(ROLES.ADMIN),
  validateParams(idParamSchema),
  reservaActividadController.getById
);

// Actualizar estado (ej. cancelada)
router.patch(
  "/:id/estado",
  requireRole(ROLES.ADMIN),
  validateParams(idParamSchema),
  validateBody(updateReservaActividadSchema),
  reservaActividadController.updateStatus
);

export default router;