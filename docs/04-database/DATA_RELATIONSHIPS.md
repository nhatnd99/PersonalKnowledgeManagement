# Data Relationships & Independence Rules

## 1. Hierarchy (Parent-Child Tree)

**Pattern**: Self-referencing Foreign Key (Adjacency List)  
**Field**: `notes.parent_id -> notes.id`

```
Root Notes (parent_id: NULL)
├── Java Backend (Folder)
│   ├── Spring Boot (Folder)
│   │   ├── Spring Security (Note)
│   │   └── Spring Data JPA (Note)
│   └── Database (Folder)
│       └── PostgreSQL (Note)
```

### Hierarchy Rules:
- `parent_id = NULL` defines a root-level note or folder.
- Both notes and folders can contain children.
- Unlimited nesting depth.
- Moving a note modifies ONLY `parent_id`.
- **Cycle Prevention**: The backend service inspects the ancestor chain from `newParentId` upward to root before updating `parent_id`. If `noteId` is present in the ancestor chain, the operation is rejected (`400 Bad Request`).

---

## 2. Knowledge Graph Relationships

**Pattern**: Independent Junction Table with Metadata (`note_relationships`)  
**Directionality**: `source_note_id -> target_note_id`

```
Spring Security --[DEPENDS_ON]--> JWT Authentication
JWT Authentication --[REFERENCES]--> HTTP RFC 7519
Spring Boot --[EXTENDS]--> Spring Framework
PostgreSQL --[RELATED_TO]--> Database Indexing
```

### Relationship Rules:
- Relationships are directional and typed.
- Two notes can have multiple relationships of *different* types, but exact duplicate `(source, target, type)` is blocked by a database composite unique constraint.
- Backlinks are resolved by querying `target_note_id = currentNoteId`.
- Self-referencing relationships (`source === target`) are rejected.

---

## 3. Strict Independence Between Hierarchy and Knowledge Graph

A foundational principle of Knowledge App is that **hierarchy and graph relationships are completely decoupled**:

| Behavior | Tree Hierarchy (`parent_id`) | Knowledge Graph (`note_relationships`) |
|----------|-------------------------------|----------------------------------------|
| **Moving a Note** | Updates `parent_id` only | **Zero changes**. All connections remain intact. |
| **Deleting a Note (Default)** | Re-parents direct children to the deleted note's parent | Database cascades (`ON DELETE CASCADE`) remove graph edges referencing the deleted note. |
| **Deleting a Note (Cascade)** | Recursively deletes all descendant notes | Database cascades remove all graph edges across the deleted subtree. |
| **Reordering Siblings** | Updates `sort_order` | Zero impact on relationships. |

---

## 4. Deletion Cascade Matrix

| Action | Impact on `notes.children` | Impact on `note_relationships` | Impact on `note_tags` |
|--------|----------------------------|--------------------------------|-----------------------|
| `DELETE /api/v1/notes/:id` (default) | Direct children updated to `parent_id = deletedNote.parentId` | Cascade deleted (`ON DELETE CASCADE`) | Cascade deleted |
| `DELETE /api/v1/notes/:id?cascade=true` | Descendant notes deleted recursively | All relationships for all deleted notes cascade deleted | Cascade deleted |
| `DELETE /api/v1/tags/:id` | No impact on notes | No impact on relationships | Associated `note_tags` rows deleted |
