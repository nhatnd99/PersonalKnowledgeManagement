# API Conventions

## URL Conventions

- Use lowercase, hyphenated paths: `/api/note-relationships`
- Use plural nouns for collections: `/api/notes`, `/api/tags`
- Use `:id` suffix for resource identifiers: `/api/notes/:noteId`
- Nest sub-resources: `/api/notes/:noteId/children`

## HTTP Methods

| Method | Purpose | Body |
|--------|---------|------|
| GET | Read resource(s) | None |
| POST | Create new resource | Full resource data |
| PATCH | Partial update | Only changed fields |
| PUT | Full replacement | Full resource data |
| DELETE | Remove resource | None |

## Response Format

All responses follow this structure:

```json
{
  "success": true | false,
  "message": "Human-readable message",
  "data": {} | [] | null,
  "meta": {} | null,
  "errors": []
}
```

- `meta` is included for paginated lists
- `errors` is included on failure, contains field-level details
- `data` is `null` on failure

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (delete success) |
| 400 | Bad Request / Validation Error |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## Pagination

List endpoints support:
- `page` (default: 1)
- `limit` (default: 20, max: 100)

## ObjectId References

- All references use MongoDB ObjectId (24-character hex string)
- Send as strings in JSON
- Validate on the server with `express-validator` using `isMongoId()`
