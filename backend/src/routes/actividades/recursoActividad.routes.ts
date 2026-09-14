import { Router } from "express";
import * as recursoController from "../../controllers/actividades/recursoActividad.controller";
import { validateBody, validateParams } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";
import { createRecursoActividadSchema, updateRecursoActividadSchema } from "../../validators/actividades/recursoActividad.validator";
import { idParamSchema } from "../../validators/common.validator";

const router = Router();

router.get("/", recursoController.getAll);
router.get("/:id", validateParams(idParamSchema), recursoController.getById);

router.use(authMiddleware);
router.use(requireRole(ROLES.ADMIN));

router.post("/", validateBody(createRecursoActividadSchema), recursoController.create);
router.patch("/:id", validateParams(idParamSchema), validateBody(updateRecursoActividadSchema), recursoController.update);
router.delete("/:id", validateParams(idParamSchema), recursoController.remove);

export default router;