import { NextFunction, Response } from "express";
import { AuthRequest } from "../types/index.js";
import { AppError } from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/jwt.js";

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(
      new AppError(401, "Access token missing", "ACCESS_TOKEN_MISSING"),
    );
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyAccessToken(token);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    next(
      new AppError(
        401,
        "Invalid or expired access token",
        "ACCESS_TOKEN_INVALID",
      ),
    );
  }
};