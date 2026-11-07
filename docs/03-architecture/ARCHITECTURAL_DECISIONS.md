# Architectural Decisions

This document records significant architectural decisions, their context, and rationale.

---

## ADR-001: Monorepo with Independent Applications

**Decision**: Use a monorepo containing independent `frontend/` and `backend/` directories.

**Context**: The project is a full-stack application. Options were separate repositories, monorepo with workspaces, or a fully integrated framework (Next.js).

**Rationale**:
- Single repository simplifies project management
- Independent applications allow separate deployment
- npm workspaces enable shared scripts without coupling
- Avoids Next.js overhead when a pure SPA + API is sufficient

**Consequences**: Frontend and backend maintain independent `package.json` files and `node_modules`.

---

## ADR-002: Hierarchy via parentId (Adjacency List)

**Decision**: Store hierarchy using `parentId` field on each Note document (Adjacency List pattern).

**Context**: MongoDB supports several hierarchy patterns:
- Adjacency List (parentId)
- Materialized Path
- Nested Set
- Full document embedding

**Rationale**:
- Simple to implement and understand
- Moving notes is a single field update
- Works well for unlimited depth
- No performance issues for typical PKM usage (hundreds to low thousands of notes)
- Retrieving children of a node is a single indexed query

**Trade-offs**: Retrieving the full subtree requires multiple queries or aggregation. This is acceptable for MVP scope. Materialized Path can be added later if deep subtree queries become a bottleneck.

**Consequences**: Service layer must prevent circular references by traversing ancestors before accepting a move operation.

---

## ADR-003: Independent NoteRelationship Model

**Decision**: Store note relationships in a separate `NoteRelationship` collection, not as arrays inside Note documents.

**Context**: Relationships could be stored as arrays of ObjectIds inside Note documents.

**Rationale**:
- Relationships are queryable independently (find all relationships of type X)
- Prevents unbounded document growth for heavily-connected notes
- Backlinks are trivially queried by targeting `targetNoteId`
- Separation makes relationship management clean and atomic

**Consequences**: Retrieving a note with its relationships requires a separate query (acceptable trade-off).

---

## ADR-004: Directional Relationships

**Decision**: Relationships are directional. `sourceNoteId -> targetNoteId`.

**Context**: Relationships could be bidirectional (automatically creating the reverse) or directional.

**Rationale**:
- Semantic precision: "A DEPENDS_ON B" is meaningfully different from "B DEPENDS_ON A"
- Backlinks naturally emerge from querying `targetNoteId`
- Users can explicitly create bidirectional relationships when needed
- Matches the mental model of directed knowledge graphs

**Consequences**: UI must clearly communicate directionality. Backlinks panel shows incoming relationships.

---

## ADR-005: JavaScript Only (No TypeScript)

**Decision**: Use JavaScript (ES6+) throughout. No TypeScript.

**Rationale**: Team restriction. Complexity of TypeScript setup not justified for this project scope.

**Consequences**: Use JSDoc for documentation. ESLint for code quality. Disciplined naming conventions.

---

## ADR-006: TipTap for Rich Text Editing

**Decision**: Use TipTap as the rich text editor.

**Rationale**:
- React-first integration
- Built on ProseMirror (robust, well-tested)
- Highly extensible via extensions
- Headless (bring your own styles)
- Active maintenance

**Consequences**: Content stored as HTML. Future Markdown export requires a conversion step.

---

## ADR-007: React Flow for Knowledge Graph

**Decision**: Use React Flow (reactflow) for the knowledge graph visualization.

**Rationale**:
- Purpose-built for node/edge graph visualization
- React-native component model
- Built-in zoom, pan, selection
- Customizable node and edge renderers
- Active ecosystem

**Consequences**: Graph data must be transformed from API responses into React Flow's `nodes` and `edges` format.
