import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { credentialRateLimiter } from "../middlewares/rateLimiter.js";
import { validate } from "../middlewares/validate.js";
import {
  changeEmailSchema,
  changePasswordSchema,
  confirmEmailChangeSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../schemas/auth.schema.js";

const router: Router = Router();

router.post("/register", validate(registerSchema), AuthController.register);
router.post(
  "/login",
  validate(loginSchema),
  credentialRateLimiter,
  AuthController.login,
);
router.post("/refresh", AuthController.refresh);
router.post("/logout", AuthController.logout);
router.get("/me", authenticate, AuthController.me);

router.patch(
  "/password",
  authenticate,
  validate(changePasswordSchema),
  AuthController.changePassword,
);

router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  credentialRateLimiter,
  AuthController.forgotPassword,
);

router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  AuthController.resetPassword,
);

router.post(
  "/verify-email",
  validate(verifyEmailSchema),
  AuthController.verifyEmail,
);

router.post(
  "/resend-verification",
  authenticate,
  AuthController.resendVerification,
);

router.post(
  "/change-email",
  authenticate,
  validate(changeEmailSchema),
  AuthController.changeEmail,
);

router.post(
  "/confirm-email-change",
  validate(confirmEmailChangeSchema),
  AuthController.confirmEmailChange,
);

export default router;