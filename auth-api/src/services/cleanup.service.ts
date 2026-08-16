import cron from "node-cron";
import { env } from "../config/env.js";
import { RefreshTokenModel } from "../models/refreshToken.model.js";
import { VerificationTokenModel } from "../models/verificationToken.model.js";
import { logger } from "../utils/logger.js";

// Periodic in-app cleanup of expired token rows. The job runs on
// a cron schedule (see CLEANUP_CRON_SCHEDULE) and deletes rows whose
// expires_at has already passed. Row deletion itself is a hard delete, so
// the expired token can no longer be used for refresh or verification.

export const startCleanupJob = (): void => {
  const schedule = env.CLEANUP_CRON_SCHEDULE;

  if (!cron.validate(schedule)) {
    throw new Error(`Invalid CLEANUP_CRON_SCHEDULE: ${schedule}`);
  }

  cron.schedule(
    schedule,
    async () => {
      try {
        const [refreshTokens, verificationTokens] = await Promise.all([
          RefreshTokenModel.deleteExpired(),
          VerificationTokenModel.deleteExpired(),
        ]);

        const total = refreshTokens + verificationTokens;
        if (total > 0) {
          logger.info(
            `Cleanup removed ${total} expired token(s) ` +
              `(${refreshTokens} refresh, ${verificationTokens} verification)`,
          );
        }
      } catch (error) {
        logger.error("Cleanup job failed:", error);
      }
    },
    { noOverlap: true },
  );

  logger.info(`Cleanup job scheduled: "${schedule}"`);
};
