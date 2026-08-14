import { Request, Response } from "express";
import { AuthService } from "../services/auth.service.js";
import { AuthRequest } from "../types/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await AuthService.register(email, password);
    res.status(201).json(result);
  });

  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.status(200).json(result);
  });

  static refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }
    const tokens = await AuthService.refreshTokens(refreshToken);
    res.status(200).json(tokens);
  });

  static logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }
    res.status(204).send();
  });

  static me = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await AuthService.getProfile(req.userId!);
    res.status(200).json({ user });
  });

  static changePassword = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const { currentPassword, newPassword } = req.body;

      await AuthService.changePassword(
        req.userId!,
        currentPassword,
        newPassword,
      );
      res.status(200).json({ message: "Password updated successfully" });
    },
  );

  static forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    await AuthService.requestPasswordReset(email);
    res.status(200).json({
      message: "A password reset link has been sent",
    });
  });

  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    await AuthService.resetPassword(token, newPassword);
    res.status(200).json({ message: "Password reset successfully" });
  });

  static verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;
    await AuthService.verifyEmail(token);
    res.status(200).json({ message: "Email verified successfully" });
  });

  static resendVerification = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      await AuthService.resendVerification(req.userId!);
      res.status(200).json({ message: "Verification email sent" });
    },
  );

  static changeEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { newEmail, password } = req.body;
    await AuthService.requestEmailChange(req.userId!, newEmail, password);
    res.status(200).json({
      message: "Confirmation link sent to the new email address",
    });
  });

  static confirmEmailChange = asyncHandler(
    async (req: Request, res: Response) => {
      const { token } = req.body;
      await AuthService.confirmEmailChange(token);
      res.status(200).json({ message: "Email updated successfully" });
    },
  );
}
