import {Router} from "express";

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

export default router;