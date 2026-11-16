import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

/**
 * Load and validate environment variables.
 * Loading Priority (highest to lowest):
 * 1. process.env (already in environment, e.g. Vercel / CI)
 * 2. .env.local (root or backend) - overrides standard .env
 * 3. .env (backend or root)
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '../../');
const rootDir = path.resolve(__dirname, '../../../');

const initialNodeEnv = process.env.NODE_ENV;

// 1. Load baseline .env files
const envPaths = [
  path.join(rootDir, '.env'),
  path.join(backendDir, '.env'),
];

for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
  }
}

// 2. Load .env.local files with override: true (local overrides / Neon)
const envLocalPaths = [
  path.join(rootDir, '.env.local'),
  path.join(backendDir, '.env.local'),
];

for (const p of envLocalPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p, override: true });
  }
}

// 3. Fallback directUrl mapping for Neon (if DATABASE_URL_UNPOOLED is present)
if (process.env.DATABASE_URL_UNPOOLED && !process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL_UNPOOLED;
}

if (initialNodeEnv) {
  process.env.NODE_ENV = initialNodeEnv;
}

/**
 * Parse CORS_ORIGIN into a string, array of strings, or wildcard.
 * Allows comma-separated origins in environment variables (e.g. for Vercel preview + production).
 */
function parseCorsOrigin(originValue) {
  if (!originValue || originValue === '*') return '*';
  if (originValue.includes(',')) {
    return originValue.split(',').map((o) => o.trim()).filter(Boolean);
  }
  return originValue;
}

/**
 * Validated environment configuration object.
 * Access env variables through this object instead of process.env directly.
 */
const effectiveNodeEnv = process.env.NODE_ENV || 'development';
const isTestEnv = effectiveNodeEnv === 'test' || Boolean(process.env.JEST_WORKER_ID);

export const env = {
  // Server
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: effectiveNodeEnv,
  isDevelopment: effectiveNodeEnv === 'development' && !isTestEnv,
  isProduction: effectiveNodeEnv === 'production',
  isTest: isTestEnv,

  // Database (PostgreSQL / Neon via Prisma)
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/knowledge_app?schema=public',
  directUrl: process.env.DIRECT_URL || process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,

  // CORS (supports single origin, comma-separated array, or wildcard)
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN) || 'http://localhost:5173',

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,

  // Logging
  logLevel: process.env.LOG_LEVEL || 'debug',

  // Authentication & Session
  sessionCookieName: process.env.COOKIE_NAME || 'knowledge_session',
  sessionDurationMs: parseInt(process.env.SESSION_DURATION, 10) || 24 * 60 * 60 * 1000, // 24 hours
  sessionRememberDurationMs: parseInt(process.env.SESSION_REMEMBER_DURATION, 10) || 30 * 24 * 60 * 60 * 1000, // 30 days
  cookieSecure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : process.env.NODE_ENV === 'production',
  cookieSameSite: process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'lax' : 'lax'),
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,

  // Email & Password Reset
  smtpHost: process.env.SMTP_HOST || null,
  smtpPort: parseInt(process.env.SMTP_PORT, 10) || 587,
  smtpUser: process.env.SMTP_USER || null,
  smtpPassword: process.env.SMTP_PASSWORD || null,
  smtpFrom: process.env.SMTP_FROM || 'Knowledge App <no-reply@knowledge.app>',
  passwordResetUrl: process.env.PASSWORD_RESET_URL || 'http://localhost:5173/reset-password',
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
