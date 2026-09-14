import { Router } from "express";
import * as instructorController from "../../controllers/actividades/instructor.controller";
import { validateBody, validateParams } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";
import { createInstructorSchema, updateInstructorSchema } from "../../validators/actividades/instructor.validator";
import { idParamSchema } from "../../validators/common.validator";

const router = Router();

router.get("/", instructorController.getAll);
router.get("/:id", validateParams(idParamSchema), instructorController.getById);

router.use(authMiddleware);
router.use(requireRole(ROLES.ADMIN));

router.post("/", validateBody(createInstructorSchema), instructorController.create);
router.patch("/:id", validateParams(idParamSchema), validateBody(updateInstructorSchema), instructorController.update);
router.delete("/:id", validateParams(idParamSchema), instructorController.remove);

export default router;