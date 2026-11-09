import { createApp } from '../src/app.js';

/**
 * Vercel Serverless Function entry point.
 *
 * Responsibilities:
 * - Instantiate the Express application via createApp() factory
 * - Export the Express application as the default export for Vercel Serverless runtime (@vercel/node)
 * - Do NOT invoke app.listen() here (Vercel manages the HTTP server lifecycle)
 *
 * For local development with a persistent HTTP listener, use backend/src/server.js.
 */
const app = createApp();

export default app;
