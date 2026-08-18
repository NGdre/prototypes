import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");

// Schemas are the single source of truth: the validate middleware checks
// bodies against them at runtime, and the z.infer types below give the
// controller handlers the same shape at compile time.

export const registerSchema = z.object({
  email: z.email("Invalid email"),
  password: passwordSchema,
});
export type RegisterBody = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});
export type LoginBody = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});
export type ChangePasswordBody = z.infer<typeof changePasswordSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email("Invalid email"),
});
export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: passwordSchema,
});
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});
export type VerifyEmailBody = z.infer<typeof verifyEmailSchema>;

export const changeEmailSchema = z.object({
  newEmail: z.email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});
export type ChangeEmailBody = z.infer<typeof changeEmailSchema>;

export const confirmEmailChangeSchema = z.object({
  token: z.string().min(1, "Token is required"),
});
export type ConfirmEmailChangeBody = z.infer<typeof confirmEmailChangeSchema>;