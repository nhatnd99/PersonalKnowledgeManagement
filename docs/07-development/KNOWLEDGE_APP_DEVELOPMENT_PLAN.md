# Knowledge App --- End-to-End Development Plan

> **Document type:** Product and Engineering Roadmap\
> **Status:** Phase 0 reported complete; implementation phases not yet
> verified\
> Stack: React + Vite + JavaScript, Tailwind CSS, shadcn/ui/Radix UI, React Router, Axios, TipTap, React Flow, Node.js, Express.js, PostgreSQL, Prisma ORM\
> **Architecture:** Modular monolith, REST API, monorepo\
> **Constraints:** JavaScript only; no TypeScript, Java/Spring Boot,
> Docker, or microservices

------------------------------------------------------------------------

## 1. Product Goal

Build a personal knowledge-management web application centered on
creating, organizing, connecting, and rediscovering notes.

The system has two independent ways to organize knowledge:

1.  **Hierarchy (Tree):** A note or folder can have a parent and
    multiple children. The hierarchy is represented through `parentId`.
2.  **Knowledge relationships (Graph):** A note can be connected to
    multiple other notes independently of its position in the hierarchy.
    These connections are represented by `NoteRelationship` records.

Moving a note in the hierarchy must not delete or alter its knowledge
relationships.

The application should remain a note-taking and knowledge-organization
product. Task management, project management, collaboration, and
advanced AI features are not part of the initial MVP unless separately
approved.

## 2. Product Principles

-   Notes are the central entity and the primary user workflow.
-   A note's content, hierarchy position, and graph relationships are
    separate concerns.
-   Organizing or moving notes must preserve note content and graph
    relationships.
-   Users should be able to create a note quickly and organize it later.
-   The interface should make the hierarchy and note relationships
    understandable without forcing users to use the graph view.
-   Backend business rules must be enforced by services, not only by
    frontend controls.
-   Every implementation phase must have testable acceptance criteria.
-   Documentation must be updated when implementation decisions or
    contracts change.
-   Planned, implemented, and verified features must be clearly
    distinguished.

## 3. Scope

### 3.1 MVP scope

-   Create, view, edit, and delete notes.
-   Rich-text note editor.
-   Automatic saving with clear save status.
-   Hierarchical organization using folders/notes and parent-child
    relationships.
-   Move and reorder notes.
-   Direct links between notes.
-   Incoming and outgoing relationships / backlinks.
-   Tags and favorites.
-   Search notes.
-   Basic knowledge graph visualization.
-   Responsive application layout.
-   Error, loading, empty, and success states.
-   Automated tests for core business rules.

### 3.2 Not included in the initial MVP

Unless a later decision explicitly adds them:

-   Authentication and account management.
-   Multi-user collaboration and permissions.
-   Real-time collaborative editing.
-   AI-generated notes or semantic search.
-   File storage and complex attachment management.
-   Native mobile applications.
-   Offline-first synchronization.
-   Task/project management.
-   Microservices and distributed infrastructure.

The `User` model may be retained as preparation for future
authentication, but it must not imply that authentication is
implemented.

------------------------------------------------------------------------

## 4. Overall Development Phases

  -----------------------------------------------------------------------
  Phase             Name              Main outcome      Status
  ----------------- ----------------- ----------------- -----------------
  0                 Project           Monorepo, initial Reported
                    foundation and    app structure,    complete; verify
                    documentation     configuration,    
                                      architecture docs 

  1                 Core note backend Stable Note model Not started / not
                                      and CRUD REST API verified

  2                 Core frontend and User can create   Not started
                    note editor       and edit notes    
                                      through the UI    

  3                 Hierarchical note Tree navigation,  Not started
                    organization      folders, move and 
                                      reorder           

  4                 Note              Connect notes and Not started
                    relationships and navigate between  
                    backlinks         related notes     

  5                 Tags, favorites,  Find and filter   Not started
                    and search        knowledge         
                                      efficiently       

  6                 Knowledge graph   Explore note      Not started
                    visualization     relationships     
                                      visually          

  7                 UX completion and Responsive        Not started
                    hardening         behavior,         
                                      accessibility,    
                                      performance,      
                                      security, test    
                                      coverage          

  8                 Deployment and    Deploy MVP and    Not started
                    release           document          
                                      operations        

  9                 Post-MVP          Authentication,   Future
                    improvements      sync,             
                                      import/export,    
                                      advanced          
                                      capabilities      
  -----------------------------------------------------------------------

