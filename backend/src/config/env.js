import dotenv from 'dotenv';

/**
 * Load and validate environment variables.
 * Call this once at application startup before importing other modules.
 */
dotenv.config();

/**
 * Validated environment configuration object.
 * Access env variables through this object instead of process.env directly.
 */
export const env = {
  // Server
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // Database (PostgreSQL / Neon via Prisma)
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/knowledge_app?schema=public',
  directUrl: process.env.DIRECT_URL || process.env.DATABASE_URL,

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,

  // Logging
  logLevel: process.env.LOG_LEVEL || 'debug',
};

/**
 * Validate required environment variables.
 * Logs warnings for missing recommended variables.
 */
export function validateEnv() {
  const warnings = [];

  if (!process.env.DATABASE_URL) {
    warnings.push('DATABASE_URL not set, using default local PostgreSQL connection');
  }

  if (!process.env.CORS_ORIGIN) {
    warnings.push('CORS_ORIGIN not set, using default http://localhost:5173');
  }

  if (env.isProduction && !process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in production');
  }

  warnings.forEach((w) => console.warn(`[Config] Warning: ${w}`));
}
