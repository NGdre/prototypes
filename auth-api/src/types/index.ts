import { Request } from "express";

export type VerificationTokenType =
  | "password_reset"
  | "email_verify"
  | "email_change";

// For handlers mounted behind the authenticate middleware: it has already
// resolved and assigned req.userId, so the field is guaranteed to be set.
// ReqBody types the request body, e.g. AuthenticatedRequest<ChangePasswordBody>.
export interface AuthenticatedRequest<ReqBody = any> extends Request<
  {},
  {},
  ReqBody
> {
  userId: string;
}

export type BodyRequest<ReqBody = any> = Request<{}, {}, ReqBody>;

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

export interface PublicUser {
  id: string;
  email: string;
  emailVerified: boolean;
}

export interface LoginResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}
