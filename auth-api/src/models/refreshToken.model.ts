import { type Knex } from "knex";
import { v4 as uuidv4 } from "uuid";
import db from "../config/db.js";
import { TokenHash, hashToken } from "../utils/token.js";

export interface RefreshTokenRecord {
  id: string;
  user_id: string;
  token: TokenHash; // sha256 hash of the raw refresh token (never the JWT itself)
  expires_at: Date;
  created_at: Date;
}

// Typed table builder usable both on the pool and inside a transaction.
const refreshTokens = (trx?: Knex.Transaction) =>
  trx
    ? trx<RefreshTokenRecord>("refresh_tokens")
    : db<RefreshTokenRecord>("refresh_tokens");

export class RefreshTokenModel {
  static async create(
    userId: string,
    rawToken: string,
    expiresAt: Date,
    trx?: Knex.Transaction,
  ): Promise<void> {
    await refreshTokens(trx).insert({
      id: uuidv4(),
      user_id: userId,
      // Persist only the hash: if the DB is leaked, the stored values cannot
      // be replayed against /refresh (see migration 004 for the backfill).
      token: hashToken(rawToken),
      expires_at: expiresAt,
    });
  }

  static async findByToken(
    rawToken: string,
    trx?: Knex.Transaction,
  ): Promise<RefreshTokenRecord | undefined> {
    return refreshTokens(trx)
      .where({ token: hashToken(rawToken) })
      .first();
  }

  // Variant for the rotation flow: the row is locked with FOR UPDATE so a
  // concurrent request carrying the same token blocks here, sees no row
  // after commit, and is treated as reuse.
  static async findByTokenForUpdate(
    rawToken: string,
    trx?: Knex.Transaction,
  ): Promise<RefreshTokenRecord | undefined> {
    return refreshTokens(trx)
      .where({ token: hashToken(rawToken) })
      .forUpdate()
      .first();
  }

  static async deleteByToken(
    rawToken: string,
    trx?: Knex.Transaction,
  ): Promise<void> {
    await refreshTokens(trx).where({ token: hashToken(rawToken) }).delete();
  }

  static async deleteAllForUser(
    userId: string,
    trx?: Knex.Transaction,
  ): Promise<void> {
    await refreshTokens(trx).where({ user_id: userId }).delete();
  }

  // Removes expired tokens; called periodically by the cleanup job.
  static async deleteExpired(trx?: Knex.Transaction): Promise<number> {
    return refreshTokens(trx).where("expires_at", "<", new Date()).delete();
  }
}
