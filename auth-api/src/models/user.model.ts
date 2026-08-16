import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import db from "../config/db.js";
import { UserProfile } from "../types/index.js";

export interface UserRecord {
  id: string;
  email: string;
  password: string;
  email_verified: boolean;
  email_verified_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function toProfile(user: UserRecord): UserProfile {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.email_verified,
    emailVerifiedAt: user.email_verified_at,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

export class UserModel {
  static async findByEmail(email: string): Promise<UserRecord | undefined> {
    return db("users").where({ email }).first();
  }

  static async findByIdExternal(id: string): Promise<UserProfile | undefined> {
    const user = await db("users").where({ id }).first();
    return user ? toProfile(user) : undefined;
  }

  static async findById(id: string): Promise<UserRecord | undefined> {
    return db("users").where({ id }).first();
  }

  static async create(email: string, password: string): Promise<UserRecord> {
    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(password, salt);
    const id = uuidv4();
    try {
      await db("users").insert({ id, email, password: hashed });
    } catch (error) {
      const uniquenessConstraintCode = "23505";
      if ((error as { code?: string }).code === uniquenessConstraintCode) {
        throw new Error("Email already registered");
      }
      throw error;
    }
    return (await db("users").where({ id }).first())!;
  }

  static async comparePassword(
    user: UserRecord,
    candidate: string,
  ): Promise<boolean> {
    return bcrypt.compare(candidate, user.password);
  }

  static async updatePassword(id: string, password: string): Promise<void> {
    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(password, salt);
    await db("users").where({ id }).update({ password: hashed });
  }

  static async markEmailVerified(id: string): Promise<void> {
    await db("users").where({ id }).update({
      email_verified: true,
      email_verified_at: new Date(),
    });
  }

  static async updateEmail(id: string, email: string): Promise<void> {
    await db("users").where({ id }).update({
      email,
      email_verified: true,
      email_verified_at: new Date(),
    });
  }
}
