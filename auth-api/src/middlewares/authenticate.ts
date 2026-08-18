import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../types/index.js";
import { AppError } from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/jwt.js";

export const authenticate = (
  req: Request,
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
  if (!token) {
    return next(
      new AppError(401, "Access token missing", "ACCESS_TOKEN_MISSING"),
    );
  }
  try {
    const decoded = verifyAccessToken(token);
    (req as AuthenticatedRequest).userId = decoded.userId;
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
