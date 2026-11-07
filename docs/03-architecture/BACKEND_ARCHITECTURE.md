# Backend Architecture

## Approach: Domain-Based Modular Architecture with Prisma ORM

Each business domain is a modular unit with separated responsibilities, communicating with PostgreSQL via Prisma ORM.

## Directory Structure

```
backend/
├── prisma/
│   ├── schema.prisma            # Single source of truth for database schema
│   ├── migrations/              # Prisma Migrate history
│   └── seed.js                  # Database seed script
│
├── src/
│   ├── modules/                 # Business domain modules
│   │   ├── notes/
│   │   │   ├── note.controller.js  # HTTP handler (req/res only)
│   │   │   ├── note.service.js     # Business logic + Prisma queries
│   │   │   ├── note.routes.js      # Route definitions (/api/v1/notes)
│   │   │   ├── note.validation.js  # express-validator rules
│   │   │   └── note.test.js        # Module tests
│   │   ├── hierarchy/
│   │   ├── relationships/
│   │   ├── backlinks/
│   │   ├── tags/
│   │   ├── search/
│   │   └── users/
│   │
│   ├── config/
│   │   ├── database.js          # PrismaClient singleton instance
│   │   └── env.js               # Validated env config (DATABASE_URL, DIRECT_URL)
│   │
│   ├── middlewares/
│   │   ├── errorHandler.js      # Global error handler (AppError + Prisma error codes)
│   │   └── validateRequest.js   # express-validator result handler
│   │
│   ├── utils/
│   │   └── apiResponse.js       # Standardized response helpers
│   │
│   ├── constants/
│   │   └── index.js             # Backend constants & enums
│   │
│   ├── app.js                   # Express app factory (middleware + /api/v1 routes)
│   └── server.js                # HTTP server startup & graceful shutdown
│
├── tests/
│   ├── unit/                    # Service unit tests
│   └── integration/             # Supertest HTTP integration tests
│
├── .env.example
├── .eslintrc.cjs
└── package.json
```

## Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| **Prisma Schema (`schema.prisma`)** | Data definitions, foreign keys, delete cascades, indexes, migrations |
| **Prisma Client (`src/config/database.js`)** | Database connection lifecycle, query execution |
| **Service Layer (`*.service.js`)** | Domain business logic, cycle prevention, reparenting algorithms |
| **Validation Layer (`*.validation.js`)** | Request payload, UUID format, and parameter validation |
| **Controller Layer (`*.controller.js`)** | Parsing request inputs, invoking service, returning standardized response |
| **Routes Layer (`*.routes.js`)** | Endpoint path mappings under `/api/v1`, middleware chaining |

## Rules

1. **Controllers contain NO business logic or database calls**:
   Controllers only parse input, call the service, and respond using `sendSuccess`, `sendCreated`, or `sendNoContent`.
2. **Services own business logic and Prisma interactions**:
   All `prisma.note.*` or transactional queries belong exclusively in `*.service.js`.
3. **Hierarchy cycle prevention**:
   When moving a note, `note.service.js` performs upward ancestor traversal. If `newParentId` is a descendant of the note, it throws `AppError('Circular reference detected', 400)`.
4. **Independent relationship integrity**:
   When a note is deleted, Prisma's foreign key cascades (`onDelete: Cascade`) automatically purge references in `note_relationships`, ensuring no orphan edges remain in the knowledge graph.
5. **Standardized `/api/v1` routes**:
   All routes are registered in `app.js` with the `/api/v1` prefix.
