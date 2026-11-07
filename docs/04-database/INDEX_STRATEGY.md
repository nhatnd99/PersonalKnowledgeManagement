# Database Index Strategy (PostgreSQL + Prisma)

## Principles
1. Create indexes for foreign keys and filter columns (`WHERE`, `ORDER BY`, `JOIN`).
2. Use composite unique constraints to guarantee data integrity at the database engine level.
3. Keep write overhead balanced (avoid over-indexing rarely queried columns).
4. All indexes are managed through Prisma Migrate.

---

## 1. `notes` Table Indexes

| Index Target | Type | Reason | Query Pattern |
|--------------|------|--------|---------------|
| `id` | B-tree (Primary Key) | Uniquely identifies note | `WHERE id = :id` |
| `parent_id` | B-tree | Tree navigation; fetch siblings and direct children | `WHERE parent_id = :parentId ORDER BY sort_order` |
| `type` | B-tree | Filter folders vs notes | `WHERE type = 'FOLDER'` |
| `title` | B-tree | Quick prefix lookups and alphabetical sorting | `WHERE title ILIKE :term` |
| `archived_at` | B-tree | Filter active vs archived notes | `WHERE archived_at IS NULL` |
| `is_favorite` | B-tree | Quick retrieval of starred notes | `WHERE is_favorite = true` |
| `updated_at` | B-tree | Recently updated notes view | `ORDER BY updated_at DESC LIMIT :limit` |

---

## 2. `note_relationships` Table Indexes

| Index Target | Type | Reason | Query Pattern |
|--------------|------|--------|---------------|
| `(source_note_id, target_note_id, relationship_type)` | Composite Unique | Enforce relationship uniqueness | Prevents duplicate edges |
| `source_note_id` | B-tree (Foreign Key) | Outgoing relationships panel & graph edges | `WHERE source_note_id = :noteId` |
| `target_note_id` | B-tree (Foreign Key) | Backlinks panel & graph incoming edges | `WHERE target_note_id = :noteId` |
| `relationship_type` | B-tree | Graph filtering by connection type | `WHERE relationship_type = :type` |

---

## 3. `tags` & `note_tags` Table Indexes

| Index Target | Type | Reason | Query Pattern |
|--------------|------|--------|---------------|
| `tags.name` | Unique B-tree | Tag name deduplication & fast lookup | `WHERE name = :name` |
| `note_tags.(note_id, tag_id)` | Composite Primary Key | Enforce unique note-tag pair | Junction table identity |
| `note_tags.tag_id` | B-tree (Foreign Key) | Find all notes tagged with tag X | `WHERE tag_id = :tagId` |
