# Feature Specification

## Feature: Note Editor

### Overview
The note editor is the primary workspace. Users create and edit notes using the TipTap rich text editor.

### Supported Content
- Headings (H1-H3)
- Paragraphs
- Bold, Italic, Underline, Strikethrough
- Ordered and unordered lists
- Task lists (checkboxes)
- Code blocks (inline and block)
- Links
- Horizontal rules

### Auto-Save Behavior
- Triggered 1,500ms after the user stops typing
- Shows save status: Idle -> Saving -> Saved / Error
- Does not interrupt the editing experience
- Saves both title and content

### Content Storage
- Content stored as HTML string in the database
- `contentFormat` field records the format (`html`)

---

## Feature: Hierarchy Tree

### Overview
The sidebar displays notes in a collapsible tree structure representing parent-child relationships.

### Tree Rules
- Root level: notes with `parentId = null`
- Children: notes with `parentId = <parentNoteId>`
- Unlimited depth
- Folders and notes can both have children
- Siblings sorted by `sortOrder` field

### Interaction
- Click to expand/collapse a node
- Click to open a note
- Drag and drop to move notes (Phase 2)
- Context menu: New child, Move, Delete, Rename

---

## Feature: Relationships

### Overview
Users can create explicit, typed, directional relationships between any two notes regardless of their position in the hierarchy.

### Relationship Types
| Type | Meaning | Example |
|------|---------|---------|
| RELATED_TO | General connection | "Spring Boot" RELATED_TO "Java" |
| DEPENDS_ON | Dependency | "Spring Security" DEPENDS_ON "Spring Core" |
| REFERENCES | Cites or links to | "JWT Auth" REFERENCES "RFC 7519" |
| EXTENDS | Builds upon | "Spring Boot" EXTENDS "Spring Framework" |
| CONTRADICTS | Conflicts with | "CAP Theorem" CONTRADICTS "ACID Properties" |

### Directionality
Relationships are **directional**: A -> B is different from B -> A.
Backlinks show all notes pointing TO the current note.

---

## Feature: Knowledge Graph

### Overview
A visual graph canvas (React Flow) showing notes as nodes and relationships as edges.

### Graph Modes
1. **Full graph**: All notes and relationships
2. **Local graph**: Notes and relationships within N hops of the selected note

### Node Types
- Regular notes
- Folder notes (distinct visual style)

### Edge Types
Each relationship type has a distinct visual style (color, dash pattern).
