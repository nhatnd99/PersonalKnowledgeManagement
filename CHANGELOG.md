# Changelog

All notable changes to Knowledge App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Changed
- **Database Architecture Migration**: Migrated primary database from MongoDB + Mongoose to **PostgreSQL + Prisma ORM**.
- **Data Model**: Implemented relational schema in `backend/prisma/schema.prisma` using UUID primary keys, foreign key constraints (`ON DELETE CASCADE` for relationships, `ON DELETE SET NULL` for hierarchy), composite unique constraints, and PostgreSQL `JSONB` for TipTap ProseMirror content.
- **API Versioning**: Upgraded REST API structure to versioned `/api/v1` prefix across frontend and backend.
- **Error Handling**: Replaced Mongoose error handlers with Prisma error code handlers (`P2002`, `P2025`, `P2003`, `PrismaClientValidationError`).
- **Dependencies**: Removed `mongoose`; added `@prisma/client` and `prisma` CLI (v5.22.0).
- **Documentation**: Fully updated all 25 architecture, database, API, and development documents to reflect PostgreSQL, Prisma ORM, and Neon PostgreSQL cloud hosting.

## [0.2.0] - 2026-11-08

### Added
- **Core Note Engine (Q01 & Q02)**: Complete TipTap ProseMirror rich text editor with auto-save (1500ms debounce), title editing, favorite toggling, full CRUD REST API (`/api/v1/notes`).
- **Hierarchical Organization (Q03)**: Collapsible sidebar tree, HTML5 drag-and-drop reparenting, cycle prevention via upward ancestor traversal, breadcrumb trail, and context action menu.
- **Knowledge Relationships & Backlinks (Q04)**: Directional typed relationships (`RELATED_TO`, `DEPENDS_ON`, `REFERENCES`, `EXTENDS`, `CONTRADICTS`), self-referencing and duplicate prevention (409 Conflict), outgoing connection drawer, incoming backlinks panel, and Obsidian-style footer.
- **Search, Tags & Discovery (Q05)**: Full-text search endpoint (`/api/v1/search`), tag taxonomy manager (`/tags`), interactive note tag chips bar (`NoteTagsSelector.jsx`), live faceted discovery canvas (`/search`) with type and tag filter chips.
- **Knowledge Graph Visualization (Q06)**: Interactive React Flow graph canvas (`/graph`) with custom `NoteNode`, typed color-coded directional arrow edges, floating `GraphToolbar`, slide-out node inspector drawer, and toggleable hierarchy links.
- **Import & Export (Q08)**: Markdown export with YAML frontmatter, portable JSON backup export, note import endpoint, and frontend "Export MD" button.
- **Testing Suite**: 7 Jest ES modules test suites with 49 unit and integration tests passing.

---

## [0.1.0] - 2026-11-07

### Added
- Project initialization and monorepo workspaces (`frontend`, `backend`).
- AGENTS.md guidelines and comprehensive 25-file documentation suite.
- Feature-based frontend and domain-based backend structure.
- Clean build pipelines with ESLint, Jest, Vite, and Tailwind CSS.
