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
}
