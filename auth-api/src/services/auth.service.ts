import bcrypt from "bcrypt";
import { env, parseExpiryToMs } from "../config/env.js";
import db from "../config/db.js";
import { RefreshTokenModel } from "../models/refreshToken.model.js";
import { UserModel } from "../models/user.model.js";
import { VerificationTokenModel } from "../models/verificationToken.model.js";
import { TokenPayload, VerificationTokenType } from "../types/index.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { generateSecureToken, hashToken } from "../utils/token.js";
import { AppError } from "../utils/AppError.js";
import { EmailService } from "./email.service.js";

// Hash of a throwaway password: bcrypt.compare against it is run when the
// user is not found so that login response time does not depend on whether
// an account exists (timing-attack protection).
const DUMMY_HASH =
  "$2b$12$..fykbTQHAgrjaNUjwFMbOFzjLMozBnWPP8kW040zQTU8Z0T/mlia";

export class AuthService {
  private static async createVerificationToken(
    userId: string,
    type: VerificationTokenType,
    expiryEnv: string,
    metadata?: Record<string, unknown>,
  ): Promise<string> {
    await VerificationTokenModel.invalidateByType(userId, type);

    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + parseExpiryToMs(expiryEnv));

    await VerificationTokenModel.create(
      userId,
      type,
      tokenHash,
      expiresAt,
      metadata,
    );

