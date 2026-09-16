import { Router } from "express";
import * as controller from "../../controllers/bienestar/servicioSpa.controller";
import { validateBody, validateParams } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";
import { createServicioSpaSchema, updateServicioSpaSchema } from "../../validators/bienestar/servicioSpa.validator";
import { idParamSchema } from "../../validators/common.validator";

const router = Router();

router.get("/", controller.getAll);
router.get("/:id", validateParams(idParamSchema), controller.getById);

router.use(authMiddleware);
router.use(requireRole(ROLES.ADMIN));

router.post("/", validateBody(createServicioSpaSchema), controller.create);
router.patch("/:id", validateParams(idParamSchema), validateBody(updateServicioSpaSchema), controller.update);
router.delete("/:id", validateParams(idParamSchema), controller.remove);

export default router;