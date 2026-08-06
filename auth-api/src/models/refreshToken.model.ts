import { v4 as uuidv4 } from "uuid";
import db from "../config/db.js";

export interface RefreshTokenRecord {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

export class RefreshTokenModel {
  static async create(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    await db("refresh_tokens").insert({
      id: uuidv4(),
      user_id: userId,
      token,
      expires_at: expiresAt,
    });
  }

  static async findByToken(
    token: string,
  ): Promise<RefreshTokenRecord | undefined> {
    return db("refresh_tokens").where({ token }).first();
  }

  static async deleteByToken(token: string): Promise<void> {
    await db("refresh_tokens").where({ token }).delete();
  }

  static async deleteAllForUser(userId: string): Promise<void> {
    await db("refresh_tokens").where({ user_id: userId }).delete();
  }

  // Удаление просроченных токенов (можно вызывать периодически)
  static async deleteExpired(): Promise<void> {
    await db("refresh_tokens").where("expires_at", "<", new Date()).delete();
  }
}
