import {Router} from "express";

import * as authController from "../controllers/auth.controller";
import {validateBody} from "../middlewares/validate.middleware";
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

export default router;