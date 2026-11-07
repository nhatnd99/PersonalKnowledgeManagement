# API Error Handling (PostgreSQL / Prisma)

## 1. Error Response Format

All API errors return a standardized JSON structure:

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

## 2. Error Categories & Mapping

### 1. Validation Errors (`400 Bad Request`)
Triggered when request payload fails `express-validator` rules.
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "title", "message": "Title cannot be empty" },
    { "field": "parentId", "message": "Parent ID must be a valid UUID" }
  ]
}
```

### 2. Operational Business Errors (`AppError`)
Thrown explicitly by service layers.
- Not Found (`404`): `throw new AppError('Note not found', 404)`
- Circular Reference (`400`): `throw new AppError('Cannot move note into its own descendant', 400)`
- Self-Relationship (`400`): `throw new AppError('A note cannot relate to itself', 400)`

### 3. Prisma Client Known Request Errors
Handled in `backend/src/middlewares/errorHandler.js`:

| Prisma Error Code | Meaning | HTTP Status | Response Handling |
|-------------------|---------|-------------|-------------------|
| `P2002` | Unique constraint violation | `409 Conflict` | Identifies duplicate field(s) |
| `P2025` | Record to update/delete not found | `404 Not Found` | Returns "Record not found" |
| `P2003` | Foreign key constraint failed | `400 Bad Request` | Identifies invalid foreign key |
| `PrismaClientValidationError` | Invalid query argument type | `400 Bad Request` | Returns "Invalid data provided" |

### 4. Unhandled Runtime Exceptions (`500 Internal Server Error`)
Unexpected server bugs. Excludes stack traces in production to prevent information disclosure.

---

## 3. Frontend Error Normalization

The centralized Axios client (`frontend/src/services/apiClient.js`) normalizes all HTTP error responses:

```javascript
{
  message: error.response?.data?.message || "An unexpected error occurred",
  status: error.response?.status,
  errors: error.response?.data?.errors || [],
  originalError: error
}
```
This ensures React hooks in `features/` can display field errors or toast notifications consistently.
