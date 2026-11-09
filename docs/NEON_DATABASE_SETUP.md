# Neon Serverless PostgreSQL Setup & Operations Guide

> **Project:** Personal Knowledge Management (Knowledge App)  
> **Database:** PostgreSQL (Neon Managed Cloud)  
> **ORM:** Prisma 5.22.0  
> **Status:** Production-Ready & Verified

---

## 1. Neon Project Configuration

- **Organization ID:** `org-crimson-dust-54446763`
- **Project Name:** `plain-tree-86358490`
- **Primary Branch:** `production`
- **Database Engine:** PostgreSQL 18 (Serverless Compute)
- **Database Name:** `neondb`
- **Connection Architecture:** Dual-endpoint (Pooled runtime via PgBouncer + Direct unpooled for migrations)

---

## 2. Environment Variables & Logical Mapping

Neon CLI generates connection strings during `neon init` / `neon deploy` into `.env.local`. The application maps these to Prisma standard variables:

| Neon CLI Generated Variable | Prisma / Application Mapping | Purpose | Architecture Note |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | `DATABASE_URL` | Runtime application queries | Uses Neon PgBouncer connection pooler (`*-pooler.*`) with `sslmode=require` |
| `DATABASE_URL_UNPOOLED` | `DIRECT_URL` | Schema migrations & DDL | Direct connection to compute endpoint (`*.*`) with `sslmode=require` |
| `NEON_BRANCH` | (Neon CLI metadata) | Target branch (`production`) | Tracks active database branch |
| `NEON_BRANCH_ID` | (Neon CLI metadata) | Unique branch identifier | Managed by Neon CLI |
| `NEON_FUNCTION_HOST_SUFFIX` | (Neon CLI metadata) | Regional compute host suffix | Regional routing |

### Environment File Priority Order
The backend configuration ([`backend/src/config/env.js`](file:///c:/Users/ADMIN/Desktop/Project/PersonalKnowledgeManagement/backend/src/config/env.js)) automatically loads variables in the following order (highest precedence wins):
1. **System environment variables** (`process.env`)
2. **`.env.local`** (in monorepo root or `backend/` directory) with `override: true`
3. **`.env`** (baseline local default)

---

## 3. Prisma Configuration

In [`backend/prisma/schema.prisma`](file:///c:/Users/ADMIN/Desktop/Project/PersonalKnowledgeManagement/backend/prisma/schema.prisma):

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

- `url`: Uses the pooled connection (`DATABASE_URL`) to allow scalable, concurrent serverless and microservice requests without exhausting PostgreSQL connection limits.
- `directUrl`: Uses the direct compute connection (`DIRECT_URL`) for schema migrations (`prisma migrate deploy`), allowing DDL statements and transactional session locks that PgBouncer would otherwise restrict.
- `binaryTargets`: Includes `native` for local development (Windows/macOS) and `rhel-openssl-3.0.x` for cloud deployment (Vercel / AWS Lambda / Linux).

---

## 4. Migration & Schema Workflow

### Development Environment (Local)
When introducing a new model or schema modification:
```powershell
# 1. Modify backend/prisma/schema.prisma
# 2. Generate and test the migration locally:
npm run prisma:migrate --workspace=backend
```

### Production Environment (Neon Cloud)
> [!CAUTION]
> **Safety Rule:** Never run `prisma migrate dev` or `prisma db push` against the Neon `production` branch.

To safely deploy migrations to the Neon Production database:
```powershell
# 1. Generate updated Prisma Client
npm run prisma:generate --workspace=backend

# 2. Check pending migration status
npm run prisma:status --workspace=backend

# 3. Apply pending migrations safely (non-destructive)
npm run prisma:migrate:deploy --workspace=backend
```

---

## 5. Local Development Setup

1. **Prerequisites:** Node.js >= 18.0.0, npm >= 9.0.0.
2. **Configuration:**
   - Ensure `.env.local` exists in the repository root or `backend/` with valid Neon credentials:
     ```env
     DATABASE_URL="postgresql://<user>:<password>@<endpoint>-pooler.<region>.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
     DATABASE_URL_UNPOOLED="postgresql://<user>:<password>@<endpoint>.<region>.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
     DIRECT_URL="postgresql://<user>:<password>@<endpoint>.<region>.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
     PORT=3000
     NODE_ENV=development
     CORS_ORIGIN=http://localhost:5173
     ```
3. **Start Development Servers:**
   ```powershell
   # Start backend API (Port 3000)
   npm run dev:backend

   # Start frontend Vite SPA (Port 5173)
   npm run dev:frontend
   ```

---

## 6. Verification & Health Check

### Health Check Endpoint
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health"
```
*Expected response:*
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-11-08T15:51:03.026Z",
  "version": "0.1.0"
}
```

### Note CRUD Verification
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/notes"
```
*Expected response:*
```json
{
  "success": true,
  "message": "Notes retrieved successfully",
  "data": [],
  "meta": { "total": 0, "page": 1, "limit": 20 }
}
```

---

## 7. Common Errors & Troubleshooting

| Error Code / Symptom | Root Cause | Solution |
| :--- | :--- | :--- |
| **P1001 (Can't reach database)** | Compute endpoint is suspended, network issue, or missing `sslmode=require`. | Ensure compute endpoint is active in Neon Console. Verify `sslmode=require` is present in connection strings. |
| **P1000 (Authentication failed)** | Database user credentials or password expired/changed. | Re-run `neon connection-string` or copy updated credentials to `.env.local`. |
| **P3005 (Database schema not empty)** | Attempting to run `prisma migrate dev` on production database. | Use `prisma migrate deploy` instead. Never run `migrate dev` on production. |
| **EPERM: query_engine-windows.dll.node** | A running Node process has locked the query engine binary during `prisma generate`. | Stop running `npm run dev:backend` or Node process, re-run `npm run prisma:generate`, then restart server. |
| **Connection limit exceeded** | Direct connections used instead of pooled connection. | Ensure `DATABASE_URL` uses the `-pooler` hostname for runtime application queries. |

---

## 8. Security Considerations

1. **Zero Secret Leakage:** Never commit `.env.local`, `.env`, or any file containing live credentials to git. All secret files are strictly listed in `.gitignore`.
2. **Frontend Isolation:** Neither `DATABASE_URL` nor `DIRECT_URL` is ever exposed to the frontend Vite build. The client only interacts with the backend REST API via `VITE_API_BASE_URL`.
3. **SSL/TLS Encryption:** All connections to Neon require TLS 1.3 encryption with `sslmode=require` and `channel_binding=require`.
