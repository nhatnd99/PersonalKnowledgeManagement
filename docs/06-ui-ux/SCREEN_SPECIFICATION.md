# Screen Specification

> [!NOTE]
> These screens represent planned UI specifications for Phase 1 through Phase 5. In Phase 0 (Foundation), routes render minimal placeholder containers.

---

## 1. Main Workspace / Note Editor Screen

- **Route**: `/notes/:noteId` (or `/notes` default redirect)
- **Primary Purpose**: Capture, edit, and read knowledge notes in rich text.
- **Key Regions**:
  - **Left Sidebar**: Collapsible tree navigation with folder expansion, active note highlight, and "New Note" / "New Folder" buttons.
  - **Breadcrumb Header**: Shows the hierarchy path from root down to the currently active note (e.g., `Java Backend > Spring Boot > Spring Security`).
  - **Editor Workspace**: Full-width TipTap rich text surface supporting headings, task lists, code blocks, and formatted text.
  - **Auto-Save Status**: Subtle indicator displaying `Saving...` or `Saved` timestamp.
  - **Right Context Drawer**: Tabbed panel displaying:
    - **Outgoing Relationships**: Explicit connections created from this note to others.
    - **Backlinks (Incoming)**: Notes referencing this note.
    - **Tags & Metadata**: Tag badges and modification timestamps.

---

## 2. Knowledge Graph View

- **Route**: `/graph`
- **Primary Purpose**: Visual discovery of note connections across all branches of hierarchy.
- **Key Regions**:
  - **React Flow Canvas**: Interactive canvas supporting drag, zoom, and pan.
  - **Node Representation**: Custom nodes styled by type (`NOTE` vs `FOLDER`), labeled with note titles.
  - **Edge Representation**: Directional colored edges corresponding to relationship types (`RELATED_TO`, `DEPENDS_ON`, `REFERENCES`, `EXTENDS`, `CONTRADICTS`).
  - **Filter Controls**: Floating toolbar to toggle edge types, search nodes, or center the graph around a selected note.

---

## 3. Search & Discovery Screen

- **Route**: `/search`
- **Primary Purpose**: Search notes by title, full-text body content, and tags.
- **Key Regions**:
  - **Search Input Box**: Real-time debounce search input.
  - **Tag Filter Pills**: Clickable tag chips for multi-tag filtering.
  - **Result Cards**: List of matching notes with highlighted text snippets and breadcrumb paths.

---

## 4. Tags Management Screen

- **Route**: `/tags`
- **Primary Purpose**: Centralized tag taxonomy management.
- **Key Regions**:
  - **Tag Table / Grid**: List of all unique tags, assigned colors, usage counts, and quick rename/delete actions.
