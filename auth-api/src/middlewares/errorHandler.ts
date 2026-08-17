import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";

// JSON body parser (express.json) rejects malformed payloads with a
// SyntaxError that carries status 400.
function isBodyParserError(err: Error): err is Error & { status: number } {
  return err instanceof SyntaxError && "status" in err && err.status === 400;
}

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = 500;
  let code = "INTERNAL_ERROR";
  let message = "Internal server error";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = err.issues.map((issue) => issue.message).join(", ");
  } else if (isBodyParserError(err)) {
    statusCode = 400;
    code = "INVALID_JSON";
    message = "Invalid JSON payload";
  }

  // Expected client errors are not "error"-level: they are normal business
  // outcomes (bad password, expired token), not failures of the server.
  if (statusCode >= 500) {
    logger.error(err.message, { code, stack: err.stack, path: req.path });
  } else {
    logger.warn(err.message, { code, path: req.path });
  }

  const body: Record<string, unknown> = { message, code };
  if (statusCode >= 500 && env.NODE_ENV !== "production") {
    body.stack = err.stack;
  }
  res.status(statusCode).json(body);
};