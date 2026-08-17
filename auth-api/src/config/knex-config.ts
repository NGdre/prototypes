import { type Knex } from "knex";
import { fileURLToPath } from "node:url";
import { env } from "./env.js";

export const knexConfig: Knex.Config = {
  client: "pg",
  connection: env.DATABASE_URL,
  pool: { min: 2, max: 10 },
  migrations: {
    // Resolve relative to this module so the same path works in dev
    // (src/db/migrations) and after build (dist/db/migrations).
    directory: fileURLToPath(new URL("../db/migrations", import.meta.url)),
    // tsx executes .ts migrations in dev; node runs compiled .js in prod.
    extension: env.NODE_ENV === "development" ? "ts" : "js",
  },
};
