# AGENTS.md — Knowledge App

This file defines the rules, context, and guidelines for AI agents collaborating on the Knowledge App codebase.

**All AI agents must read this file before making any changes to the codebase.**

---

## 1. Project Context

### Application Purpose
Knowledge App is a Personal Knowledge Management (PKM) web application.

Users can:
- Create and edit notes with rich text content (TipTap editor)
- Organize notes in a hierarchical tree structure (unlimited depth)
- Create typed, directional relationships between any notes (knowledge graph)
- Explore connections through a visual graph (React Flow)
- Search notes by title, content, and tags

### Core Principle
> **Notes are the center of the entire application.**

Every architectural decision should serve the note — creation, organization, connection, search, and visualization.

### Domain Model (PostgreSQL / Prisma)
| Entity / Table | Purpose |
|----------------|---------|
| `notes` | Core knowledge items (content notes or folders) |
| `note_relationships` | Directional typed connections between notes |
| `tags` | Reusable labels for categorizing notes |
| `note_tags` | Relational join table connecting notes and tags |
| `users` | User accounts (prepared for future auth, not active in MVP) |

### Critical Architecture Rule
**Hierarchy and relationships are independent.**
- Moving a note within the hierarchy must NEVER remove or break its knowledge graph relationships.
- `parentId` governs hierarchy. `NoteRelationship` governs graph connections.

---

## 2. Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 | UI library |
| Vite | Build tool and dev server |
| Tailwind CSS | Utility-first styling |
| shadcn/ui (Radix UI) | Accessible component primitives |
| React Router v6 | Client-side routing |
| Axios | HTTP client |
| TipTap | Rich text editor (ProseMirror JSON) |
| React Flow (reactflow) | Knowledge graph visualization |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js >= 18 | Runtime (ES Modules) |
| Express.js | HTTP framework |
| Prisma ORM | Object-Relational Mapping & Client |
| express-validator | Request validation |
| express-async-errors | Async error propagation |
| helmet | HTTP security headers |
| cors | CORS configuration |
| morgan | HTTP request logging |

### Database
| Technology | Purpose |
|-----------|---------|
| PostgreSQL | Relational database (local development) |
| Neon PostgreSQL | Managed serverless PostgreSQL (cloud / production) |
| Prisma Migrate | Declarative database migrations |

---

## 3. Technology Restrictions

These restrictions are ABSOLUTE. Do not introduce alternatives without explicit user approval.

### FORBIDDEN
- ❌ TypeScript — Use JavaScript (ES6+) only
- ❌ Docker — Do not create Dockerfiles or docker-compose files
- ❌ Microservices — This is a single modular backend application
- ❌ `.ts` or `.tsx` files — Use `.js` and `.jsx` only
- ❌ `tsconfig.json` — Not applicable
- ❌ Java, Python, or any non-JavaScript backend
- ❌ Next.js or Remix — Pure React SPA + Express API
- ❌ GraphQL — Use REST API only with `/api/v1` prefix
- ❌ Yarn or pnpm — Use npm only
- ❌ MongoDB / Mongoose — Replaced by PostgreSQL + Prisma ORM

### REQUIRED
- ✅ JavaScript ES6+ throughout
- ✅ `.js` and `.jsx` file extensions
- ✅ `type: "module"` in package.json (ES Modules)
- ✅ npm for package management
- ✅ Environment variables via `.env` files (`DATABASE_URL`, `DIRECT_URL`)
- ✅ Prisma Client (`@prisma/client`) as single database access layer

---

## 4. Architecture Rules

### 4.1 Monorepo Structure
```
knowledge-app/
├── frontend/     # React SPA (independent)
├── backend/      # Express API + Prisma (independent)
├── docs/         # Documentation
├── AGENTS.md     # This file
└── package.json  # Root monorepo config
```

Frontend and backend have INDEPENDENT `package.json` files and `node_modules`.

### 4.2 Frontend Architecture (Feature-Based)

