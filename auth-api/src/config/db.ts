import knex from "knex";
import { logger } from "../utils/logger.js";
import { env } from "./env.js";

const db = knex({
  client: "pg",
  connection: env.DATABASE_URL,
  pool: { min: 2, max: 10 },
  migrations: {
    directory: "./src/db/migrations",
    extension: "ts",
  },
});

export const connectDB = async (): Promise<void> => {
  try {
    await db.raw("SELECT 1");
    logger.info("PostgreSQL connected successfully");
  } catch (error) {
    logger.error("PostgreSQL connection error:", error);
    process.exit(1);
  }
};

export default db;
