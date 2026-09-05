import { Router } from "express";
import { AuthController } from "../controllers/authController.js";
import { domainValidation } from "../middleware/domainValidation.js";
import { loginSchema } from "../validations/authValidation.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/login", domainValidation({ body: loginSchema }), AuthController.login);
router.post("/logout", authenticate, AuthController.logout);
router.get("/me", authenticate, AuthController.getMe);

export default router;
