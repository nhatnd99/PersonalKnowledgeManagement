# Implementation Queue Specifications (Q00 — Q09)

## Queue Definitions & Scope

### Q00: Codebase Discovery & Gap Analysis
- Verify monorepo packages, dependencies, and environment files.
- Inspect database schema, Prisma Client, and migrations.
- Audit Express factory, error middlewares, and standard response helpers.
- Run linting, testing, and Vite production builds.
- Produce gap analysis document with status classifications.

### Q01: Core Note Backend
- Base route: `/api/v1/notes`
- Note data validation: UUIDs, title length, type enum, pagination params.
- Prisma data access operations (create, findById, findMany, update, delete, move).
- Reparenting vs recursive cascade deletion policies.
- Upward ancestor traversal for circular hierarchy prevention.
- Integration test suite with 100% pass rate.

### Q02: Frontend Foundation & TipTap Editor
- Application layout shell (Header, Sidebar, dynamic main workspace).
- Centralized Axios client with `/api/v1` base URL.
- TipTap editor supporting ProseMirror JSON format (headings, lists, tasks, code blocks, links).
- Auto-save engine (`useAutoSave.js`) with 1500ms debounce and navigation flush.
- Visual save status indicators (`Saving...`, `Saved at <time>`, `Save failed`).

### Q03: Hierarchical Organization
- Collapsible sidebar tree with folders and notes (`HierarchyTree.jsx`, `TreeNode.jsx`).
- Drag-and-drop reparenting with visual drop indicators.
- Sibling sort order and root drop zone.
- `PATCH /api/v1/notes/:id/move` integration with cycle prevention.
- Breadcrumb navigation component (`Breadcrumbs.jsx`).

### Q04: Knowledge Relationships & Backlinks
- Base route: `/api/v1/relationships`
- Supported relationship types: `RELATED_TO`, `DEPENDS_ON`, `REFERENCES`, `EXTENDS`, `CONTRADICTS`.
- Composite unique constraint `@@unique([sourceNoteId, targetNoteId, relationshipType])` with HTTP 409 on duplicates.
- Rejection of self-referencing relationships (HTTP 400).
- Outgoing connections drawer and incoming backlinks panel.
- Obsidian-style connections footer on note editor.

### Q05: Knowledge Discovery: Search, Tags & Favorites
- Search route: `GET /api/v1/search` with keywords, tags, types, favorites, and pagination.
- Tags route: `/api/v1/tags` and note assignment `/api/v1/notes/:noteId/tags`.
- Tag taxonomy management view (`/tags`) with color picker and note counts.
- Interactive tag chip selector directly on notes (`NoteTagsSelector.jsx`).
- Faceted search view (`/search`) with filter pills and detailed result cards.

### Q06: Knowledge Graph Visualization
- Graph route: `GET /api/v1/graph` with type filtering, localized hop sub-graph (`rootId`, `depth`), and toggleable hierarchy links.
- Interactive **React Flow** canvas mounted at `/graph`.
- Custom `NoteNode.jsx` with folder/note icons, favorite stars, and tag dots.
- Typed directional edges with animated dependencies.
- Floating `GraphToolbar.jsx` with filters and live counters.
- Slide-out node inspector drawer with quick "Open Note in Editor" navigation.

### Q07: Authentication & Data Isolation Architecture
- Prisma `User` model established in database schema.
- Workspace identity profile endpoints (`GET /api/v1/user/profile`, `PATCH /api/v1/user/profile`).
- Multi-user authentication (Neon Auth / JWT) ready for production deployment.

### Q08: Import & Export
- Markdown note export with YAML frontmatter (title, type, tags, linked connections) and browser download.
- JSON portable note backup export.
- Note import endpoint (`POST /api/v1/notes/import`) for Markdown and JSON.
- Recursive ProseMirror AST to Markdown converter utility (`proseMirrorToMarkdown`).
- Frontend "Export MD" button on editor header.

### Q09: Final Integration, Regression & Release Preparation
- Full regression pass across all 7 test suites (49/49 tests pass).
- Monorepo linting verified with 0 errors and 0 warnings.
- Frontend production bundle compiled cleanly with Vite.
- Prisma Client validated and generated.
- Documentation and changelog synchronized.
