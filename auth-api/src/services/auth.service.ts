import { RefreshTokenModel } from "../models/refreshToken.model.js";
import { UserModel } from "../models/user.model.js";
import { TokenPayload } from "../types/index.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

export class AuthService {
  static async register(email: string, password: string) {
    const existing = await UserModel.findByEmail(email);
    if (existing) throw new Error("Email already registered");

    const user = await UserModel.create(email, password);
    const payload: TokenPayload = { userId: user.id, email };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 дней
    await RefreshTokenModel.create(user.id, refreshToken, expiresAt);

    return {
      user: { id: user.id, email: user.email },
      accessToken,
      refreshToken,
    };
  }

  static async login(email: string, password: string) {
    const user = await UserModel.findByEmail(email);
    if (!user) throw new Error("Invalid credentials");

    const isMatch = await UserModel.comparePassword(user, password);
    if (!isMatch) throw new Error("Invalid credentials");

    const payload: TokenPayload = { userId: user.id, email };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await RefreshTokenModel.create(user.id, refreshToken, expiresAt);

    return {
      user: { id: user.id, email: user.email },
      accessToken,
      refreshToken,
    };
  }

  static async refreshTokens(oldRefreshToken: string) {
    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(oldRefreshToken);
    } catch (err) {
      throw new Error("Invalid refresh token");
    }

    const stored = await RefreshTokenModel.findByToken(oldRefreshToken);
    if (!stored || stored.expires_at < new Date()) {
      if (stored) {
        await RefreshTokenModel.deleteAllForUser(payload.userId);
      }
      throw new Error("Refresh token reused or expired – all tokens revoked");
    }

    await RefreshTokenModel.deleteByToken(oldRefreshToken);

    const newPayload: TokenPayload = {
      userId: payload.userId,
      email: payload.email,
    };
    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await RefreshTokenModel.create(payload.userId, newRefreshToken, expiresAt);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  static async logout(refreshToken: string) {
    await RefreshTokenModel.deleteByToken(refreshToken);
  }

  static async getProfile(userId: string) {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("User not found");
    return user;
  }
}
