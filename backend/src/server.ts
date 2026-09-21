import { app } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

const start = async (): Promise<void> => {
  if (env.NODE_ENV !== "test") {
    await connectDatabase();
  }

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, environment: env.NODE_ENV }, "API listening");
  });

  const shutdown = (signal: string): void => {
    logger.info({ signal }, "Shutting down API");
    server.close((error) => {
      if (error) {
        logger.error({ err: error }, "Graceful shutdown failed");
        process.exit(1);
      }
      process.exit(0);
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
};

start().catch((error: unknown) => {
  logger.fatal({ err: error }, "API failed to start");
  process.exit(1);
});
