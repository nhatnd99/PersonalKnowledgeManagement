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

  // Database
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/knowledge-app',
  mongodbDbName: process.env.MONGODB_DB_NAME || 'knowledge-app',

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

  if (!process.env.MONGODB_URI) {
    warnings.push('MONGODB_URI not set, using default local connection');
  }

  if (!process.env.CORS_ORIGIN) {
    warnings.push('CORS_ORIGIN not set, using default http://localhost:5173');
  }

  if (env.isProduction && !process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required in production');
  }

  warnings.forEach((w) => console.warn(`[Config] Warning: ${w}`));
}
