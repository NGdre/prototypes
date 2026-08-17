import { type Knex } from "knex";
import { v4 as uuidv4 } from "uuid";
import db from "../config/db.js";
import { hashToken } from "../utils/token.js";

export interface RefreshTokenRecord {
  id: string;
  user_id: string;
  token: string; // sha256 hash of the raw refresh token (never the JWT itself)
  expires_at: Date;
  created_at: Date;
}

export class RefreshTokenModel {
  static async create(
    userId: string,
    rawToken: string,
    expiresAt: Date,
    trx?: Knex.Transaction,
  ): Promise<void> {
    await (trx ?? db)("refresh_tokens").insert({
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
    forUpdate = false,
  ): Promise<RefreshTokenRecord | undefined> {
    const query = (trx ?? db)("refresh_tokens").where({
      token: hashToken(rawToken),
    });
    if (forUpdate) query.forUpdate();
    return query.first();
  }

  static async deleteByToken(
    rawToken: string,
    trx?: Knex.Transaction,
  ): Promise<void> {
    await (trx ?? db)("refresh_tokens")
      .where({ token: hashToken(rawToken) })
      .delete();
  }

  static async deleteAllForUser(
    userId: string,
    trx?: Knex.Transaction,
  ): Promise<void> {
    await (trx ?? db)("refresh_tokens").where({ user_id: userId }).delete();
  }

  // Removes expired tokens; called periodically by the cleanup job.
  static async deleteExpired(trx?: Knex.Transaction): Promise<number> {
    return (trx ?? db)("refresh_tokens")
      .where("expires_at", "<", new Date())
      .delete();
  }
}
