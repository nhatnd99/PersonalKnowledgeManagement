# Environment Setup Guide

This guide describes how to configure and run the Knowledge App workspace across local and cloud environments.

---

## 1. Prerequisites

| Tool | Version Requirement | Purpose |
|------|---------------------|---------|
| **Node.js** | `>= 18.0.0` (Tested on v24) | JavaScript runtime (ES Modules) |
| **npm** | `>= 9.0.0` | Monorepo package manager |
| **PostgreSQL** | `>= 14` | Relational database (Local or Neon cloud) |
| **Git** | Latest | Version control |

---

## 2. Path A: Local Development with Local PostgreSQL

### Step 1: Install & Start PostgreSQL
Ensure PostgreSQL is installed and running locally:
- **Windows**: PostgreSQL Windows Service (default port `5432`)
- **macOS**: `brew install postgresql@16 && brew services start postgresql@16`
- **Linux**: `sudo systemctl start postgresql`

### Step 2: Create Local Database
Create a dedicated database using `psql` or pgAdmin:
```sql
CREATE DATABASE knowledge_app;
```

### Step 3: Install Workspace Dependencies
From the monorepo root:
```bash
npm run install:all
```

### Step 4: Configure Backend Environment Variables
Copy `backend/.env.example` to `backend/.env`:
```bash
cd backend
cp .env.example .env
```
Ensure `backend/.env` contains your local PostgreSQL credentials:
```env
PORT=3000
NODE_ENV=development

# Local PostgreSQL connection string (adjust user/password if needed)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/knowledge_app?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/knowledge_app?schema=public"

CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=debug
```

### Step 5: Configure Frontend Environment Variables
Copy `frontend/.env.example` to `frontend/.env`:
```bash
cd ../frontend
cp .env.example .env
```
Ensure `frontend/.env` contains:
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### Step 6: Generate Prisma Client & Run Migrations
From the monorepo root:
```bash
# Generate the Prisma Client
npm run prisma:generate

# Create and apply migrations against your local database
npm run prisma:migrate
```

### Step 7: Start Development Servers
In terminal 1 (Backend):
```bash
npm run dev:backend
# Starts Express REST API at http://localhost:3000
```
In terminal 2 (Frontend):
```bash
npm run dev:frontend
# Starts Vite dev server at http://localhost:5173
```

---

## 3. Path B: Cloud Development & Deployment with Neon PostgreSQL

Neon provides serverless PostgreSQL with instant provisioning, connection pooling via PgBouncer, and branch isolation.

### Step 1: Create a Neon Project
1. Log in to [Neon Console](https://console.neon.tech).
2. Create a new project (e.g., `knowledge-app-dev`).
3. Neon automatically creates a database named `neondb`.

### Step 2: Obtain Connection Strings
In the Neon Console Dashboard, obtain **both** connection strings:
1. **Pooled Connection String** (Uses PgBouncer on port `5432` or `6543`, containing `-pooler` in the host).
2. **Direct Connection String** (Direct unpooled connection to compute instance).

### Step 3: Understand Connection Pooling Mechanics with Prisma
- **Why Two URLs?**
  - **`DATABASE_URL` (Pooled)**: Used by `PrismaClient` during application runtime. PgBouncer manages high-concurrency client connections without exhausting PostgreSQL process limits. Requires `?sslmode=require&pgbouncer=true`.
  - **`DIRECT_URL` (Direct)**: Used exclusively by Prisma CLI (`prisma migrate dev`, `prisma migrate deploy`) for DDL migration commands. PgBouncer does not support prepared statements and transactional locks required during schema migrations.

### Step 4: Configure `backend/.env` for Neon
```env
PORT=3000
NODE_ENV=development

# Pooled connection for Prisma Client queries:
DATABASE_URL="postgresql://<user>:<password>@ep-xyz-pooler.region.neon.tech/neondb?sslmode=require&pgbouncer=true"

# Direct connection for Prisma Migrate:
DIRECT_URL="postgresql://<user>:<password>@ep-xyz.region.neon.tech/neondb?sslmode=require"

CORS_ORIGIN=http://localhost:5173
```

### Step 5: Apply Migrations to Neon
From the monorepo root:
```bash
npm run prisma:migrate
```
Prisma Migrate connects directly using `DIRECT_URL` to create tables and execute migration DDL scripts, while the backend runtime connects via `DATABASE_URL` with connection pooling.

---

## 4. Verification & Diagnostics

### Validate Prisma Schema Syntax
```bash
npm run prisma:generate
```

### Verify Backend Health
```bash
curl http://localhost:3000/health
# Expected: {"success":true,"status":"healthy","version":"0.1.0"}
```

### Launch Prisma Studio (GUI Data Browser)
To visually inspect your database tables and rows in your browser:
```bash
npm run prisma:studio --workspace=backend
# Opens Prisma Studio at http://localhost:5555
```
