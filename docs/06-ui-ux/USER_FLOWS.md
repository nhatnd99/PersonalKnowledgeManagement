# User Flows

## Flow 1: Note Creation and Rich Text Editing

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant UI as NoteEditor UI
  participant Debounce as Auto-Save Debouncer
  participant API as Express API
  participant DB as MongoDB

  User->>UI: Types note title & content
  UI->>Debounce: Queue change (1500ms debounce)
  Debounce->>API: PATCH /api/notes/:noteId
  API->>DB: Update Note document
  DB-->>API: Note saved
  API-->>UI: 200 OK (updated note)
  UI->>User: Displays "Saved" indicator
```

---

## Flow 2: Moving a Note in Hierarchy (Preventing Cycles)

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant UI as Tree Sidebar
  participant Service as Note Service
  participant DB as MongoDB

  User->>UI: Drags Note A into Folder B
  UI->>Service: PATCH /api/notes/:noteAId/move { newParentId: folderBId }
  Service->>DB: Check ancestors of Folder B
  alt Folder B is descendant of Note A
    Service-->>UI: 400 Bad Request (Circular reference prohibited)
    UI->>User: Reverts drag-and-drop & displays error
  else Valid parent move
    Service->>DB: Update Note A parentId to Folder B
    DB-->>Service: Saved
    Service-->>UI: 200 OK
    UI->>User: Tree updates smoothly (relationships preserved)
  end
```

---

## Flow 3: Creating a Knowledge Graph Relationship

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant UI as Relationships Drawer
  participant API as Express API
  participant DB as MongoDB

  User->>UI: Selects "Add Connection" -> targets Note B -> selects "DEPENDS_ON"
  UI->>API: POST /api/relationships { sourceNoteId: NoteA, targetNoteId: NoteB, relationshipType: 'DEPENDS_ON' }
  API->>DB: Insert NoteRelationship document
  DB-->>API: Created
  API-->>UI: 201 Created
  UI->>User: Connection appears in Outgoing panel; Note B backlink count increments
```
