# Test Cases Specification

## 1. Note Management Test Cases

| Test Case ID | Description | Input | Expected Output |
|--------------|-------------|-------|-----------------|
| `TC-NOTE-01` | Create valid note | `{ title: "My Note", type: "NOTE" }` | Status 201, note object returned with `_id` |
| `TC-NOTE-02` | Reject creation without title | `{ title: "" }` | Status 400, validation error on `title` |
| `TC-NOTE-03` | Create note under valid parent | `{ title: "Child Note", parentId: "<validId>" }` | Status 201, `parentId` matched |
| `TC-NOTE-04` | Move note to new parent | `PATCH /move { newParentId: "<targetId>" }` | Status 200, `parentId` updated |
| `TC-NOTE-05` | Prevent circular parent reparenting | `PATCH /move { newParentId: "<descendantId>" }` | Status 400, circular reference error |
| `TC-NOTE-06` | Delete note and cleanup relationships | `DELETE /api/notes/:id` | Status 204, all incoming/outgoing NoteRelationships deleted |

---

## 2. Note Relationship Test Cases

| Test Case ID | Description | Input | Expected Output |
|--------------|-------------|-------|-----------------|
| `TC-REL-01` | Create valid directional relationship | `{ sourceNoteId, targetNoteId, relationshipType: 'DEPENDS_ON' }` | Status 201, relationship created |
| `TC-REL-02` | Prevent self-referential relationship | `{ sourceNoteId: A, targetNoteId: A }` | Status 400, error "cannot relate note to itself" |
| `TC-REL-03` | Prevent duplicate relationship of same type | Same source, target, and type | Status 409 Conflict |
| `TC-REL-04` | Query incoming backlinks | `GET /api/notes/:id/relationships?direction=incoming` | Status 200, returns list of referencing notes |
