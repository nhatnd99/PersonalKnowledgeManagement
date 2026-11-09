import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

/**
 * PostgreSQL connection management via Prisma ORM.
 *
 * Supports both local PostgreSQL and managed PostgreSQL (e.g. Neon) via DATABASE_URL.
 * Maintains a single, application-managed PrismaClient instance via globalThis cache.
 */

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: env.isDevelopment ? ['warn', 'error'] : ['error'],
  });

// In serverless environments, store the client on globalThis so warm lambdas reuse the instance and connection pool
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

/**
 * Establish database connection using Prisma Client.
 * @returns {Promise<void>}
 * @throws {Error} If connection fails
 */
export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.info(`[Database] Connected to PostgreSQL via Prisma: ${sanitizeDbUrl(env.databaseUrl)}`);
  } catch (error) {
    console.error('[Database] PostgreSQL connection failed:', error.message);
    throw error;
  }
}

/**
 * Gracefully disconnect Prisma Client from PostgreSQL.
 * @returns {Promise<void>}
 */
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.info('[Database] Disconnected from PostgreSQL');
  } catch (error) {
    console.error('[Database] Disconnect error:', error.message);
    throw error;
  }
}

/**
 * Sanitize credentials in connection string for safe log output.
 * @param {string} url - Database connection URI
 * @returns {string} Sanitized URL
 */
function sanitizeDbUrl(url) {
  if (!url) return 'undefined';
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = '***';
    return parsed.toString();
  } catch {
    return url.replace(/:([^@/]+)@/, ':***@');
  }
}
