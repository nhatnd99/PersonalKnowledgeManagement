import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';

import { env } from './config/env.js';
import { notFoundHandler, globalErrorHandler } from './middlewares/errorHandler.js';

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

  // ─── API Routes ───────────────────────────────────────────────────────────
  // Routes are registered here as modules are implemented
  // Example: app.use('/api/notes', noteRoutes);
  // app.use('/api/notes', noteRoutes);
  // app.use('/api/relationships', relationshipRoutes);
  // app.use('/api/tags', tagRoutes);
  // app.use('/api/search', searchRoutes);

  // ─── API Root ─────────────────────────────────────────────────────────────
  app.get('/api', (_req, res) => {
    res.json({
      success: true,
      message: 'Knowledge App API',
      version: '0.1.0',
      endpoints: {
        health: '/health',
        notes: '/api/notes (not yet implemented)',
        relationships: '/api/relationships (not yet implemented)',
        tags: '/api/tags (not yet implemented)',
        search: '/api/search (not yet implemented)',
      },
    });
  });

  // ─── Error Handling ───────────────────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
