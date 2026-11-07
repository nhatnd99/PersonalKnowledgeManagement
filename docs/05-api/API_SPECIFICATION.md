# API Specification

> [!NOTE]
> This specification documents the **planned** API for Phase 1+. No endpoints are implemented yet.

## Base URL
```
http://localhost:3000/api
```

## Always Available Endpoints

### Health Check
```
GET /health
```
Response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-11-07T15:00:00.000Z",
  "version": "0.1.0"
}
```

### API Root
```
GET /api
```

---

## Notes API

### List Notes
```
GET /api/notes
```
Query Parameters:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `parentId` | ObjectId \| "null" | — | Filter by parent (use "null" for root) |
| `type` | "NOTE" \| "FOLDER" | — | Filter by type |
| `isFavorite` | boolean | — | Filter favorites |
| `isArchived` | boolean | false | Include archived notes |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

Response:
```json
{
  "success": true,
  "message": "Notes retrieved",
  "data": [
    {
      "_id": "...",
      "title": "Spring Boot",
      "type": "FOLDER",
      "parentId": null,
      "sortOrder": 0,
      "isFavorite": false,
      "isArchived": false,
      "createdAt": "...",
      "updatedAt": "..."
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

### Get Note
```
GET /api/notes/:noteId
```

### Create Note
```
POST /api/notes
```
Body:
```json
{
  "title": "Spring Boot",
  "content": "<p>Spring Boot notes...</p>",
  "contentFormat": "html",
  "parentId": null,
  "type": "NOTE"
}
```

### Update Note
```
PATCH /api/notes/:noteId
```
Body: partial Note fields

### Delete Note
```
DELETE /api/notes/:noteId
```

### Get Note Children
```
GET /api/notes/:noteId/children
```

### Move Note
```
PATCH /api/notes/:noteId/move
```
Body:
```json
{ "newParentId": "..." }
```

---

## Relationships API

### List Relationships for a Note
```
GET /api/notes/:noteId/relationships
```
Query: `?direction=outgoing|incoming|both`

### Create Relationship
```
POST /api/relationships
```
Body:
```json
{
  "sourceNoteId": "...",
  "targetNoteId": "...",
  "relationshipType": "DEPENDS_ON",
  "description": "Optional description"
}
```

### Delete Relationship
```
DELETE /api/relationships/:relationshipId
```

---

## Tags API

### List Tags
```
GET /api/tags
```

### Create Tag
```
POST /api/tags
```
Body: `{ "name": "java", "color": "#FF5733" }`

### Update Tag
```
PATCH /api/tags/:tagId
```

### Delete Tag
```
DELETE /api/tags/:tagId
```

---

## Search API

### Search Notes
```
GET /api/search?q=spring&tags=tagId1,tagId2
```
