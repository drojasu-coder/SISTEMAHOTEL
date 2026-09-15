import { Router } from "express";
import * as controller from "../../controllers/parque/boletoParque.controller";
import { validateBody, validateParams } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";
import { createBoletoParqueSchema, updateBoletoParqueSchema } from "../../validators/parque/boletoParque.validator";
import { idParamSchema } from "../../validators/common.validator";

const router = Router();

router.use(authMiddleware);

// Cualquier usuario autenticado puede comprar/adquirir boletos de parque
router.post("/", validateBody(createBoletoParqueSchema), controller.create);

// Solo administradores pueden gestionar y listar todos los boletos emitidos
router.get("/", requireRole(ROLES.ADMIN), controller.getAll);
router.get("/:id", requireRole(ROLES.ADMIN), validateParams(idParamSchema), controller.getById);
router.patch("/:id/estado", requireRole(ROLES.ADMIN), validateParams(idParamSchema), validateBody(updateBoletoParqueSchema), controller.updateStatus);
router.delete("/:id", requireRole(ROLES.ADMIN), validateParams(idParamSchema), controller.remove);

export default router;