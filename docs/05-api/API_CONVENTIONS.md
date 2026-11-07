# API Conventions (REST API v1)

## 1. URL Conventions

- **Version Prefix**: Always prefix endpoints with `/api/v1`.
- **Nouns**: Plural nouns for resource collections: `/api/v1/notes`, `/api/v1/tags`.
- **Identifiers**: Standard UUID v4 in route parameters: `/api/v1/notes/:noteId`.
- **Sub-resources**: Natural hierarchical paths: `/api/v1/notes/:noteId/children`.
- **Action routes**: Verb-based actions for explicit transitions: `/api/v1/notes/:noteId/move`.

---

## 2. Identifier Strategy

- All primary keys and foreign keys use **UUID v4** format (36-character hexadecimal string with hyphens, e.g. `123e4567-e89b-12d3-a456-426614174000`).
- Validated on incoming requests using `express-validator`'s `.isUUID()` rule.

---

## 3. HTTP Methods

| Method | Purpose | Idempotent | Body |
|--------|---------|------------|------|
| `GET` | Retrieve resource(s) | Yes | None |
| `POST` | Create a new resource | No | Full resource payload |
| `PATCH` | Partial update (e.g. auto-save) | No | Only changed fields |
| `DELETE` | Remove a resource | Yes | None |

---

## 4. Standard Response Envelope

All API responses follow a consistent envelope:

### Success Response
```json
{
  "success": true,
  "message": "Human-readable status summary",
  "data": {} | [] | null,
  "meta": null | {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Human-readable error summary",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

---

## 5. HTTP Status Codes

- `200 OK`: Request succeeded (GET, PATCH).
- `201 Created`: Resource successfully created (POST).
- `204 No Content`: Resource successfully deleted (DELETE).
- `400 Bad Request`: Validation failure, circular hierarchy detected, or invalid UUID.
- `404 Not Found`: Requested resource does not exist.
- `409 Conflict`: Unique constraint violation (e.g. duplicate tag name, duplicate relationship).
- `429 Too Many Requests`: Rate limit threshold exceeded.
- `500 Internal Server Error`: Unhandled server runtime exception.
