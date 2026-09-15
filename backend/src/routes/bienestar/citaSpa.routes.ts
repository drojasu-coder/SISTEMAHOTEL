import { Router } from "express";
import * as controller from "../../controllers/bienestar/citaSpa.controller";
import { validateBody, validateParams } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";
import { createCitaSpaSchema, updateCitaSpaSchema } from "../../validators/bienestar/citaSpa.validator";
import { idParamSchema } from "../../validators/common.validator";

const router = Router();

router.use(authMiddleware);

router.post("/", validateBody(createCitaSpaSchema), controller.create);
router.get("/", requireRole(ROLES.ADMIN), controller.getAll);
router.get("/:id", requireRole(ROLES.ADMIN), validateParams(idParamSchema), controller.getById);
router.patch("/:id/estado", requireRole(ROLES.ADMIN), validateParams(idParamSchema), validateBody(updateCitaSpaSchema), controller.updateStatus);

export default router;