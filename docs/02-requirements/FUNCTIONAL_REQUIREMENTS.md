# Functional Requirements

## Status Legend
- ✅ Implemented
- 🔄 In Progress
- 📋 Planned
- 🔮 Future Consideration

---

## FR-01: Note Management

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01.1 | Create a new note with a title | Must Have | 📋 |
| FR-01.2 | Edit note content using a rich text editor | Must Have | 📋 |
| FR-01.3 | Delete a note | Must Have | 📋 |
| FR-01.4 | View a note with rendered content | Must Have | 📋 |
| FR-01.5 | Auto-save note content while editing | Must Have | 📋 |
| FR-01.6 | Create a folder to organize notes | Must Have | 📋 |
| FR-01.7 | Mark a note as favorite | Should Have | 📋 |
| FR-01.8 | Archive a note | Should Have | 📋 |
| FR-01.9 | View recently updated notes | Should Have | 📋 |

## FR-02: Hierarchical Organization

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-02.1 | Assign a note to a parent note or folder | Must Have | 📋 |
| FR-02.2 | View notes in a collapsible tree structure | Must Have | 📋 |
| FR-02.3 | Expand and collapse tree nodes | Must Have | 📋 |
| FR-02.4 | Move a note to a different parent | Must Have | 📋 |
| FR-02.5 | Reorder sibling notes by drag and drop | Should Have | 📋 |
| FR-02.6 | Display breadcrumb navigation for the current note | Must Have | 📋 |
| FR-02.7 | Create unlimited hierarchy depth | Must Have | 📋 |
| FR-02.8 | Prevent circular parent-child references | Must Have | 📋 |

## FR-03: Knowledge Connections (Relationships)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-03.1 | Create a typed relationship between two notes | Must Have | 📋 |
| FR-03.2 | Remove a relationship | Must Have | 📋 |
| FR-03.3 | View all outgoing relationships from a note | Must Have | 📋 |
| FR-03.4 | View all incoming relationships to a note (backlinks) | Must Have | 📋 |
| FR-03.5 | Support relationship types: RELATED_TO, DEPENDS_ON, REFERENCES, EXTENDS, CONTRADICTS | Must Have | 📋 |
| FR-03.6 | Add an optional description to a relationship | Should Have | 📋 |
| FR-03.7 | Prevent duplicate relationships | Must Have | 📋 |
| FR-03.8 | Prevent self-referential relationships | Must Have | 📋 |
| FR-03.9 | Clean up relationships when a note is deleted | Must Have | 📋 |

## FR-04: Tags

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-04.1 | Create tags | Must Have | 📋 |
| FR-04.2 | Assign tags to notes | Must Have | 📋 |
| FR-04.3 | Remove tags from notes | Must Have | 📋 |
| FR-04.4 | Filter notes by tag | Must Have | 📋 |
| FR-04.5 | Rename tags (applies to all notes with that tag) | Should Have | 📋 |
| FR-04.6 | Delete tags (removes from all notes) | Should Have | 📋 |
| FR-04.7 | Assign colors to tags | Nice to Have | 📋 |

## FR-05: Search

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-05.1 | Search notes by title | Must Have | 📋 |
| FR-05.2 | Search notes by content | Must Have | 📋 |
| FR-05.3 | Filter search results by tag | Should Have | 📋 |
| FR-05.4 | Display search results with matching context | Should Have | 📋 |

## FR-06: Knowledge Graph

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-06.1 | Display notes as graph nodes | Must Have | 📋 |
| FR-06.2 | Display relationships as directed graph edges | Must Have | 📋 |
| FR-06.3 | Open a note by clicking its node | Must Have | 📋 |
| FR-06.4 | Zoom and pan the graph canvas | Must Have | 📋 |
| FR-06.5 | Filter graph by relationship type | Should Have | 📋 |
| FR-06.6 | Show local graph around a selected note | Should Have | 📋 |
| FR-06.7 | Visually distinguish relationship types by edge color/style | Should Have | 📋 |