```
frontend/src/
├── features/              # PRIMARY code location
│   └── <feature>/
│       ├── components/    # Feature-specific components
│       ├── hooks/         # Feature-specific hooks
│       ├── services/      # Feature-specific API calls
│       ├── constants/     # Feature-specific constants
│       └── utils/         # Feature-specific utilities
├── components/
│   ├── common/            # Generic reusable components
│   ├── layout/            # App shell components
│   └── ui/                # shadcn/ui wrappers
├── services/
│   └── apiClient.js       # Centralized Axios instance (baseURL: /api/v1)
├── hooks/                 # Shared hooks only
├── stores/                # Global state (introduce only when needed)
├── routes/AppRoutes.jsx   # Central route definitions
├── utils/                 # Shared pure utilities
└── constants/             # App-wide constants
```

**Rules**:
1. All HTTP calls go through `services/apiClient.js`. Do NOT create separate Axios instances.
2. UI components do NOT make direct API calls.
3. Business logic belongs in hooks and services, NOT in components.
4. Routes are defined ONLY in `src/routes/AppRoutes.jsx`.
5. `App.jsx` must remain minimal (providers + router only).

### 4.3 Backend Architecture (Modular Monolith with Prisma)

```
backend/
├── prisma/
│   ├── schema.prisma       # Single source of truth for database schema
│   ├── migrations/         # Prisma migration history
│   └── seed.js             # Initial database seeding script
├── src/
│   ├── modules/            # Business domain modules
│   │   └── <domain>/
│   │       ├── <domain>.controller.js  # HTTP handler (req/res only)
│   │       ├── <domain>.service.js     # Business logic + Prisma queries
│   │       ├── <domain>.routes.js      # Route definitions (/api/v1/<domain>)
│   │       ├── <domain>.validation.js  # Request validation rules
│   │       └── <domain>.test.js        # Unit and integration tests
│   ├── config/
│   │   ├── database.js     # PrismaClient singleton instance
│   │   └── env.js          # Environment config (DATABASE_URL, DIRECT_URL)
│   ├── middlewares/
│   │   ├── errorHandler.js # AppError + Prisma error handler
│   │   └── validateRequest.js # express-validator result middleware
│   ├── utils/
│   │   └── apiResponse.js  # Standardized response helpers
│   ├── constants/index.js  # Shared backend constants
│   ├── app.js              # Express app factory (middleware + routes)
│   └── server.js           # HTTP server entry (startup + shutdown)
```

**Rules**:
1. Controllers handle ONLY: parsing request → calling service → sending response.
2. ALL business logic goes in services.
3. Services throw `AppError` for operational errors.
4. `app.js` is the app factory. `server.js` starts the HTTP server.
5. All database operations use `prisma` imported from `src/config/database.js`.
6. New routes are registered in `app.js` under `/api/v1`.

---

## 5. Coding Standards

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| React component | PascalCase | `NoteEditor` |
| Component file | PascalCase.jsx | `NoteEditor.jsx` |
| Hook | use + camelCase | `useNote.js`, `useAutoSave.js` |
| Service | camelCase + Service | `noteService.js` |
| Backend module file | domain.role.js | `note.service.js` |
| Constant values | UPPER_SNAKE_CASE | `NOTE_TYPES.NOTE` |
| Variables | camelCase | `noteTitle`, `isLoading` |
| Prisma models | PascalCase (mapped to snake_case tables) | `Note` (`notes`), `NoteRelationship` (`note_relationships`) |

### JavaScript Rules
- Use `const` by default; `let` only when reassignment is needed; NEVER `var`
- Use `async/await` over `.then()` chains
- Use template literals over string concatenation
- Use object shorthand (`{ title }` not `{ title: title }`)
- Use destructuring
- Prefer arrow functions for callbacks

### Error Handling

**Backend**:
```javascript
// ✅ Always throw AppError for operational errors
if (!note) throw new AppError('Note not found', 404);

// ❌ Never swallow errors or return null silently
if (!note) return null;
```

