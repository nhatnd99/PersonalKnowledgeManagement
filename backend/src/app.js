import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';

import { env } from './config/env.js';
import { notFoundHandler, globalErrorHandler } from './middlewares/errorHandler.js';
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
      allowedHeaders: ['Content-Type', 'Authorization'],
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

  // ─── Request Parsing ──────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

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
        notes: '/api/v1/notes (planned Phase 1)',
        relationships: '/api/v1/relationships (planned Phase 3)',
        tags: '/api/v1/tags (planned Phase 4)',
        search: '/api/v1/search (planned Phase 4)',
      },
    });
  });

  // ─── API v1 Routes ────────────────────────────────────────────────────────
  app.use('/api/v1/notes', noteRoutes);
  app.use('/api/v1/relationships', relationshipRoutes);
  app.use('/api/v1/tags', tagRoutes);
  app.use('/api/v1/search', searchRoutes);
  app.use('/api/v1/graph', graphRoutes);
  app.use('/api/v1/user', userRoutes);

  // ─── Error Handling ───────────────────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