A phase is not complete merely because files have been created. It is
complete only when its acceptance criteria and verification steps pass.

------------------------------------------------------------------------

# 5. Detailed Implementation Plan

## Phase 0 --- Project Foundation and Documentation

**Goal:** Establish a maintainable project structure and agree on
technical and product decisions before implementing business features.

### Steps

-   [x] Create the monorepo structure with separate `frontend/` and
    `backend/` applications.
-   [x] Create the initial feature-based frontend structure.
-   [x] Create the domain-based backend module structure.
-   [x] Create the initial documentation suite.
-   [x] Create root `AGENTS.md` with coding and agent-work instructions.
-   [x] Add root and application package manifests.
-   [x] Add `.env.example` files and `.gitignore`.
-   [x] Record architecture decisions and database/API plans.
-   [x] Verify the actual directory tree against the documentation. (Verified: all 63 expected files present)
-   [x] Verify all package manifests and scripts. (Verified: root, frontend, backend valid JSON)
-   [x] Install dependencies and verify the frontend build. (Verified: 790 packages installed, vite build succeeded in 2.36s)
-   [x] Verify the health endpoint. (Verified: GET /health returned 200 OK via createApp test harness)
-   [x] Verify Tailwind CSS setup. (Verified: CSS generated in dist bundle)
-   [x] Verify that no secrets or local environment files are committed. (Verified: only .env.example files present)
-   [x] Verify PostgreSQL Prisma schema & client generation. (Verified: schema valid, @prisma/client generated in 93ms)
-   [ ] Live PostgreSQL connection verification (Pending: requires active PostgreSQL local instance or Neon URI in backend/.env)

### Deliverables

-   Working monorepo foundation.
-   Frontend and backend start scripts.
-   Architecture and product documentation.
-   Environment setup instructions.
-   Verified development setup.

### Acceptance criteria

-   Frontend starts successfully in development mode.
-   Backend starts successfully in development mode.
-   Backend health endpoint returns the documented response.
-   No TypeScript, Java/Spring Boot, or Docker artifacts are introduced.
-   Environment variables are documented and secrets are excluded from
    Git.
-   Documentation reflects the actual project state.

**Note:** The Phase 0 completion report states that the structure, docs,
entry points, and initial models were created. The unchecked
verification items above remain to be confirmed in the actual workspace.

------------------------------------------------------------------------

## Phase 1 --- Core Note Backend

**Goal:** Deliver a stable backend API for creating, reading, updating,
and deleting notes.

### 1.1 Inspect existing implementation

-   [ ] Read `AGENTS.md` and relevant architecture, database, API, and
    testing docs.
-   [ ] Inspect the existing Note model and backend configuration.
-   [ ] Identify reusable middleware, response helpers, and validation
    utilities.
-   [ ] Compare existing code with the documented schema and API
    contract.
-   [ ] Record discrepancies before changing code.

### 1.2 Finalize Note data model

Expected fields, subject to the approved database specification:

-   `_id`
-   `title`
-   `content`
-   `contentFormat`
-   `type`
-   `parentId`
-   `tags`
-   `sortOrder`
-   `isFavorite`
-   `isArchived`
-   `createdAt`
-   `updatedAt`

Tasks:

-   [ ] Confirm the meaning and allowed values of `type`.
-   [ ] Confirm whether folders can contain notes, folders, or both.
-   [ ] Confirm title and content validation rules.
-   [ ] Confirm the policy for empty titles and empty content.
-   [ ] Confirm indexes and timestamps.
-   [ ] Confirm whether `tags` stores references or embedded values.
-   [ ] Keep hierarchy represented through `parentId`; do not embed an
    entire tree in a document.

### 1.3 Implement Note backend module

Expected module responsibilities:

-   `prisma/schema.prisma`: Prisma schema, relations, constraints, indexes.
-   `note.validation.js`: Request payload and parameter validation.
-   `note.service.js`: Business rules and database operations.
-   `note.controller.js`: HTTP request/response handling.
-   `note.routes.js`: REST endpoint definitions (/api/v1/notes).

Tasks:

