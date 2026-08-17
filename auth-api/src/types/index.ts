import { Request } from "express";

export interface IRefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

export type VerificationTokenType =
  | "password_reset"
  | "email_verify"
  | "email_change";

export interface AuthRequest extends Request {
  userId?: string;
}

// For handlers mounted behind the authenticate middleware: it has already
// resolved and assigned req.userId, so the field is guaranteed to be set
// (no non-null assertions needed in handlers).
export interface AuthenticatedRequest extends Request {
  userId: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface UserProfile {
  id: string;
  email: string;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  created_at: Date;
  updated_at: Date;
}
