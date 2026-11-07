import mongoose from 'mongoose';

/**
 * MongoDB connection configuration.
 *
 * Supports both local MongoDB and MongoDB Atlas via MONGODB_URI.
 * Connection URI is loaded from environment variables.
 *
 * Usage:
 *   import { connectDatabase, disconnectDatabase } from './config/database.js';
 *   await connectDatabase();
 */

const DEFAULT_URI = 'mongodb://localhost:27017/knowledge-app';

/**
 * Establish MongoDB connection.
 * @returns {Promise<void>}
 * @throws {Error} If connection fails
 */
export async function connectDatabase() {
  const uri = process.env.MONGODB_URI || DEFAULT_URI;

  const options = {
    // Mongoose 8 defaults are generally good; specify only what differs
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  try {
    await mongoose.connect(uri, options);
    console.info(`[Database] Connected to MongoDB: ${sanitizeUri(uri)}`);
  } catch (error) {
    console.error('[Database] Connection failed:', error.message);
    throw error;
  }
}

/**
 * Gracefully close the MongoDB connection.
 * @returns {Promise<void>}
 */
export async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    console.info('[Database] Disconnected from MongoDB');
  } catch (error) {
    console.error('[Database] Disconnect error:', error.message);
    throw error;
  }
}

/**
 * Register connection event listeners for logging.
 */
export function registerDatabaseEvents() {
  mongoose.connection.on('error', (err) => {
    console.error('[Database] Connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] Disconnected from MongoDB');
  });

  mongoose.connection.on('reconnected', () => {
    console.info('[Database] Reconnected to MongoDB');
  });
}

/**
 * Remove credentials from URI for safe logging.
 * @param {string} uri - MongoDB connection URI
 * @returns {string} Sanitized URI
 */
function sanitizeUri(uri) {
  try {
    const url = new URL(uri);
    if (url.password) url.password = '***';
    return url.toString();
  } catch {
    return uri.replace(/:([^@/]+)@/, ':***@');
  }
}
