# Index Strategy

## Principles
1. Create indexes for fields that appear in `find()` query filters
2. Create compound indexes for common multi-field queries
3. Use text indexes for full-text search
4. Avoid over-indexing (each index costs write performance)
5. Document the reason for each index

---

## Note Collection Indexes

### `parentId` (Single Field)
```javascript
noteSchema.index({ parentId: 1 });
```
**Reason**: Most frequent query — "get all children of this parent". Called whenever a tree node is expanded.

### `title + content` (Text Index)
```javascript
noteSchema.index({ title: 'text', content: 'text' }, { weights: { title: 10, content: 1 } });
```
**Reason**: Powers full-text search. Title weighted 10x higher than content.

### `isArchived + updatedAt` (Compound)
```javascript
noteSchema.index({ isArchived: 1, updatedAt: -1 });
```
**Reason**: Most list views filter `isArchived: false` and sort by `updatedAt` descending (recently updated first).

### `isFavorite + updatedAt` (Compound)
```javascript
noteSchema.index({ isFavorite: 1, updatedAt: -1 });
```
**Reason**: Favorites view filters by `isFavorite: true` sorted by recently updated.

---

## NoteRelationship Collection Indexes

### `sourceNoteId` (Single Field)
```javascript
noteRelationshipSchema.index({ sourceNoteId: 1 });
```
**Reason**: "Get all outgoing relationships from note X" — called when viewing a note's connections panel.

### `targetNoteId` (Single Field)
```javascript
noteRelationshipSchema.index({ targetNoteId: 1 });
```
**Reason**: "Get all incoming relationships to note X" — called for backlinks. This is effectively the backlink index.

### `sourceNoteId + targetNoteId + relationshipType` (Unique Compound)
```javascript
noteRelationshipSchema.index(
  { sourceNoteId: 1, targetNoteId: 1, relationshipType: 1 },
  { unique: true }
);
```
**Reason**: Enforces uniqueness constraint (no duplicate relationships). Also covers queries for specific relationship existence checks.

---

## Tag Collection Indexes

### `name` (Unique)
Defined via `unique: true` on the schema field.
**Reason**: Tag names must be unique. Also enables fast tag lookup by name.

---

## Future Indexes to Consider

| Index | Trigger |
|-------|---------|
| `Note.tags` | When tag filtering becomes slow |
| `Note.type` | When filtering NOTE vs FOLDER becomes frequent |
| `Note.sortOrder + parentId` | When sibling ordering queries slow down |
