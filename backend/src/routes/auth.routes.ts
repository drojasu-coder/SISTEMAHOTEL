import {Router} from "express";

import {requireRole } from "../middlewares/role.middleware";
import {ROLES} from "../constants/roles";
import * as authController from "../controllers/auth.controller";
import {validateBody} from "../middlewares/validate.middleware";
import {authMiddleware} from "../middlewares/auth.middleware";
import{
    loginSchema,
    registerSchema,
} from "../validators/auth.validator";

const router = Router();

router.post(
    "/register",
    validateBody(registerSchema),
    authController.register
);

router.post(
    "/login",
    validateBody(loginSchema),
    authController.login
);

router.get(
    "/me",
    authMiddleware,
    authController.me
);

router.get(
    "/admin-test",
    authMiddleware,
    requireRole(ROLES.ADMIN),
    (_req,res) =>{
        res.status(200).json({
            success: true,
            statusCode:200,
            message: "Acceso de administrador autorizado",
        });
    }
);

export default router;