-   [ ] Implement create note.
-   [ ] Implement get note by ID.
-   [ ] Implement paginated note listing.
-   [ ] Implement update note.
-   [ ] Implement delete note.
-   [ ] Implement filtering only where specified by the API contract.
-   [ ] Validate ObjectId values.
-   [ ] Reject updates to immutable fields.
-   [ ] Return consistent errors for invalid input and missing records.
-   [ ] Wire routes into the Express app.
-   [ ] Ensure async errors reach the existing error handler.

### 1.4 Define deletion behavior

Before implementing deletion, explicitly decide:

-   What happens if the note has child notes?
-   What happens to relationships where the note is the source?
-   What happens to relationships where the note is the target?
-   What happens to tag associations?
-   Is deletion permanent or soft deletion?

Do not implement cascading deletion based on an assumption. Record the
chosen policy in the database and API documentation.

### 1.5 Tests

-   [ ] Create note successfully.
-   [ ] Reject invalid create payload.
-   [ ] Get existing note.
-   [ ] Return 404 for missing note.
-   [ ] List notes with pagination.
-   [ ] Update existing note.
-   [ ] Reject invalid update payload.
-   [ ] Reject invalid ID.
-   [ ] Delete note according to the approved deletion policy.
-   [ ] Validate parent reference behavior.
-   [ ] Test error response format.

### Deliverables

-   Complete Note CRUD API.
-   Validated Prisma Note model in schema.prisma.
-   Unit and integration tests.
-   Updated API/database documentation.

### Acceptance criteria

-   All defined endpoints behave according to the API specification.
-   Business logic resides in the service layer.
-   Invalid data is rejected consistently.
-   Tests pass against a test database.
-   Deletion behavior is explicit and tested.
-   No unrelated modules are implemented in this phase.

------------------------------------------------------------------------

## Phase 2 --- Frontend Foundation and Note Editor

**Goal:** Allow a user to open, create, and edit a note through the
frontend.

### 2.1 Application shell

-   [ ] Build the main application layout.
-   [ ] Build the navigation/sidebar shell.
-   [ ] Define the main content area.
-   [ ] Add responsive layout behavior.
-   [ ] Add application-level loading and error handling.
-   [ ] Confirm route handling and not-found behavior.

### 2.2 API integration

-   [ ] Verify the shared Axios client.
-   [ ] Configure API base URL through environment variables.
-   [ ] Configure request/response handling.
-   [ ] Normalize API errors.
-   [ ] Add Note API service functions.
-   [ ] Avoid embedding API calls directly in presentation components.

### 2.3 TipTap editor

-   [ ] Build a reusable NoteEditor component.
-   [ ] Define the supported editor extensions.
-   [ ] Define the persisted content format, preferably a documented
    structured JSON format.
-   [ ] Support basic formatting: headings, paragraphs, bold, italic,
    lists, links, and code where required.
-   [ ] Load existing note content into the editor.
-   [ ] Convert editor changes into the agreed API payload.
-   [ ] Handle empty/new notes.
-   [ ] Prevent accidental loss of unsaved changes.

### 2.4 Auto-save

-   [ ] Define when auto-save is triggered.
-   [ ] Debounce editor changes.
-   [ ] Prevent overlapping or stale save requests.
-   [ ] Handle failed saves and retry behavior.
-   [ ] Display `Saving`, `Saved`, and `Error` states.
-   [ ] Avoid creating duplicate notes during initial save.
-   [ ] Ensure navigation does not silently discard unsaved changes.

### 2.5 Note screens

-   [ ] Build the note editing screen.
-   [ ] Build the empty state when no note is selected.
-   [ ] Build the loading state.
-   [ ] Build the not-found state.
-   [ ] Build the save-error state.

### Deliverables

-   Working application shell.
-   Note editor using TipTap.
-   Frontend Note API integration.
-   Reliable save-status feedback.

### Acceptance criteria

-   A user can create a note from the UI.
-   A user can edit and reopen a note without losing persisted content.
-   Auto-save does not create duplicate notes.
-   Save failures are visible and recoverable.
-   The UI does not report `Saved` before the server confirms success.

------------------------------------------------------------------------

## Phase 3 --- Hierarchical Note Organization

**Goal:** Organize notes into an expandable and maintainable tree.

### 3.1 Confirm hierarchy rules

-   [ ] Define the difference between `NOTE` and `FOLDER`.
-   [ ] Define which item types may contain children.
-   [ ] Define root-level behavior.
-   [ ] Define whether a folder can contain an editable body.
-   [ ] Define deletion and movement behavior for non-empty folders.
-   [ ] Define sibling ordering behavior.

