import { Response } from "express";
import { env, parseExpiryToMs } from "../config/env.js";

export const REFRESH_COOKIE_NAME = "refreshToken";

export const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/api/auth",
  maxAge: parseExpiryToMs(env.REFRESH_TOKEN_EXPIRY),
};

export const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions);
};

export const clearRefreshTokenCookie = (res: Response): void => {
  const { maxAge: _maxAge, ...clearOptions } = refreshCookieOptions;
  res.clearCookie(REFRESH_COOKIE_NAME, clearOptions);
};