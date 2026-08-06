import { Request } from "express";

export interface IUser {
  id: string;
  email: string;
  password: string;
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

export interface AuthRequest extends Request {
  userId?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
}
