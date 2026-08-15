import { env, parseExpiryToMs } from "../config/env.js";
import bcrypt from "bcrypt";
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
      throw new Error("Invalid credentials");
    }

    const isMatch = await UserModel.comparePassword(user, password);
    if (!isMatch) throw new Error("Invalid credentials");

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

    const user = await UserModel.findById(payload.userId);
    if (!user) throw new Error("User not found");

    const newPayload: TokenPayload = {
      userId: payload.userId,
      email: user.email, // email could have been changed, so new payload should be with updated email
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
    const user = await UserModel.findByIdExternal(userId);
    if (!user) throw new Error("User not found");
    return user;
  }

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("User not found");

    // password change is sensitive: require re-authentication
    const isMatch = await UserModel.comparePassword(user, currentPassword);
    if (!isMatch) throw new Error("Current password is incorrect");

    await UserModel.updatePassword(userId, newPassword);
    // revoke all sessions on password change
    await RefreshTokenModel.deleteAllForUser(userId);
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
    const record = await VerificationTokenModel.findValid(token);
    if (!record) throw new Error("Invalid or expired token");

    await UserModel.updatePassword(record.user_id, newPassword);
    await VerificationTokenModel.markUsed(record.id);

    /* Revoke all sessions. A password reset can be triggered by anyone in control of the email.
    If that's an attacker, they could reset the password and create a session on their device.
    Deleting every refresh token forces a re-login everywhere and kills any attacker session.
    Also, if an attacker changes password then user will notice that the old password doesn't work */

    await RefreshTokenModel.deleteAllForUser(record.user_id);

    const user = await UserModel.findById(record.user_id);
    if (user) await EmailService.sendPasswordChangedNotification(user.email);
  }

  static async verifyEmail(token: string) {
    const record = await VerificationTokenModel.findValid(token);
    if (!record) throw new Error("Invalid or expired token");

    await UserModel.markEmailVerified(record.user_id);
    await VerificationTokenModel.markUsed(record.id);
  }

  static async resendVerification(userId: string) {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("User not found");
    if (user.email_verified) throw new Error("Email already verified");

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
    if (!user) throw new Error("User not found");

    // email change is sensitive: require re-authentication
    const isMatch = await UserModel.comparePassword(user, password);
    if (!isMatch) throw new Error("Current password is incorrect");

    if (user.email === newEmail) {
      throw new Error("New email must be different from current email");
    }

    const existing = await UserModel.findByEmail(newEmail);
    if (existing) throw new Error("Email already registered");

    const changeToken = await this.createVerificationToken(
      userId,
      "email_change",
      env.EMAIL_VERIFY_TOKEN_EXPIRY,
      { pendingEmail: newEmail },
    );
    await EmailService.sendEmailChangeConfirmation(newEmail, changeToken);
  }

  static async confirmEmailChange(token: string) {
    const record = await VerificationTokenModel.findValid(token);
    if (!record) throw new Error("Invalid or expired token");

    const pendingEmail = record.metadata?.pendingEmail as string | undefined;
    if (!pendingEmail) throw new Error("Invalid or expired token");

    const existing = await UserModel.findByEmail(pendingEmail);
    if (existing && existing.id !== record.user_id) {
      throw new Error("Email already registered");
    }

    await UserModel.updateEmail(record.user_id, pendingEmail);
    await VerificationTokenModel.markUsed(record.id);
    await RefreshTokenModel.deleteAllForUser(record.user_id);

    const user = await UserModel.findById(record.user_id);
    if (user)
      await EmailService.sendEmailChangedNotification(user.email, pendingEmail);
  }
}