### 3.2 Backend hierarchy operations

-   [ ] Retrieve root-level items.
-   [ ] Retrieve children of a parent.
-   [ ] Retrieve a tree or tree branches efficiently.
-   [ ] Move an item to a new parent.
-   [ ] Reorder siblings.
-   [ ] Validate that the new parent exists.
-   [ ] Reject self-parenting.
-   [ ] Reject moving an item into its own descendant.
-   [ ] Handle missing and invalid parent references.
-   [ ] Ensure moves do not modify NoteRelationship records.

### 3.3 Frontend tree navigation

-   [ ] Build the recursive tree component.
-   [ ] Support expand/collapse.
-   [ ] Highlight the selected note.
-   [ ] Support create note/folder from the tree.
-   [ ] Support rename where required.
-   [ ] Add breadcrumb navigation.
-   [ ] Add drag-and-drop only after basic tree operations are stable.
-   [ ] Provide keyboard-accessible alternatives to drag-and-drop.

### 3.4 Verification

-   [ ] Test moving a root note into a folder.
-   [ ] Test moving a child to the root.
-   [ ] Test reordering siblings.
-   [ ] Test rejection of circular hierarchy.
-   [ ] Test moving a note with existing graph relationships.
-   [ ] Verify all content and relationships remain intact after moving.

### Deliverables

-   Hierarchy API.
-   Tree navigation UI.
-   Move and reorder functionality.

### Acceptance criteria

-   Users can navigate nested notes.
-   Parent-child structure persists after refresh.
-   Circular hierarchy is rejected by the backend.
-   Moving a note does not change its content or graph relationships.
-   Tree behavior remains correct for empty and deeply nested branches.

------------------------------------------------------------------------

## Phase 4 --- Note Relationships and Backlinks

**Goal:** Allow users to connect notes independently of their hierarchy.

### 4.1 Finalize relationship semantics

The proposed relationship record contains:

-   `_id`
-   `sourceNoteId`
-   `targetNoteId`
-   `relationshipType`
-   `description`
-   `createdAt`

Tasks:

-   [ ] Confirm supported relationship types.
-   [ ] Confirm whether all relationships are directional.
-   [ ] Define how reciprocal relationships should be represented, if
    needed.
-   [ ] Define duplicate prevention.
-   [ ] Define self-relationship prevention.
-   [ ] Define deletion behavior when either related note is deleted.

Possible relationship types from the initial design:

-   `RELATED_TO`
-   `DEPENDS_ON`
-   `REFERENCES`
-   `EXTENDS`
-   `CONTRADICTS`

Do not add relationship types without updating the documentation and
validation rules.

### 4.2 Backend relationship API

-   [ ] Create a relationship between two notes.
-   [ ] List outgoing relationships for a note.
-   [ ] List incoming relationships for a note.
-   [ ] Update relationship type or description.
-   [ ] Delete a relationship.
-   [ ] Validate both referenced notes.
-   [ ] Reject self-links.
-   [ ] Prevent duplicate relationships according to the chosen
    direction policy.
-   [ ] Add appropriate indexes.
-   [ ] Add unit and integration tests.

### 4.3 Backlinks

-   [ ] Implement incoming relationship lookup.
-   [ ] Return source notes that point to the current note.
-   [ ] Keep backlinks separate from parent-child navigation.
-   [ ] Define whether backlinks show all relationship types or only
    selected types.

### 4.4 Frontend relationship experience

-   [ ] Add a related-notes section to the note view.
-   [ ] Add a way to search/select another note to connect.
-   [ ] Display relationship type and optional description.
-   [ ] Allow navigation to a connected note.
-   [ ] Display backlinks/incoming references.
-   [ ] Allow editing and removing a relationship.
-   [ ] Handle deleted or unavailable related notes gracefully.

### Acceptance criteria

-   One note can connect to multiple notes.
-   A note can have both incoming and outgoing relationships.
-   Relationship data is independent of hierarchy.
-   Moving a note preserves all its relationships.
-   Duplicate and self-relationships follow documented rules.
-   Backlinks return the correct incoming references.

------------------------------------------------------------------------

## Phase 5 --- Tags, Favorites, and Search

**Goal:** Provide additional ways to classify and retrieve notes.

