import { Router } from "express";
import { z } from "zod";
import { AuthController } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { credentialRateLimiter } from "../middlewares/rateLimiter.js";
import { validate } from "../middlewares/validate.js";

const router: Router = Router();

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");

const registerSchema = z.object({
  email: z.email("Invalid email"),
  password: passwordSchema,
});

const loginSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

const forgotPasswordSchema = z.object({
  email: z.email("Invalid email"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: passwordSchema,
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

const changeEmailSchema = z.object({
  newEmail: z.email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

const confirmEmailChangeSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

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
