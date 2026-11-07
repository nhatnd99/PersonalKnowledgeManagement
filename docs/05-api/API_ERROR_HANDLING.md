# API Error Handling

## Error Response Format

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

## Error Categories

### Validation Errors (400)
Returned when request parameters or payload fail express-validator checks.

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "title", "message": "Title cannot be empty" },
    { "field": "type", "message": "Invalid note type" }
  ]
}
```

### Not Found (404)
Returned when a requested resource does not exist.

```json
{
  "success": false,
  "message": "Note not found",
  "errors": []
}
```

### Conflict (409)
Returned when attempting to create duplicate entities (e.g., existing tag name, existing relationship).

```json
{
  "success": false,
  "message": "Duplicate relationship already exists",
  "errors": []
}
```

### Internal Server Error (500)
Returned when an unexpected runtime exception occurs. Sensitive system details and stack traces are excluded in production.

```json
{
  "success": false,
  "message": "An unexpected error occurred",
  "errors": []
}
```

## Error Handling Pattern (Backend)

Operational errors are raised by throwing instances of `AppError`:

```javascript
import { AppError } from '../middlewares/errorHandler.js';

// Inside service methods:
if (!note) {
  throw new AppError('Note not found', 404);
}

if (isDescendant(noteId, newParentId)) {
  throw new AppError('Cannot move note into its own descendant (circular reference)', 400);
}
```