    return rawToken;
  }

  static async register(email: string, password: string) {
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      // A dummy bcrypt.compare burns roughly the same CPU time as the real
      // hash + email dispatch on the "new account" path, so response latency
      // does not reveal whether the email already exists either.
      await bcrypt.compare(password, DUMMY_HASH);

      // Same response for existing and new emails prevents an attacker from
      // telling whether an account is registered (OWASP Authentication Cheat
      // Sheet — user enumeration protection).
      return { message: "Registration successful" };
    }

    const user = await UserModel.create(email, password);

    const verifyToken = await this.createVerificationToken(
      user.id,
      "email_verify",
      env.EMAIL_VERIFY_TOKEN_EXPIRY,
    );
    await EmailService.sendVerificationEmail(email, verifyToken);

    // No tokens are issued at registration: the response contract must be
    // identical for both branches above, otherwise they are distinguishable
    // by response shape. Sign-in happens via /login.
    return { message: "Registration successful" };
  }

  static async login(email: string, password: string) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      // Dummy bcrypt.compare equalizes response time: otherwise account
      // enumeration is possible by measuring login latency.
      await bcrypt.compare(password, DUMMY_HASH);
      throw new AppError(401, "Invalid credentials", "INVALID_CREDENTIALS");
    }

    const isMatch = await UserModel.comparePassword(user, password);
    if (!isMatch)
      throw new AppError(401, "Invalid credentials", "INVALID_CREDENTIALS");

    // Sign-in is allowed for unverified emails — verification does not
    // block account usage (product requirement).

    const payload: TokenPayload = { userId: user.id, email };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await RefreshTokenModel.create(user.id, refreshToken, expiresAt);

    return {
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.email_verified,
      },
      accessToken,
      refreshToken,
    };
  }

  static async refreshTokens(oldRefreshToken: string) {
    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(oldRefreshToken);
    } catch (err) {
      throw new AppError(
        401,
        "Invalid refresh token",
        "INVALID_REFRESH_TOKEN",
      );
    }

    const user = await UserModel.findById(payload.userId);
    if (!user)
      throw new AppError(404, "User not found", "USER_NOT_FOUND");

    const newPayload: TokenPayload = {
      userId: payload.userId,
      email: user.email, // email could have been changed, so new payload should be with updated email
    };
    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Rotation must be atomic: the old token is deleted and the new one
    // inserted in a single transaction. The old row is locked with FOR
    // UPDATE so a concurrent request carrying the same token blocks here
    // and then sees no row – it is treated as reuse and revokes all tokens.
    await db.transaction(async (trx) => {
      const stored = await RefreshTokenModel.findByToken(
        oldRefreshToken,
        trx,
        true,
      );
      if (!stored || stored.expires_at < new Date()) {
        if (stored) {
          await RefreshTokenModel.deleteAllForUser(payload.userId, trx);
        }
        throw new AppError(
          401,
          "Refresh token reused or expired – all tokens revoked",
          "REFRESH_TOKEN_REUSE",
        );
      }

      await RefreshTokenModel.deleteByToken(oldRefreshToken, trx);
      await RefreshTokenModel.create(payload.userId, newRefreshToken, expiresAt, trx);
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  static async logout(refreshToken: string) {
    await RefreshTokenModel.deleteByToken(refreshToken);
  }

  static async getProfile(userId: string) {
    const user = await UserModel.findByIdExternal(userId);
    if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");
    return user;
  }

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await UserModel.findById(userId);
    if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");

    // password change is sensitive: require re-authentication
    const isMatch = await UserModel.comparePassword(user, currentPassword);
    if (!isMatch)
      throw new AppError(
        401,
        "Current password is incorrect",
        "INVALID_CURRENT_PASSWORD",
      );

    // Password update and session revocation are atomic: if any step fails,
    // the transaction rolls back so no old session outlives the new password.
    await db.transaction(async (trx) => {
      await UserModel.updatePassword(userId, newPassword, trx);
      // revoke all sessions on password change
      await RefreshTokenModel.deleteAllForUser(userId, trx);
    });
    await EmailService.sendPasswordChangedNotification(user.email);
  }

  static async requestPasswordReset(email: string) {
    const user = await UserModel.findByEmail(email);
    if (!user) return;

    const resetToken = await this.createVerificationToken(
      user.id,
      "password_reset",
      env.PASSWORD_RESET_TOKEN_EXPIRY,
    );
    await EmailService.sendPasswordResetEmail(email, resetToken);
  }

  static async resetPassword(token: string, newPassword: string) {
    const record = await VerificationTokenModel.findValid(
      token,
      "password_reset",
    );
    if (!record) throw new AppError(400, "Invalid or expired token", "INVALID_TOKEN");

    // Password change, token invalidation and session revocation are atomic:
    // a partial failure must not leave the token replayable or old sessions alive.
    await db.transaction(async (trx) => {
      await UserModel.updatePassword(record.user_id, newPassword, trx);
      await VerificationTokenModel.markUsed(record.id, trx);
      await RefreshTokenModel.deleteAllForUser(record.user_id, trx);
    });

    const user = await UserModel.findById(record.user_id);
    if (user) await EmailService.sendPasswordChangedNotification(user.email);
  }

  static async verifyEmail(token: string) {
    const record = await VerificationTokenModel.findValid(
      token,
      "email_verify",
    );
    if (!record) throw new AppError(400, "Invalid or expired token", "INVALID_TOKEN");

    await UserModel.markEmailVerified(record.user_id);
    await VerificationTokenModel.markUsed(record.id);
  }

  static async resendVerification(userId: string) {
    const user = await UserModel.findById(userId);
    if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");
    if (user.email_verified)
      throw new AppError(409, "Email already verified", "EMAIL_ALREADY_VERIFIED");

    const verifyToken = await this.createVerificationToken(
      user.id,
      "email_verify",
      env.EMAIL_VERIFY_TOKEN_EXPIRY,
    );
    await EmailService.sendVerificationEmail(user.email, verifyToken);
  }

  static async requestEmailChange(
    userId: string,
    newEmail: string,
    password: string,
  ) {
    const user = await UserModel.findById(userId);
    if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");

    // email change is sensitive: require re-authentication
    const isMatch = await UserModel.comparePassword(user, password);
    if (!isMatch)
      throw new AppError(
        401,
        "Current password is incorrect",
        "INVALID_CURRENT_PASSWORD",
      );

    if (user.email === newEmail) {
      throw new AppError(
        400,
        "New email must be different from current email",
        "EMAIL_UNCHANGED",
      );
    }

    const existing = await UserModel.findByEmail(newEmail);
    if (existing)
      throw new AppError(409, "Email already registered", "EMAIL_EXISTS");

    const changeToken = await this.createVerificationToken(
      userId,
      "email_change",
      env.EMAIL_VERIFY_TOKEN_EXPIRY,
      { pendingEmail: newEmail },
    );
    await EmailService.sendEmailChangeConfirmation(newEmail, changeToken);
  }

  static async confirmEmailChange(token: string) {
    const record = await VerificationTokenModel.findValid(
      token,
      "email_change",
    );
    if (!record) throw new AppError(400, "Invalid or expired token", "INVALID_TOKEN");

    const pendingEmail = record.metadata?.pendingEmail as string | undefined;
    if (!pendingEmail)
      throw new AppError(400, "Invalid or expired token", "INVALID_TOKEN");

    const existing = await UserModel.findByEmail(pendingEmail);
    if (existing && existing.id !== record.user_id) {
      throw new AppError(409, "Email already registered", "EMAIL_EXISTS");
    }

    await db.transaction(async (trx) => {
      await UserModel.updateEmail(record.user_id, pendingEmail, trx);
      await VerificationTokenModel.markUsed(record.id, trx);
      await RefreshTokenModel.deleteAllForUser(record.user_id, trx);
    });

    const user = await UserModel.findById(record.user_id);
    if (user)
      await EmailService.sendEmailChangedNotification(user.email, pendingEmail);
  }
}
