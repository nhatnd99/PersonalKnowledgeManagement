# Data Relationships

## 1. Note Hierarchy (Parent-Child)

**Type**: Self-referential One-to-Many  
**Pattern**: Adjacency List  
**Field**: `Note.parentId -> Note._id`

```
Root Notes (parentId: null)
├── Folder A (parentId: rootId1)
│   ├── Note 1 (parentId: folderAId)
│   └── Note 2 (parentId: folderAId)
└── Folder B (parentId: rootId2)
    └── Note 3 (parentId: folderBId)
```

**Rules**:
- `parentId: null` = root note
- One parent maximum per note
- Unlimited depth
- Circular references forbidden (enforced by service)
- Moving a note = update `parentId` only

---

## 2. Note Relationships (Knowledge Graph)

**Type**: Many-to-Many between Notes (via NoteRelationship)  
**Pattern**: Junction collection with metadata  
**Fields**: `NoteRelationship.sourceNoteId`, `NoteRelationship.targetNoteId`

**Directionality**: sourceNoteId -> targetNoteId

```
Note A --[DEPENDS_ON]--> Note B
Note A --[REFERENCES]--> Note C
Note B --[RELATED_TO]--> Note C
```

Backlinks for Note B = all NoteRelationships where `targetNoteId = NoteB._id`

---

## 3. Notes and Tags

**Type**: Many-to-Many  
**Pattern**: Array of ObjectId references in Note  
**Field**: `Note.tags[]` -> `Tag._id`

Notes store an array of Tag ObjectIds. This allows:
- Find all tags of a note: `note.tags`
- Find all notes with a tag: query `{ tags: tagId }`

---

## 4. Hierarchy vs. Relationships Independence

This is a critical architectural principle:

| Property | Hierarchy (parentId) | Relationships (NoteRelationship) |
|----------|---------------------|----------------------------------|
| Structure | Tree | Graph |
| Connection | One parent only | Any note to any note |
| Moving a note | Updates parentId | No change |
| Deletion cascade | Service decides | Service cleans up relationships |
| Query pattern | Children by parentId | By sourceNoteId or targetNoteId |

**Moving a note to a different parent does NOT affect its relationships.**
