# Architectural Decisions

This document records the architectural decision records (ADRs) for Knowledge App.

---

## ADR-001: Monorepo with Independent Applications

- **Status**: Accepted
- **Decision**: Use a monorepo containing independent `frontend/` and `backend/` packages with npm workspaces.
- **Context**: The project is a full-stack web application requiring separate client and server lifecycles while benefiting from unified developer tooling.
- **Rationale**: Single repository simplifies tracking and versioning, while independent package configurations avoid bundling or dependency coupling.

---

## ADR-002: Hierarchy via parentId (Adjacency List)

- **Status**: Accepted
- **Decision**: Represent tree hierarchy using a nullable self-referencing `parentId` foreign key on the `notes` table.
- **Context**: Notes and folders form a tree structure of arbitrary depth.
- **Rationale**: 
  - Adjacency list is straightforward, standard in relational databases, and allows moving subtrees by updating a single field (`parentId`).
  - Circular references are rejected in the service layer by upward ancestor traversal before executing the update.
- **Consequences**: Tree construction queries retrieve siblings or parent chains cleanly. Recursive queries can use PostgreSQL Common Table Expressions (CTEs) or service traversal.

---

## ADR-003: Independent Knowledge Graph (note_relationships)

- **Status**: Accepted
- **Decision**: Store knowledge graph relationships in an independent table named `note_relationships`.
- **Context**: Notes connect across branches of the hierarchy.
- **Rationale**:
  - Keeps hierarchy (`parentId`) and knowledge connections completely decoupled. Moving a note never modifies or breaks its relationships.
  - Directional connections (`sourceNoteId` -> `targetNoteId`) allow typed dependencies (`DEPENDS_ON`, `REFERENCES`, etc.).
  - Backlinks are trivially resolved by querying `targetNoteId`.
  - Database-level cascade (`onDelete: Cascade`) guarantees that deleting a note purges all associated relationship rows, preventing dangling graph edges.

---

## ADR-004: Directional Relationships with Composite Unique Constraint

- **Status**: Accepted
- **Decision**: All note relationships are directional with composite uniqueness on `(source_note_id, target_note_id, relationship_type)`.
- **Context**: Avoid duplicate edges while maintaining semantic distinction (e.g. `A DEPENDS_ON B` does not imply `B DEPENDS_ON A`).
- **Rationale**: Relational composite unique constraint prevents duplicates at the database engine level. Self-referencing connections (`source === target`) are rejected by service validation.

---

## ADR-005: JavaScript ES6+ Throughout (No TypeScript)

- **Status**: Accepted
- **Decision**: Use pure JavaScript (ES6+ with ES Modules) across both frontend and backend.
- **Context**: Project constraint explicitly forbids TypeScript (`.ts`, `.tsx`, `tsconfig.json`).
- **Rationale**: Strict adherence to project constraints. Code clarity is maintained through JSDoc comments, Prisma's rich generated client, and ESLint.

---

## ADR-006: TipTap for Rich Text Editing

- **Status**: Accepted
- **Decision**: Use TipTap as the rich text editor on the frontend.
- **Context**: Requires an extensible, headless editor supporting headings, lists, code blocks, task items, and internal links.
- **Rationale**: Built on ProseMirror, active ecosystem, headless architecture compatible with Tailwind CSS.

---

## ADR-007: React Flow for Knowledge Graph Visualization

- **Status**: Accepted
- **Decision**: Use React Flow (`reactflow` v11) for interactive graph rendering.
- **Rationale**: Mature, performant canvas with built-in zoom, pan, selection, customizable nodes, and custom directed edges.

---

## ADR-008: Migration to PostgreSQL & Prisma ORM

- **Status**: Accepted (Supersedes MongoDB / Mongoose)
- **Decision**: Migrate primary database architecture from MongoDB + Mongoose to **PostgreSQL + Prisma ORM**.
- **Context**: 
  - Knowledge App relies on relational guarantees: foreign keys, cascading deletes for graph edges, composite uniqueness, and join tables.
  - PostgreSQL offers rock-solid ACID transactions, relational integrity, and native JSONB capabilities.
  - Prisma ORM provides a single, declarative schema file (`prisma/schema.prisma`), automated migrations via Prisma Migrate, and an auto-generated query client with full autocomplete in modern JavaScript.
- **Rationale**:
  - Replaces fragile manual cascade logic with database-enforced foreign key cascades (`onDelete: Cascade` on `note_relationships` and `note_tags`).
  - Local development is supported via standard PostgreSQL; production deployment is supported via serverless PostgreSQL on **Neon**.
- **Consequences**: Mongoose models are removed. Database connection is managed via a singleton `PrismaClient`.

---

## ADR-009: TipTap Content Persistence via PostgreSQL JSONB

- **Status**: Accepted
- **Decision**: Store TipTap editor content as native ProseMirror JSON using PostgreSQL `JSONB` column type.
- **Context**: Rich text editors produce structured documents (nodes and marks). Storing raw HTML requires fragile parsing and loses custom node attributes.
- **Rationale**:
  - TipTap natively exports and imports ProseMirror JSON (`editor.getJSON()`).
  - PostgreSQL `JSONB` stores decomposed binary JSON, enabling indexing, fast retrieval, and future JSON path querying.
  - Avoids HTML sanitation and serialization overhead during frequent auto-save cycles.
- **Consequences**: `Note.content` field in Prisma is `Json? @db.JsonB`. `contentFormat` defaults to `'json'`.

---

## ADR-010: Database Migration Strategy with Prisma Migrate

- **Status**: Accepted
- **Decision**: Manage all database schema evolution using Prisma Migrate (`prisma migrate dev` in development, `prisma migrate deploy` in production).
- **Context**: Need reproducible, version-controlled SQL migrations across local and cloud environments.
- **Rationale**:
  - Prisma Migrate generates declarative, human-readable SQL migration scripts in `backend/prisma/migrations/`.
  - Supports Neon managed PostgreSQL:
    - Connection pooling (PgBouncer) via `DATABASE_URL` for application queries.
    - Direct connection via `DIRECT_URL` for migration DDL commands.
- **Consequences**: Schema modifications must be made in `backend/prisma/schema.prisma` and applied via `npm run prisma:migrate`.

---

## ADR-011: Unified Note & Folder Table (`notes`)

- **Status**: Accepted
- **Decision**: Notes and folders share a single table named `notes`, distinguished by an enum column `type` (`NOTE` | `FOLDER`).
- **Context**: Both notes and folders participate in hierarchy, can contain children, have titles, and participate in knowledge graph relationships.
- **Rationale**:
  - Eliminates polymorphic join complexity.
  - Moving a note into a folder is a simple update to `parentId`.
  - Allows notes to have children just like folders, supporting document-outline workflows.

---

## ADR-012: REST API Versioning with `/api/v1` Prefix

- **Status**: Accepted
- **Decision**: All REST endpoints are versioned with the `/api/v1` prefix.
- **Rationale**: Ensures backward compatibility and clean API contracts across frontend client releases.
