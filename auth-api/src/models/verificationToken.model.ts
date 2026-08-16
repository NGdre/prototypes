import { v4 as uuidv4 } from "uuid";
import db from "../config/db.js";
import { VerificationTokenType } from "../types/index.js";
import { hashToken } from "../utils/token.js";

export interface VerificationTokenRecord {
  id: string;
  user_id: string;
  type: VerificationTokenType;
  token_hash: string;
  metadata: Record<string, unknown> | null;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export class VerificationTokenModel {
  static async create(
    userId: string,
    type: VerificationTokenType,
    tokenHash: string,
    expiresAt: Date,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await db("verification_tokens").insert({
      id: uuidv4(),
      user_id: userId,
      type,
      // store only the hash so leaked DB rows can't be used to verify tokens
      token_hash: tokenHash,
      metadata: metadata ?? null,
      expires_at: expiresAt,
    });
  }

  static async invalidateByType(
    userId: string,
    type: VerificationTokenType,
  ): Promise<void> {
    await db("verification_tokens")
      .where({ user_id: userId, type })
      .whereNull("used_at")
      .update({ used_at: new Date() });
  }

  static async findValid(
    rawToken: string,
    type: VerificationTokenType,
  ): Promise<VerificationTokenRecord | undefined> {
    const tokenHash = hashToken(rawToken);

    // Type is part of the lookup: an email_verify token must not be
    // redeemable at /reset-password and vice versa.
    return db("verification_tokens")
      .where({ token_hash: tokenHash, type })
      .whereNull("used_at")
      .where("expires_at", ">", new Date())
      .first();
  }

  static async markUsed(id: string): Promise<void> {
    await db("verification_tokens")
      .where({ id })
      .update({ used_at: new Date() });
  }
}
