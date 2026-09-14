import { Router } from "express";
import * as amenidadController from "../../controllers/amenidades/amenidad.controller";
import { validateBody, validateParams } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";
import { createAmenidadSchema, updateAmenidadSchema } from "../../validators/amenidades/amenidad.validator";
import { idParamSchema } from "../../validators/common.validator";

const router = Router();

router.get("/", amenidadController.getAll);
router.get("/:id", validateParams(idParamSchema), amenidadController.getById);

router.use(authMiddleware);
router.use(requireRole(ROLES.ADMIN));

router.post("/", validateBody(createAmenidadSchema), amenidadController.create);
router.patch("/:id", validateParams(idParamSchema), validateBody(updateAmenidadSchema), amenidadController.update);
router.delete("/:id", validateParams(idParamSchema), amenidadController.remove);

export default router;