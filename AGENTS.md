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

### Domain Model
| Entity | Purpose |
|--------|---------|
| Note | Core knowledge item (content or folder) |
| NoteRelationship | Directional typed connection between notes |
| Tag | Reusable label for categorizing notes |
| User | (Prepared for future auth, not active in MVP) |

### Critical Architecture Rule
**Hierarchy and relationships are independent.**
- Moving a note within the hierarchy must NEVER remove or break its relationships.
- `parentId` governs hierarchy. `NoteRelationship` governs connections.

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
| TipTap | Rich text editor |
| React Flow (reactflow) | Knowledge graph visualization |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js >= 18 | Runtime |
| Express.js | HTTP framework |
| Mongoose | MongoDB ODM |
| express-validator | Request validation |
| express-async-errors | Async error propagation |
| helmet | HTTP security headers |
| cors | CORS configuration |
| morgan | HTTP request logging |

### Database
| Technology | Purpose |
|-----------|---------|
| MongoDB | Primary database |
| Mongoose | Schema definition and ODM |

---

## 3. Technology Restrictions

These restrictions are ABSOLUTE. Do not introduce alternatives without explicit user approval.

### FORBIDDEN
- ❌ TypeScript — Use JavaScript (ES6+) only
- ❌ Docker — Do not create Dockerfiles or docker-compose files
- ❌ Microservices — This is a single backend application
- ❌ `.ts` or `.tsx` files — Use `.js` and `.jsx` only
- ❌ `tsconfig.json` — Not applicable
- ❌ Java, Python, or any non-JavaScript backend
- ❌ Next.js or Remix — Pure React SPA + Express API
- ❌ GraphQL — Use REST API only
- ❌ Yarn or pnpm — Use npm only

### REQUIRED
- ✅ JavaScript ES6+ throughout
- ✅ `.js` and `.jsx` file extensions
- ✅ `type: "module"` in package.json (ES Modules)
- ✅ npm for package management
- ✅ Environment variables via `.env` files

---

## 4. Architecture Rules

### 4.1 Monorepo Structure
```
knowledge-app/
├── frontend/     # React SPA (independent)
├── backend/      # Express API (independent)
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
│   └── apiClient.js       # Centralized Axios instance (DO NOT DUPLICATE)
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

### 4.3 Backend Architecture (Domain-Based)

```
backend/src/
├── modules/               # Business domain modules
│   └── <domain>/
│       ├── <domain>.model.js       # Mongoose schema + model
│       ├── <domain>.controller.js  # HTTP handler (req/res only)
│       ├── <domain>.service.js     # Business logic
│       ├── <domain>.routes.js      # Route definitions
│       ├── <domain>.validation.js  # Validation rules
│       └── <domain>.test.js        # Tests
├── config/
│   ├── database.js        # MongoDB connection
│   └── env.js             # Environment config
├── middlewares/
│   ├── errorHandler.js    # AppError class + global error handler
│   └── validateRequest.js # express-validator result middleware
├── utils/
│   └── apiResponse.js     # Standardized response helpers
├── constants/index.js     # Shared backend constants
├── app.js                 # Express app factory (middleware + routes)
└── server.js              # HTTP server entry (startup + shutdown)
```

**Rules**:
1. Controllers handle ONLY: parsing request → calling service → sending response.
2. ALL business logic goes in services.
3. Services throw `AppError` for operational errors.
4. `app.js` is the app factory. `server.js` starts the HTTP server.
5. New routes are registered in `app.js`.

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
| Mongoose model | PascalCase | `Note`, `NoteRelationship` |

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
 * @param {string} noteId - MongoDB ObjectId string
 * @returns {Promise<Object>} The note document
 * @throws {AppError} 404 if note not found
 */
export async function getNoteById(noteId) { ... }
```

---

## 6. Database Rules

### Schema Design
1. Define field-level validation in Mongoose schemas
2. Use `required`, `minlength`, `maxlength`, `enum` validators
3. Use `timestamps: true` on all schemas
4. Use `versionKey: false` to remove `__v`
5. Store references as `Schema.Types.ObjectId` with `ref`

### Hierarchy Rules
- `parentId: null` = root note (no parent)
- Use adjacency list pattern (parentId field)
- Circular references MUST be prevented in the service layer before saving
- Circular reference check: traverse ancestors upward; if the target `newParentId` is a descendant of the note being moved, reject it

### Relationship Rules
- Relationships are DIRECTIONAL: `sourceNoteId → targetNoteId`
- A note cannot relate to itself (`sourceNoteId !== targetNoteId`)
- Duplicate relationships are prevented by the unique compound index
- When a note is deleted, ALL its relationships (as source OR target) must be deleted

### Indexing Rules
- Always create indexes for fields used in `find()` filters
- Document the reason for each index in a comment above it
- Do NOT create redundant indexes
- Never remove an existing index without understanding the impact

### Do Not
- Do NOT store deeply nested hierarchy as embedded arrays in documents
- Do NOT populate references unnecessarily
- Do NOT change schema field types without documenting the migration
- Do NOT remove indexes without reviewing all query patterns

---

## 7. API Rules

