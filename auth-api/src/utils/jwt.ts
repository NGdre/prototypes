import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env.js";
import { TokenPayload } from "../types/index.js";
import { AppError } from "./AppError.js";

// jwt.verify checks only the signature: it proves the token was signed with
// our secret, but knows nothing about the payload's shape.
// So a token containing e.g. `{ userId: 123 }` (wrong
// type, no email) would pass the signature check.
//
// We need to checks the payload shape at runtime: the result is both
// verified and correctly typed.
const tokenPayloadSchema = z.object({
  userId: z.string().min(1),
  email: z.email(),
});

function verifyToken(token: string, secret: string): TokenPayload {
  const decoded = jwt.verify(token, secret);
  const parsed = tokenPayloadSchema.safeParse(decoded);
  if (!parsed.success) {
    throw new AppError(401, "Invalid or expired token", "INVALID_TOKEN");
  }
  return parsed.data;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRY,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRY,
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): TokenPayload =>
  verifyToken(token, env.JWT_ACCESS_SECRET);

export const verifyRefreshToken = (token: string): TokenPayload =>
  verifyToken(token, env.JWT_REFRESH_SECRET);
