# API Specification (REST API v1)

> [!NOTE]
> All API endpoints are prefixed with `/api/v1`. Resource IDs use standard UUID v4 format.

## Base URL
```
http://localhost:3000/api/v1
```

## Always Available Endpoints

### Health Check
```http
GET /health
```
Response `(200 OK)`:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-11-07T16:00:00.000Z",
  "version": "0.1.0"
}
```

### API v1 Root
```http
GET /api/v1
```
Response `(200 OK)`:
```json
{
  "success": true,
  "message": "Knowledge App API v1",
  "version": "0.1.0",
  "database": "PostgreSQL (Prisma ORM)",
  "endpoints": {
    "health": "/health",
    "notes": "/api/v1/notes (planned Phase 1)",
    "relationships": "/api/v1/relationships (planned Phase 3)",
    "tags": "/api/v1/tags (planned Phase 4)",
    "search": "/api/v1/search (planned Phase 4)"
  }
}
```

---

## 1. Notes API

### List Notes
```http
GET /api/v1/notes
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `parentId` | UUID \| "null" | — | Filter by parent (`"null"` for root notes) |
| `type` | "NOTE" \| "FOLDER" | — | Filter by note type |
| `isFavorite` | boolean | — | Filter starred notes |
| `isArchived` | boolean | false | Include or filter archived notes |
| `page` | integer | 1 | Page number (1-indexed) |
| `limit` | integer | 20 | Items per page (max: 100) |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Notes retrieved successfully",
  "data": [
    {
      "id": "11111111-1111-1111-1111-111111111111",
      "title": "Spring Boot",
      "type": "FOLDER",
      "parentId": null,
      "sortOrder": 0,
      "isFavorite": false,
      "archivedAt": null,
      "createdAt": "2026-11-07T15:00:00.000Z",
      "updatedAt": "2026-11-07T15:00:00.000Z"
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### Get Note by ID
```http
GET /api/v1/notes/:noteId
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Note retrieved successfully",
  "data": {
    "id": "22222222-2222-2222-2222-222222222222",
    "title": "Spring Security",
    "type": "NOTE",
    "content": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [{ "type": "text", "text": "Spring Security concepts..." }]
        }
      ]
    },
    "contentFormat": "json",
    "parentId": "11111111-1111-1111-1111-111111111111",
    "sortOrder": 0,
    "isFavorite": true,
    "archivedAt": null,
    "createdAt": "2026-11-07T15:00:00.000Z",
    "updatedAt": "2026-11-07T15:10:00.000Z"
  }
}
```

---

### Create Note
```http
POST /api/v1/notes
```
**Request Body:**
```json
{
  "title": "Spring Security",
  "type": "NOTE",
  "parentId": "11111111-1111-1111-1111-111111111111",
  "content": {
    "type": "doc",
    "content": []
  },
  "contentFormat": "json"
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "Note created successfully",
  "data": {
    "id": "22222222-2222-2222-2222-222222222222",
    "title": "Spring Security",
    "type": "NOTE",
    "parentId": "11111111-1111-1111-1111-111111111111",
    "content": { "type": "doc", "content": [] },
    "contentFormat": "json",
    "sortOrder": 0,
    "isFavorite": false,
    "archivedAt": null,
    "createdAt": "2026-11-07T15:00:00.000Z",
    "updatedAt": "2026-11-07T15:00:00.000Z"
  }
}
```

---

### Update Note (Auto-Save Target)
```http
PATCH /api/v1/notes/:noteId
```
**Request Body (Partial fields):**
```json
{
  "title": "Spring Security & OAuth2",
  "content": {
    "type": "doc",
    "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Updated content" }] }]
  }
}
```
**Response (200 OK):** Updated Note record.

---

### Move Note (Reparenting with Cycle Prevention)
```http
PATCH /api/v1/notes/:noteId/move
```
**Request Body:**
```json
{
  "newParentId": "33333333-3333-3333-3333-333333333333"
}
```
*Note: Use `newParentId: null` to move to root.*

---

### Delete Note
```http
DELETE /api/v1/notes/:noteId?cascade=false
```
**Query Parameters:**
- `cascade=false` (default): Re-parents direct children to the deleted note's `parentId`. Purges associated relationships via database cascade.
- `cascade=true`: Recursively deletes all descendant notes and all associated relationships.

**Response (204 No Content)**

---

## 2. Knowledge Graph Relationships API

### List Relationships for a Note
```http
GET /api/v1/notes/:noteId/relationships?direction=both
```
Query `direction`: `outgoing` | `incoming` (backlinks) | `both`

### Create Relationship
```http
POST /api/v1/relationships
```
**Request Body:**
```json
{
  "sourceNoteId": "22222222-2222-2222-2222-222222222222",
  "targetNoteId": "44444444-4444-4444-4444-444444444444",
  "relationshipType": "DEPENDS_ON",
  "description": "Requires core JWT parsing module"
}
```
**Response (201 Created)**

### Delete Relationship
```http
DELETE /api/v1/relationships/:relationshipId
```
**Response (204 No Content)**

---

## 3. Tags API

- `GET /api/v1/tags`: List all tags
- `POST /api/v1/tags`: Create tag
- `PATCH /api/v1/tags/:tagId`: Update tag (name, color, description)
- `DELETE /api/v1/tags/:tagId`: Delete tag (cascades `note_tags` associations)

---

## 4. Search API

```http
GET /api/v1/search?q=spring&tag=jwt
```
Full-text search querying note titles, JSON content, and tags.
