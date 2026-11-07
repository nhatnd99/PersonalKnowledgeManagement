# Knowledge App — Backend API

The REST API server and database layer for the Personal Knowledge Management system, built with Node.js (ES Modules), Express.js, PostgreSQL, and Prisma ORM.

---

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** instance running locally on port 5432 or a free serverless database on [Neon](https://neon.tech)

---

## 1. Setup & Installation

From the repository root:
```bash
# Option A: From root using workspace command
npm install --workspace=backend

# Option B: Navigate to backend directory directly
cd backend
npm install
```

---

## 2. Environment Configuration

Copy `.env.example` to `.env` inside the `backend/` directory:

```bash
cp .env.example .env
```

Contents of `backend/.env`:
```env
# Server
PORT=3000
NODE_ENV=development

# Database (PostgreSQL / Prisma)
# 1. For Local PostgreSQL:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/knowledge_app?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/knowledge_app?schema=public"

# 2. For Neon Managed PostgreSQL (cloud):
# DATABASE_URL="postgresql://<user>:<password>@ep-xyz-pooler.region.neon.tech/neondb?sslmode=require&pgbouncer=true"
# DIRECT_URL="postgresql://<user>:<password>@ep-xyz.region.neon.tech/neondb?sslmode=require"

# Security & CORS
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=debug
```

---

## 3. Database Setup (Prisma Migrate & Seed)

```bash
# 1. Generate Prisma Client
npm run prisma:generate

# 2. Run migrations to create PostgreSQL tables
npm run prisma:migrate

# 3. Seed database with starter knowledge notes, tags, and relationships
npm run prisma:seed
```

> **Tip**: You can inspect and edit the database in a visual browser UI anytime using:
> ```bash
> npm run prisma:studio
> ```

---

## 4. Start Backend Server

```bash
# Development mode with auto-reload (watch mode):
npm run dev

# Or from repository root:
npm run dev:backend
```

The API will be live at:
👉 **`http://localhost:3000/api/v1`**

Verify health endpoint:
```bash
curl http://localhost:3000/health
```

---

## 5. Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts server with `node --watch src/server.js` |
| `npm start` | Starts server in production mode |
| `npm test` | Runs Jest unit & integration test suites (49 tests) |
| `npm run test:watch` | Runs Jest in interactive watch mode |
| `npm run test:coverage` | Generates code coverage report |
| `npm run prisma:generate` | Generates `@prisma/client` from `prisma/schema.prisma` |
| `npm run prisma:migrate` | Runs Prisma migrations in development mode |
| `npm run prisma:seed` | Seeds database with sample PKM data |
| `npm run prisma:studio` | Opens Prisma Studio web GUI to browse database tables |
| `npm run lint` | Runs ESLint across all backend JavaScript files |

---

## 6. API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health check |
| `GET` | `/api/v1` | API version & endpoints directory |
| `GET, POST` | `/api/v1/notes` | List notes (with pagination) / Create note |
| `GET, PATCH, DELETE` | `/api/v1/notes/:id` | Get note / Update note / Delete note |
| `PATCH` | `/api/v1/notes/:id/move` | Move note to new parent with cycle prevention |
| `GET, POST` | `/api/v1/notes/:id/tags` | Get tags on note / Assign tag |
| `GET` | `/api/v1/notes/:id/export` | Export note as Markdown (`.md`) or JSON |
| `POST` | `/api/v1/notes/import` | Import note from Markdown or JSON |
| `GET, POST, DELETE` | `/api/v1/relationships` | Manage directional relationships |
| `GET` | `/api/v1/notes/:id/relationships` | Get outgoing connections & incoming backlinks |
| `GET, POST, PATCH, DELETE` | `/api/v1/tags` | Tag taxonomy CRUD |
| `GET` | `/api/v1/search` | Search notes by title, content, tags, favorites |
| `GET` | `/api/v1/graph` | Knowledge graph nodes and edges for visualization |
| `GET, PATCH` | `/api/v1/user/profile` | Workspace profile & preferences |
