import { type Knex } from "knex";
import cron from "node-cron";
import db from "../config/db.js";
import { env } from "../config/env.js";
import { RefreshTokenModel } from "../models/refreshToken.model.js";
import { VerificationTokenModel } from "../models/verificationToken.model.js";
import { logger } from "../utils/logger.js";

// Advisory lock key shared by every instance of this service. PostgreSQL
// guarantees that at most one instance can hold the lock at a time, so only
// one instance runs the cleanup per tick; the others skip.
//
// pg_advisory_lock is session-scoped, which means the lock lives on a single
// DB connection. A transaction pins one pooled connection for all its queries,
// so acquire -> cleanup -> release happen on the same session. If the process
// dies mid-job, the transaction rolls back and PostgreSQL releases the lock.
const CLEANUP_ADVISORY_LOCK_KEY = 727271731;

async function acquireCleanupLock(trx: Knex.Transaction): Promise<boolean> {
  const { rows } = await trx.raw<{ rows: { locked: boolean }[] }>(
    "SELECT pg_try_advisory_lock(?) AS locked",
    [CLEANUP_ADVISORY_LOCK_KEY],
  );
  return rows[0]?.locked ?? false;
}

async function releaseCleanupLock(trx: Knex.Transaction): Promise<void> {
  await trx.raw("SELECT pg_advisory_unlock(?)", [CLEANUP_ADVISORY_LOCK_KEY]);
}

async function deleteExpiredTokens(trx: Knex.Transaction): Promise<void> {
  const [deletedRefreshTokens, deletedVerificationTokens] = await Promise.all([
    RefreshTokenModel.deleteExpired(trx),
    VerificationTokenModel.deleteExpired(trx),
  ]);

  const total = deletedRefreshTokens + deletedVerificationTokens;
  if (total > 0) {
    logger.info(
      `Cleanup removed ${total} expired token(s) ` +
        `(${deletedRefreshTokens} refresh, ${deletedVerificationTokens} verification)`,
    );
  }
}

async function runCleanupTick(): Promise<void> {
  await db.transaction(async (trx) => {
    if (!(await acquireCleanupLock(trx))) {
      logger.info("Cleanup skipped: another instance holds the lock");
      return;
    }

    try {
      await deleteExpiredTokens(trx);
    } finally {
      await releaseCleanupLock(trx);
    }
  });
}

export const startCleanupJob = (): void => {
  const schedule = env.CLEANUP_CRON_SCHEDULE;

  if (!cron.validate(schedule)) {
    throw new Error(`Invalid CLEANUP_CRON_SCHEDULE: ${schedule}`);
  }

  cron.schedule(
    schedule,
    async () => {
      try {
        await runCleanupTick();
      } catch (error) {
        logger.error("Cleanup job failed:", error);
      }
    },
    { noOverlap: true },
  );

  logger.info(`Cleanup job scheduled: "${schedule}"`);
};