### 5.1 Tags

-   [ ] Finalize Tag schema and note-tag association strategy.
-   [ ] Create tags.
-   [ ] Rename tags.
-   [ ] Change tag color if supported.
-   [ ] Delete tags with a documented association policy.
-   [ ] Assign tags to notes.
-   [ ] Remove tags from notes.
-   [ ] List notes by tag.
-   [ ] Prevent duplicate tag names according to the intended scope.

### 5.2 Favorites and archive

-   [ ] Add/remove favorite.
-   [ ] List favorite notes.
-   [ ] Archive/unarchive notes.
-   [ ] Define whether archived notes appear in search and graph views.
-   [ ] Ensure archive behavior does not unexpectedly delete data.

### 5.3 Search

-   [ ] Define searchable fields: title, content, and tags as approved.
-   [ ] Choose and document PostgreSQL search/index strategy.
-   [ ] Implement search API.
-   [ ] Add pagination and sorting.
-   [ ] Define case sensitivity and matching behavior.
-   [ ] Add frontend search input.
-   [ ] Display loading, no-result, and error states.
-   [ ] Add filters for tags, favorites, and archive status if in scope.

### Acceptance criteria

-   Users can assign and remove tags.
-   Favorites and archive states persist.
-   Search returns relevant notes according to documented rules.
-   Search results can be opened directly.
-   Search is tested with empty queries, special characters, and
    pagination.

------------------------------------------------------------------------

## Phase 6 --- Knowledge Graph Visualization

**Goal:** Provide a visual way to explore relationships between notes.

### 6.1 Graph data API

-   [ ] Define graph response shape.
-   [ ] Retrieve nodes and edges for a selected scope.
-   [ ] Support a focused graph around one note.
-   [ ] Define limits to prevent loading an excessively large graph.
-   [ ] Apply filters for relationship types.
-   [ ] Define how archived notes are handled.
-   [ ] Ensure graph data uses relationship records, not the hierarchy
    as a substitute.

### 6.2 React Flow implementation

-   [ ] Create graph page/route.
-   [ ] Map notes to graph nodes.
-   [ ] Map NoteRelationship records to edges.
-   [ ] Create custom note node.
-   [ ] Display relationship type where useful.
-   [ ] Support pan and zoom.
-   [ ] Support fit-to-view.
-   [ ] Support selecting a node.
-   [ ] Open the selected note from the graph.
-   [ ] Add relationship-type filters.
-   [ ] Add empty, loading, and error states.

### 6.3 Graph behavior

-   [ ] Decide whether edges are directional in the visualization.
-   [ ] Decide whether node positions are saved.
-   [ ] If positions are saved, define whether they are user-specific or
    global.
-   [ ] Avoid automatically changing the note hierarchy when graph nodes
    are moved visually.
-   [ ] Ensure graph interactions do not mutate note data accidentally.

### Acceptance criteria

-   Graph nodes represent notes.
-   Graph edges represent NoteRelationship records.
-   Selecting a node can open its note.
-   Pan, zoom, and filtering work.
-   Graph view does not alter hierarchy or note content.
-   Large graph requests are bounded and handled safely.

------------------------------------------------------------------------

## Phase 7 --- UX Completion, Quality, and Hardening

**Goal:** Make the MVP reliable, understandable, accessible, and
maintainable.

### 7.1 UX completeness

-   [ ] Consistent loading states.
-   [ ] Consistent empty states.
-   [ ] Consistent error messages.
-   [ ] Confirmation for destructive actions.
-   [ ] Success feedback for important actions.
-   [ ] Responsive desktop/tablet/mobile layouts.
-   [ ] Keyboard navigation for key workflows.
-   [ ] Accessible labels and focus states.
-   [ ] Light/dark theme if included in the approved UI scope.

### 7.2 Frontend quality

-   [ ] Review component boundaries.
-   [ ] Remove duplicated API logic.
-   [ ] Review state ownership and data synchronization.
-   [ ] Prevent unnecessary rendering in tree and graph views.
-   [ ] Verify editor behavior for long documents.
-   [ ] Verify route transitions and unsaved-change handling.

### 7.3 Backend quality and security