### URL Conventions
- Lowercase, hyphenated paths: `/api/note-relationships`
- Plural nouns for collections: `/api/notes`, `/api/tags`
- ObjectId in path: `/api/notes/:noteId`
- Sub-resources: `/api/notes/:noteId/children`

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
- Validate ObjectId format with `.isMongoId()`
- Validate enums with `.isIn([...validValues])`
- Use `validateRequest` middleware after validation rules
- Return field-level errors to the client

### Status Codes
- 200: Success
- 201: Created
- 204: No Content (delete)
- 400: Bad Request / Validation
- 404: Not Found
- 409: Conflict (duplicate)
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
- Get note (found, not found, invalid ID)
- Update note
- Delete note (cleanup relationships)
- Move note (success, circular reference prevention)

**Relationship Service**:
- Create relationship (valid, duplicate, self-referential, invalid type)
- Get relationships (outgoing, incoming)
- Delete relationship
- Cleanup on note deletion

### Test Framework
- Backend: Jest with ES modules
- Run: `npm test` from `backend/` directory

---

## 9. Documentation Rules

### When to Update Documentation
| Event | Update Required |
|-------|----------------|
| New API endpoint added | `docs/05-api/API_SPECIFICATION.md` |
| Schema changed | `docs/04-database/DATABASE_SCHEMA.md` |
| New index added | `docs/04-database/INDEX_STRATEGY.md` |
| Architecture changed | `docs/03-architecture/` |
| New feature complete | `docs/02-requirements/FUNCTIONAL_REQUIREMENTS.md` (update status) |
| Significant decision made | `docs/03-architecture/ARCHITECTURAL_DECISIONS.md` |

### Documentation Standards
- Write in English
- Use Markdown
- Distinguish clearly: ✅ Implemented | 📋 Planned | 🔮 Future
- Include Mermaid diagrams for flows and architectures
- Never document planned features as implemented
- Update `CHANGELOG.md` for every significant change

---

## 10. AI Agent Rules

### Before Starting Any Task
1. ✅ Read `AGENTS.md` (this file)
2. ✅ Read the relevant documentation in `docs/` for the feature you are working on
3. ✅ Read the existing files in the module you are modifying
4. ✅ Understand what already exists before adding anything

### During Implementation
5. ✅ Follow the architecture — do not create files outside the defined structure
6. ✅ Follow naming conventions exactly
7. ✅ Write JSDoc for all exported functions
8. ✅ Handle all errors explicitly
9. ✅ Do NOT install new dependencies without informing the user and explaining why
10. ✅ Do NOT modify schemas without documenting the change

### Module Isolation
11. ✅ Only modify files related to the feature you are implementing
12. ✅ Do NOT modify unrelated modules
13. ✅ Do NOT refactor code that is not part of your task unless requested

### Verification
14. ✅ Verify your implementation is consistent with the architecture before claiming completion
15. ✅ Check that all referenced files and imports exist
16. ✅ Ensure new routes are registered in `app.js`
17. ✅ Ensure new schemas are consistent with `DATABASE_SCHEMA.md`

### Reporting
18. ✅ Report all files you created or modified
19. ✅ Report any unresolved issues or design decisions that need user input
20. ✅ Update CHANGELOG.md after significant changes
21. ✅ Update documentation after implementing a feature

### Prohibited Actions
- ❌ Do NOT introduce TypeScript
- ❌ Do NOT create Docker files
- ❌ Do NOT use yarn or pnpm
- ❌ Do NOT create microservices
- ❌ Do NOT change the approved architecture without justification
- ❌ Do NOT silently swallow errors
- ❌ Do NOT claim a feature is complete without tests
- ❌ Do NOT expose sensitive data in API responses

---

## 11. File Reference Map

| Need | File |
|------|------|
| API client config | `frontend/src/services/apiClient.js` |
| App constants (frontend) | `frontend/src/constants/index.js` |
| App constants (backend) | `backend/src/constants/index.js` |
| Environment config | `backend/src/config/env.js` |
| Database connection | `backend/src/config/database.js` |
| Express app setup | `backend/src/app.js` |
| Server startup | `backend/src/server.js` |
| Error handling | `backend/src/middlewares/errorHandler.js` |
| Response helpers | `backend/src/utils/apiResponse.js` |
| Note model | `backend/src/modules/notes/note.model.js` |
| Relationship model | `backend/src/modules/relationships/noteRelationship.model.js` |
| Tag model | `backend/src/modules/tags/tag.model.js` |
| User model | `backend/src/modules/users/user.model.js` |
| Route definitions | `frontend/src/routes/AppRoutes.jsx` |

---

## 12. Phase Status

| Phase | Name | Status |
|-------|------|--------|
| 0 | Foundation | ✅ Complete |
| 1 | Core Note System | 📋 Ready to implement |
| 2 | Hierarchical Organization | 📋 Planned |
| 3 | Knowledge Connections | 📋 Planned |
| 4 | Knowledge Discovery | 📋 Planned |
| 5 | Knowledge Graph | 📋 Planned |
| 6+ | Auth, Export, Import | 🔮 Future |

---

*Last updated: 2026-11-07 — Phase 0 Foundation*