**Frontend**:
```javascript
// ✅ Always handle errors in hooks
try {
  const data = await noteService.createNote(payload);
  setNote(data);
} catch (error) {
  setError(error.message);
}
```

### JSDoc Requirements
All exported functions must have JSDoc comments:
```javascript
/**
 * Short description.
 * @param {string} noteId - UUID string
 * @returns {Promise<Object>} The note record
 * @throws {AppError} 404 if note not found
 */
export async function getNoteById(noteId) { ... }
```

---

## 6. Database Rules (PostgreSQL & Prisma)

### Schema Design
1. All tables and columns defined in `backend/prisma/schema.prisma`
2. Primary keys: UUID (`@id @default(uuid()) @db.Uuid`)
3. Foreign keys: explicit relations with `@relation`
4. Timestamps: `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`
5. Map model names to plural snake_case table names (`@@map("notes")`)
6. TipTap content: native PostgreSQL `Json? @db.JsonB`

### Hierarchy Rules
- `parentId: null` = root note (no parent)
- Adjacency list self-referencing relation on `notes`
- Circular references MUST be prevented in the service layer before saving
- Circular reference check: traverse ancestors upward; if the target `newParentId` is a descendant of the note being moved, reject it

### Note Deletion Rules
- Default deletion: re-parents direct children to the deleted note's `parentId`
- Cascade deletion (`cascade=true`): recursively deletes descendants
- **Knowledge graph cleanup**: Deleting a note MUST delete all `NoteRelationship` records where the note is source OR target (`onDelete: Cascade` in Prisma schema)

### Relationship Rules
- Relationships are DIRECTIONAL: `sourceNoteId → targetNoteId`
- A note cannot relate to itself (`sourceNoteId !== targetNoteId`)
- Duplicate relationships are prevented by composite unique constraint: `@@unique([sourceNoteId, targetNoteId, relationshipType])`

### Indexing Rules
- Index `parentId`, `type`, `title`, `archivedAt`, `isFavorite`, and relationship lookups
- Review query execution before adding redundant indexes

---

## 7. API Rules

### URL Conventions
- API version prefix: `/api/v1`
- Lowercase, hyphenated paths: `/api/v1/note-relationships`
- Plural nouns for collections: `/api/v1/notes`, `/api/v1/tags`
- UUID in path: `/api/v1/notes/:noteId`
- Sub-resources: `/api/v1/notes/:noteId/children`

### HTTP Methods
| Method | Use |
|--------|-----|
| GET | Read resources |
| POST | Create new resource |
| PATCH | Partial update |
| DELETE | Remove resource |

### Response Format
ALL API responses must follow:
```json
{
  "success": true,
  "message": "Human-readable message",
  "data": {} | [] | null,
  "meta": null | { "total": 0, "page": 1, "limit": 20 }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error summary",
  "errors": [{ "field": "title", "message": "Required" }]
}
```

### Validation Rules
- Use `express-validator` for all input validation
- Validate UUID format with `.isUUID()`
- Validate enums with `.isIn([...validValues])`
- Use `validateRequest` middleware after validation rules
- Return field-level errors to the client

### Status Codes
- 200: Success
- 201: Created
- 204: No Content (delete)
- 400: Bad Request / Validation
- 404: Not Found
- 409: Conflict (duplicate unique constraint)
- 500: Internal Server Error

---

## 8. Testing Rules

A feature is NOT complete without tests.

### Required Tests
1. **Unit tests** for all service functions with business logic
2. **Integration tests** for all API endpoints

### Test Locations
- Unit tests: `backend/tests/unit/`
- Integration tests: `backend/tests/integration/`
- Module-level tests: `backend/src/modules/<domain>/<domain>.test.js`

### Test Requirements by Feature

**Note Service**:
- Create note (valid, missing title, invalid parentId)
- Get note (found, not found, invalid UUID)
- Update note
- Delete note (reparenting vs cascade, relationship cleanup)
- Move note (success, circular reference prevention)