-   [ ] Validate all external input.
-   [ ] Review CORS configuration.
-   [ ] Review Helmet configuration.
-   [ ] Review rate limiting.
-   [ ] Ensure secrets are not logged.
-   [ ] Avoid exposing internal stack traces in production.
-   [ ] Review database indexes and query patterns.
-   [ ] Review pagination limits.
-   [ ] Review error handling for database outages.
-   [ ] Confirm that future authentication boundaries are documented.

### 7.4 Testing

-   [ ] Unit tests for services and utilities.
-   [ ] API integration tests.
-   [ ] Frontend component tests for critical flows.
-   [ ] End-to-end tests for core user journeys.
-   [ ] Regression tests for hierarchy and relationships.
-   [ ] Manual browser verification at target viewport sizes.

### Core end-to-end journeys

1.  Create a note, enter content, refresh, and verify content persists.
2.  Create a folder and move a note into it.
3.  Move a note between folders and verify relationships remain
    unchanged.
4.  Connect two notes and navigate in both directions.
5.  Open a note and view its backlinks.
6.  Assign a tag and find the note through that tag.
7.  Search for a note and open the result.
8.  Open the graph and navigate to a note from a graph node.
9.  Delete a note and verify the documented deletion policy.

### Acceptance criteria

-   Critical user journeys pass.
-   No known data-loss issue remains in note editing or moving.
-   Errors are handled consistently.
-   Core backend and frontend tests pass.
-   Security-sensitive configuration is reviewed before deployment.

------------------------------------------------------------------------

## Phase 8 --- Deployment and MVP Release

**Goal:** Publish a usable MVP and provide repeatable deployment
instructions.

### 8.1 Environment preparation

-   [ ] Define development, test, and production environment variables.
-   [ ] Prepare a production PostgreSQL database on Neon.
-   [ ] Restrict database network access appropriately.
-   [ ] Configure production CORS origins.
-   [ ] Configure frontend API base URL.
-   [ ] Ensure secrets are stored in deployment environment settings.

### 8.2 Deployment

-   [ ] Build the frontend for production.
-   [ ] Deploy the frontend to a static hosting provider.
-   [ ] Deploy the Express backend to a Node.js-compatible hosting
    provider.
-   [ ] Configure the production database connection.
-   [ ] Configure health checks.
-   [ ] Verify HTTPS.
-   [ ] Verify API connectivity from the deployed frontend.
-   [ ] Verify logs and error reporting.
-   [ ] Document rollback/redeployment steps.

### 8.3 Release checklist

-   [ ] Production build succeeds.
-   [ ] Production API health check succeeds.
-   [ ] Database connection succeeds.
-   [ ] Core end-to-end journeys pass in production.
-   [ ] No development secrets are exposed.
-   [ ] README and deployment guide are current.
-   [ ] Known limitations are documented.

### Acceptance criteria

-   MVP is accessible through its production URL.
-   Core note workflows work in production.
-   Deployment steps can be repeated from documentation.
-   Operational limitations and backup expectations are documented.

------------------------------------------------------------------------

## Phase 9 --- Post-MVP Improvements

These features should be prioritized only after the MVP is stable.

Potential improvements:

-   Authentication and account management.
-   User-scoped notes and relationships.
-   Cloud synchronization across devices.
-   Import/export (Markdown, JSON, and other formats).
-   Note templates.
-   Version history and restore.
-   Attachments and file management.
-   Advanced graph layouts and graph exploration.
-   Full-text search improvements.
-   Offline support.
-   PWA installation.
-   AI-assisted summarization, tagging, and semantic search.
-   Data backup and recovery tooling.

Each feature requires its own specification, architecture review, tests,
and acceptance criteria before implementation.

------------------------------------------------------------------------

# 6. Cross-Phase Technical Rules

These rules apply throughout the project.

## 6.1 Architecture

-   Keep the backend as a modular monolith.
-   Keep frontend code organized by feature.
-   Keep controllers thin and business logic in services.
-   Keep API calls in service modules rather than UI components.
-   Avoid circular imports and unnecessary shared abstractions.
-   Do not introduce microservices.

## 6.2 Data integrity

-   `parentId` defines hierarchy only.
-   `NoteRelationship` defines knowledge connections only.
-   Never infer graph relationships from parent-child structure.
-   Moving a note must not rewrite graph relationships.
-   Validate references on the backend.
-   Define delete behavior before implementing cascades.
-   Use database indexes that match actual query patterns.

## 6.3 API conventions

