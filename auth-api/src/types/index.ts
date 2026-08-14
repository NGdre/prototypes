import { Request } from "express";

export interface IUser {
  id: string;
  email: string;
  password: string;
  email_verified: boolean;
  email_verified_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

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
