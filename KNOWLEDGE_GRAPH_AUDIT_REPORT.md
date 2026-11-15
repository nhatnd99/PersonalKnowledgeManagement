# KNOWLEDGE GRAPH AUDIT & ARCHITECTURE REDESIGN REPORT (PHASE 1)

**Application**: Knowledge App (Personal Knowledge Management)  
**Date**: November 15, 2026  
**Auditor**: Senior Full Stack Developer & Software Architect  

---

## 1. Executive Summary

This audit investigates the root causes of why the Knowledge Graph feature was unreliable, showed `0 nodes, 0 edges`, threw `Folder with ID ... not found`, and failed to maintain proper synchronization between the folder hierarchy and knowledge relationships.

The investigation examined:
1. The PostgreSQL database schema and existing data records.
2. The folder and note domain models in Prisma ORM.
3. The relationship data models and constraints.
4. Backend graph routes, controllers, and services (`backend/src/modules/graph/`, `backend/src/modules/relationships/`).
5. Frontend graph routing, React Flow integration, state management, and toolbar components (`frontend/src/features/knowledge-graph/`).
6. All existing unit and integration tests.

---

## 2. Root Causes of Observed Problems

### 2.1 The "Folder with ID ... not found" & "0 nodes, 0 edges" Error
- **Stale URL / Ineffective Fallback**: In `KnowledgeGraphCanvas` (`KnowledgeGraphView.jsx`), `effectiveFolderId` extracts `folderId` from the route params (`/graph/folders/:folderId`). When a folder is deleted, moved, or accessed from a stale browser session, the backend correctly throws `AppError("Folder with ID ... not found", 404)`.
- **Fatal Error State Handling**: Instead of rendering a recovery UI (e.g., an error screen offering to return to "Root Workspace" or pick an existing folder), the component trapped the user on the broken URL, left `nodes` and `edges` empty (`[]`), and rendered a tiny floating error card with `0 nodes, 0 edges` in the toolbar.
- **Single-Fetch Folder List**: `foldersList` in `KnowledgeGraphView` was loaded only once on component mount. It never listened for or re-fetched when folders were added or deleted in the sidebar. This caused the folder switcher dropdown to offer stale, non-existent folder IDs that immediately crashed with 404 errors when clicked.

### 2.2 Root Workspace Interception & Display Inconsistency
- In `KnowledgeGraphView.jsx`, visiting `/graph` intercepted the request and rendered `FolderSelector` instead of the Root Workspace Graph.
- According to the core specification:
  > *When users open Knowledge Graph without selecting a specific folder, display the Root Workspace showing root-level folders, root-level notes, and explicit knowledge relationships between visible entities.*
- In the backend `graph.service.js`, hierarchy edges were completely disabled for the Root Workspace (`if (includeHierarchy && currentFolder)` explicitly skipped hierarchy edges when `currentFolder` was null).

### 2.3 Scope Over-Crawling (Descendants vs Immediate Children)
- The existing `getFolderGraphData` recursively fetched **all descendants at any depth** (`getAllDescendantEntities`) and placed them all into the folder graph.
- This violated the folder-centric model where:
  > *Each folder has its own independent Graph view displaying the folder as the central node, its directly contained notes, and its directly contained child folders. Clicking a child folder navigates into its own Graph.*
- Dumping all nested descendants flattened the hierarchy, created node collisions, and broke the intuitive Obsidian/Notion-style folder-by-folder exploration.

### 2.4 Lack of Relationship Management in Graph View
- There was no `PATCH /api/v1/relationships/:id` endpoint in the backend to update relationship types or labels.
- There was no `GET /api/v1/relationships/:entityType/:entityId` endpoint.
- Updating or deleting a relationship directly within the Graph required opening a separate connections drawer instead of seamless in-graph interaction.

### 2.5 Inconsistent Positioning & Layout Engine
- `layoutScopedNodes` placed the central folder at `(400, 300)` and all other nodes in a simple mathematical circle without collision detection or layout elasticity.
- When notes had long titles or folders had many children, nodes overlapped severely.

---

## 3. Data Model Audit & Database Migration Plan

