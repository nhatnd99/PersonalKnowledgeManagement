import { validateEnv, env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { createApp } from './app.js';

/**
 * Application entry point.
 *
 * Responsibilities:
 * 1. Validate environment configuration
 * 2. Connect to PostgreSQL via Prisma
 * 3. Start the HTTP server
 * 4. Handle graceful shutdown
 */

async function startServer() {
  try {
    // 1. Validate environment
    validateEnv();

    // 2. Connect to database
    try {
      await connectDatabase();
    } catch (dbError) {
      if (env.isDevelopment) {
        console.warn('[Database] Warning: PostgreSQL not reachable at startup. Ensure PostgreSQL service is started or configure DATABASE_URL in .env before performing database queries.');
      } else {
        throw dbError;
      }
    }

    // 3. Create and start Express app
    const app = createApp();
    const server = app.listen(env.port, () => {
      console.info(`[Server] Knowledge App API running on port ${env.port}`);
      console.info(`[Server] Environment: ${env.nodeEnv}`);
      console.info(`[Server] Health check: http://localhost:${env.port}/health`);
      console.info(`[Server] API v1 Base: http://localhost:${env.port}/api/v1`);
    });

    // 4. Graceful shutdown handlers
    const gracefulShutdown = async (signal) => {
      console.info(`[Server] ${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        try {
          await disconnectDatabase();
          console.info('[Server] Server closed cleanly');
          process.exit(0);
        } catch (error) {
          console.error('[Server] Error during shutdown:', error.message);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('[Server] Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      console.error('[Server] Unhandled Promise Rejection:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('[Server] Uncaught Exception:', error.message);
      process.exit(1);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error.message);
    process.exit(1);
  }
}

startServer();
