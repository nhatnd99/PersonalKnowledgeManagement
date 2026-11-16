import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import 'express-async-errors';

import { env } from './config/env.js';
import { notFoundHandler, globalErrorHandler } from './middlewares/errorHandler.js';
import { authenticate, requireAuth } from './middlewares/auth.js';
import authRoutes from './modules/auth/auth.routes.js';
import noteRoutes from './modules/notes/note.routes.js';
import relationshipRoutes from './modules/relationships/relationship.routes.js';
import tagRoutes from './modules/tags/tag.routes.js';
import searchRoutes from './modules/search/search.routes.js';
import graphRoutes from './modules/graph/graph.routes.js';
import userRoutes from './modules/users/user.routes.js';

/**
 * Application factory.
 * Creates and configures the Express application.
 *
 * Separation of concerns:
 * - app.js: Express application setup and middleware configuration
 * - server.js: HTTP server startup, database connection, process signals
 *
 * @returns {express.Application} Configured Express app
 */
export function createApp() {
  const app = express();

  // ─── Security Middleware ──────────────────────────────────────────────────
  app.use(helmet());

  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Anonymous', 'X-Unauthenticated'],
    })
  );

  // ─── Rate Limiting ────────────────────────────────────────────────────────
  const limiter = rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests, please try again later.',
    },
  });
  app.use('/api', limiter);

  // ─── Request & Cookie Parsing ─────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // ─── Authentication Middleware ────────────────────────────────────────────
  app.use(authenticate);

  // ─── Logging ─────────────────────────────────────────────────────────────
  if (!env.isTest) {
    app.use(morgan(env.isDevelopment ? 'dev' : 'combined'));
  }

  // ─── Health Check ─────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    });
  });

  // ─── API v1 Root ──────────────────────────────────────────────────────────
  app.get(['/api', '/api/v1'], (_req, res) => {
    res.json({
      success: true,
      message: 'Knowledge App API v1',
      version: '0.1.0',
      database: 'PostgreSQL (Prisma ORM)',
      endpoints: {
        health: '/health',
        auth: '/api/auth or /api/v1/auth',
        users: '/api/users or /api/v1/users',
        notes: '/api/v1/notes',
        relationships: '/api/v1/relationships',
        tags: '/api/v1/tags',
        search: '/api/v1/search',
        graph: '/api/v1/graph',
      },
    });
  });

  // ─── API Routes ───────────────────────────────────────────────────────────
  // Authentication & Users (accessible at both /api/auth and /api/v1/auth)
  app.use(['/api/auth', '/api/v1/auth'], authRoutes);
  app.use(['/api/users', '/api/v1/user', '/api/v1/users'], userRoutes);

  // Protected Core Application Routes
  app.use('/api/v1/notes', requireAuth, noteRoutes);
  app.use(['/api/v1/relationships', '/api/v1/note-relationships'], requireAuth, relationshipRoutes);
  app.use('/api/v1/tags', requireAuth, tagRoutes);
  app.use('/api/v1/search', requireAuth, searchRoutes);
  app.use('/api/v1/graph', requireAuth, graphRoutes);

  // ─── Error Handling ───────────────────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