### 3.1 Existing Data Model
In `backend/prisma/schema.prisma`:
- `Note`: Model represents both notes and folders via `type NoteType` (`NOTE` or `FOLDER`), with `parentId` managing the hierarchy self-relation (`onDelete: SetNull`).
- `NoteRelationship`: Stored directional relationships with `sourceNoteId`, `targetNoteId`, `relationshipType`, and `description`.
- `NoteRelationship` already holds foreign keys referencing `Note.id` (`onDelete: Cascade`), meaning relationships already connect any Note or Folder without data loss!

### 3.2 Migration Strategy: Non-Destructive Extension
To satisfy prompt requirements while strictly preserving all existing database records and tests:
1. **Extend `NoteRelationship`**:
   - Add `sourceType NoteType @default(NOTE) @map("source_type")`
   - Add `targetType NoteType @default(NOTE) @map("target_type")`
   - Add `label String? @db.VarChar(255)`
   - Add `updatedAt DateTime @default(now()) @updatedAt @map("updated_at")`
   - Maintain `sourceNoteId` and `targetNoteId` foreign keys to ensure relational integrity with cascade cleanup.
   - Map `description` to `label` seamlessly in services so both are supported.
2. **Execute Migration**:
   - Run `npx prisma db push` or migration script without dropping existing records.
   - Backfill existing `note_relationships` with `source_type` and `target_type` by querying source and target notes.

---

## 4. Architecture Redesign & Refactoring Plan

### Phase 2: Backend & Database Implementation
1. **Prisma Schema Update**:
   - Add `sourceType`, `targetType`, `label`, and `updatedAt` to `NoteRelationship`.
   - Validate and apply migration safely.
2. **Refactor `backend/src/modules/graph/graph.service.js`**:
   - **Root Workspace Graph (`/workspace` & `/root`)**: Returns root-level folders (`parentId: null`), root-level notes (`parentId: null`), explicit relationships between visible entities, and optional hierarchy edges.
   - **Folder Graph (`/folders/:folderId`)**: Scoped strictly to the selected folder (central node) and its **immediate children** (direct subfolders and notes with `parentId == folderId`).
   - Counts direct child notes and subfolders accurately.
   - Generates clean hierarchy edges (`isHierarchy: true`) and knowledge relationships (`isHierarchy: false`).
   - Ensures strict 404 handling if folder does not exist.
3. **Refactor `backend/src/modules/relationships/`**:
   - Add `PATCH /api/v1/relationships/:id` (update `relationshipType`, `label`, `description`).
   - Add `GET /api/v1/relationships/:entityType/:entityId` (or entity query support).
   - Support both `sourceNoteId`/`targetNoteId` and `sourceId`/`targetId`, `description` and `label`.
   - Update tests to ensure 100% test suite passing.

### Phase 3: Frontend Knowledge Graph Architecture Refactoring
Organize into clean, modular components inside `frontend/src/features/knowledge-graph/`:
1. **`KnowledgeGraphView.jsx`**: Page-level controller managing routes (`/graph`, `/graph/root`, `/graph/folders/:folderId`).
2. **`useGraphData.js`**: Custom hook managing graph fetching, scope data, request deduplication, and stale request cancellation.
3. **`GraphCanvas.jsx`**: Dedicated React Flow wrapper with custom nodes (`FolderNode`, `NoteNode`), custom edges, background, minimap, and controls.
4. **`GraphToolbar.jsx`**: Breadcrumbs, live folder selector dropdown, relationship filter, hierarchy toggle, connect action, fit view, and refresh.
5. **`GraphErrorState.jsx`**: User-friendly error screen when a folder is not found or fails to load, offering quick navigation back to Root Workspace.
6. **`GraphEmptyState.jsx`**: Context-aware empty state (empty workspace vs empty folder) with quick actions to create a note or subfolder.
7. **`GraphConnectModal.jsx`**: Dialog to create and connect relationships between visible notes/folders with type selection and optional label.
8. **`utils/graphLayout.js`**: Improved radial/orbit layout with collision prevention and central node emphasis.

### Phase 4 & 5: Integration & Verification
1. Verify all 6 end-to-end user scenarios from prompt.
2. Run backend test suite.
3. Run frontend lint and production build.
4. Generate final implementation report.