**Relationship Service**:
- Create relationship (valid, duplicate, self-referential, invalid type)
- Get relationships (outgoing, incoming)
- Delete relationship
- Cleanup on note deletion

### Test Framework
- Backend: Jest with native ES modules
- Run: `npm test` from monorepo root or `backend/` directory

---

## 9. Documentation Rules

### When to Update Documentation
| Event | Update Required |
|-------|----------------|
| New API endpoint added | `docs/05-api/API_SPECIFICATION.md` |
| Schema changed | `docs/04-database/DATABASE_SCHEMA.md` & `backend/prisma/schema.prisma` |
| New index added | `docs/04-database/INDEX_STRATEGY.md` |
| Architecture changed | `docs/03-architecture/` |
| New feature complete | `docs/02-requirements/FUNCTIONAL_REQUIREMENTS.md` (update status) |
| Significant decision made | `docs/03-architecture/ARCHITECTURAL_DECISIONS.md` |

---

## 10. AI Agent Rules

1. ✅ Read `AGENTS.md` (this file) before starting any task
2. ✅ Read relevant documentation in `docs/` for the feature being worked on
3. ✅ Follow the architecture — do not create files outside the defined structure
4. ✅ Follow naming conventions exactly
5. ✅ Write JSDoc for all exported functions
6. ✅ Handle all errors explicitly via `AppError`
7. ✅ Do NOT install new dependencies without informing the user and explaining why
8. ✅ Do NOT modify schemas without running `npx prisma validate` and documenting the migration
9. ✅ Only modify files related to the feature you are implementing
10. ✅ Verify implementation before claiming completion
11. ✅ Ensure new routes are registered in `app.js` under `/api/v1`
12. ✅ Update CHANGELOG.md after significant changes

### Prohibited Actions
- ❌ Do NOT introduce TypeScript
- ❌ Do NOT create Docker files
- ❌ Do NOT use yarn or pnpm
- ❌ Do NOT create microservices
- ❌ Do NOT reintroduce MongoDB or Mongoose
- ❌ Do NOT silently swallow errors
- ❌ Do NOT claim a feature is complete without tests
- ❌ Do NOT expose sensitive database credentials in code or logs

---

## 11. File Reference Map

| Need | File |
|------|------|
| Prisma Schema | `backend/prisma/schema.prisma` |
| Database connection (Prisma) | `backend/src/config/database.js` |
| Environment config | `backend/src/config/env.js` |
| Express app setup | `backend/src/app.js` |
| Server startup | `backend/src/server.js` |
| Error handling | `backend/src/middlewares/errorHandler.js` |
| Response helpers | `backend/src/utils/apiResponse.js` |
| API client config (frontend) | `frontend/src/services/apiClient.js` |
| App constants (frontend) | `frontend/src/constants/index.js` |
| Route definitions | `frontend/src/routes/AppRoutes.jsx` |

---

## 12. Phase Status

| Phase | Name | Status |
|-------|------|--------|
| 0 | Foundation & Prisma Architecture | ✅ Complete & Verified |
| 1 | Core Note Backend (PostgreSQL + Prisma) | ✅ Complete & Verified |
| 2 | Core Frontend & Note Editor (TipTap) | ✅ Complete & Verified |
| 3 | Hierarchical Note Organization | ✅ Complete & Verified |
| 4 | Note Relationships & Backlinks | ✅ Complete & Verified |
| 5 | Tags, Favorites, and Search | ✅ Complete & Verified |
| 6 | Knowledge Graph Visualization (React Flow) | ✅ Complete & Verified |
| 7 | Authentication & User Isolation Architecture | ✅ Complete & Verified |
| 8 | Import & Export (Markdown/JSON) | ✅ Complete & Verified |
| 9 | Final Integration, Regression, and Release Preparation | ✅ Complete & Verified |

---

*Last updated: 2026-11-07 — Architecture Update: PostgreSQL + Prisma Migration*
