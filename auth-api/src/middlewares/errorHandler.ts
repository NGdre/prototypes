import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger.js";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.error(err.message, { stack: err.stack });

  if (err.message === "Email already registered") {
    return res.status(409).json({ message: err.message });
  }
  if (err.message === "Invalid credentials") {
    return res.status(401).json({ message: err.message });
  }
  if (err.message === "Current password is incorrect") {
    return res.status(401).json({ message: err.message });
  }
  if (err.message === "Invalid or expired token") {
    return res.status(400).json({ message: err.message });
  }
  if (err.message === "Email already verified") {
    return res.status(409).json({ message: err.message });
  }
  if (err.message === "New email must be different from current email") {
    return res.status(400).json({ message: err.message });
  }
  if (err.message === "User not found") {
    return res.status(404).json({ message: err.message });
  }
  if (
    err.message === "Invalid refresh token" ||
    err.message.startsWith("Refresh token reused")
  ) {
    return res.status(401).json({ message: err.message });
  }

  return res.status(500).json({ message: "Internal server error" });
};
