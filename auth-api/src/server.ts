import app from "./app.js";
import db from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

const startServer = async () => {
  logger.info("Running migrations...");
  await db.migrate.latest();
  logger.info("Migrations finished");

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });

  const shutdown = async () => {
    logger.info("Shutting down...");
    await db.destroy();
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
};

startServer().catch((error) => {
  logger.error("Failed to start server:", error);
  process.exit(1);
});
