import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import db from "../config/db.js";

export interface UserRecord {
  id: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

export class UserModel {
  static async findByEmail(email: string): Promise<UserRecord | undefined> {
    return db("users").where({ email }).first();
  }

  static async findById(
    id: string,
  ): Promise<Omit<UserRecord, "password"> | undefined> {
    return db("users")
      .where({ id })
      .select("id", "email", "created_at", "updated_at")
      .first();
  }

  static async create(email: string, password: string): Promise<UserRecord> {
    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(password, salt);
    const id = uuidv4();
    await db("users").insert({ id, email, password: hashed });
    return (await db("users").where({ id }).first())!;
  }

  static async comparePassword(
    user: UserRecord,
    candidate: string,
  ): Promise<boolean> {
    return bcrypt.compare(candidate, user.password);
  }
}
