import { Router } from "express";
import * as controller from "../../controllers/bienestar/terapeuta.controller";
import { validateBody, validateParams } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";
import { createTerapeutaSchema, updateTerapeutaSchema } from "../../validators/bienestar/terapeuta.validator";
import { idParamSchema } from "../../validators/common.validator";

const router = Router();

router.get("/", controller.getAll);
router.get("/:id", validateParams(idParamSchema), controller.getById);

router.use(authMiddleware);
router.use(requireRole(ROLES.ADMIN));

router.post("/", validateBody(createTerapeutaSchema), controller.create);
router.patch("/:id", validateParams(idParamSchema), validateBody(updateTerapeutaSchema), controller.update);
router.delete("/:id", validateParams(idParamSchema), controller.remove);

export default router;