-   Use the documented `/api/v1` prefix.
-   Use consistent HTTP methods and status codes.
-   Use one response/error format.
-   Validate path parameters, query parameters, and request bodies.
-   Document pagination and sorting.
-   Do not expose raw database errors to clients.

## 6.4 Frontend conventions

-   Use JavaScript ES6+ and JSX.
-   Use reusable components where they represent stable UI patterns.
-   Keep feature-specific components inside their feature folders.
-   Keep shared layout and generic UI components separate.
-   Show saving state and server-confirmed persistence accurately.
-   Handle loading, empty, error, and success states.

## 6.5 Documentation

Update documentation whenever a change affects:

-   Product requirements.
-   Database schema or indexes.
-   API endpoints or payloads.
-   Architecture boundaries.
-   Environment variables.
-   Test strategy.
-   Deployment procedure.

Do not mark a feature as implemented merely because a placeholder or UI
mock exists.

------------------------------------------------------------------------

# 7. Definition of Done

A task or phase can be marked complete only when all applicable
conditions are satisfied:

-   [ ] Requirements and scope are clear.
-   [ ] Existing implementation was inspected before changes.
-   [ ] Implementation follows the approved architecture.
-   [ ] Validation and error handling are implemented.
-   [ ] Relevant tests have been written.
-   [ ] Tests have actually been executed.
-   [ ] Manual verification has been performed where appropriate.
-   [ ] Documentation has been updated.
-   [ ] No unrelated changes were introduced.
-   [ ] Limitations and unresolved decisions are reported.
-   [ ] The final report distinguishes completed, tested, and unverified
    work.

## Status vocabulary

Use these labels consistently:

-   **Planned:** Specified but not implemented.
-   **In Progress:** Implementation has started.
-   **Implemented:** Code exists but may not yet be fully verified.
-   **Verified:** Relevant tests or manual checks passed.
-   **Blocked:** Cannot proceed because a decision or dependency is
    missing.
-   **Deferred:** Intentionally moved to a later phase.

------------------------------------------------------------------------

# 8. Recommended Execution Order

Do not ask the coding agent to implement every phase in one prompt.
Execute one phase or sub-phase at a time.

Recommended sequence:

1.  Verify Phase 0 and resolve any foundation issues.
2.  Complete Phase 1 backend Note API.
3.  Verify the backend API and tests.
4.  Complete Phase 2 frontend shell and editor.
5.  Verify create/edit/auto-save end to end.
6.  Complete Phase 3 hierarchy.
7.  Verify move/reorder and circular-reference protection.
8.  Complete Phase 4 relationships and backlinks.
9.  Verify hierarchy and graph independence.
10. Complete Phase 5 tags, favorites, and search.
11. Complete Phase 6 graph visualization.
12. Complete Phase 7 quality and regression testing.
13. Complete Phase 8 deployment and MVP release.
14. Reassess priorities for Phase 9.

At the start of every phase, the coding agent must read `AGENTS.md` and
the relevant documentation. At the end of every phase, it must update
this plan and report evidence of verification.

------------------------------------------------------------------------

# 9. Current Project Status

Based on the Phase 0 completion report:

  -----------------------------------------------------------------------
  Area                    Reported state          Verification
  ----------------------- ----------------------- -----------------------
  Monorepo structure      Created                 Pending workspace
                                                  inspection

  Frontend structure      Created                 Pending runtime
                                                  verification

  Backend structure       Created                 Pending runtime
                                                  verification

  Prisma schema & models  Created & Validated     Generated via
                                                  Prisma Client

  Express entry points    Created                 Pending runtime
  and middleware                                  verification

  Axios client and        Created                 Pending API integration
  initial frontend                                test
  service                                         

  Documentation suite     Created                 Pending consistency
                                                  review

  Note CRUD API           Not confirmed as        Not verified
                          implemented             

  TipTap editor workflow  Not confirmed as        Not verified
                          implemented             

  Hierarchy operations    Reserved/planned        Not implemented

  Note relationships      Model reported; full    Not verified
  API/UI                  feature not confirmed   

  Tags/search/graph       Planned                 Not implemented

  Deployment              Planned                 Not implemented
  -----------------------------------------------------------------------

**Immediate next task:** Verify the Phase 0 workspace, then implement
**Phase 1 --- Core Note Backend**. Do not skip verification or assume
that a file's existence means its functionality is complete.
