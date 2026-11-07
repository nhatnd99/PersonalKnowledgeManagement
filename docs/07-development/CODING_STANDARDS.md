# Coding Standards

## 1. General JavaScript Standards

- **Language Level**: JavaScript ES6+ only (ES Modules: `type: "module"`).
- **Prohibited**: TypeScript (`.ts`, `.tsx`), Docker configurations, microservices, non-JavaScript backends.
- **Variables**: `const` by default, `let` when reassigned. Never use `var`.
- **Async Code**: Always use `async/await` syntax. Avoid raw Promise `.then()` chains.
- **Strings**: Use template literals for variable interpolation.

---

## 2. Naming Conventions

| Element | Format | Example |
|---------|--------|---------|
| React Component | PascalCase | `NoteEditor.jsx`, `KnowledgeGraph.jsx` |
| React Hook | camelCase with `use` prefix | `useAutoSave.js`, `useHierarchy.js` |
| Frontend Service | camelCase + `Service` suffix | `noteService.js` |
| Backend Module File | `domain.role.js` | `note.service.js`, `note.controller.js` |
| Prisma Model (in schema) | PascalCase | `Note`, `NoteRelationship`, `Tag` |
| PostgreSQL Tables | plural snake_case | `notes`, `note_relationships`, `tags`, `note_tags` |
| PostgreSQL Columns | snake_case | `parent_id`, `is_favorite`, `archived_at` |
| Constants | UPPER_SNAKE_CASE | `NOTE_TYPES.FOLDER`, `AUTO_SAVE_DELAY_MS` |

---

## 3. Documentation & JSDoc

All exported functions, services, and middlewares must include JSDoc comments defining parameters, return types, and potential errors thrown:

```javascript
/**
 * Moves a note to a new parent location after verifying ancestor integrity.
 * @param {string} noteId - UUID of note to move
 * @param {string|null} newParentId - UUID of target parent or null for root
 * @returns {Promise<Object>} Updated note record
 * @throws {AppError} 400 if circular reference detected, 404 if not found
 */
export async function moveNote(noteId, newParentId) { ... }
```

---

## 4. Error Handling Standards

- **Backend**: Always throw `AppError` from services for operational business errors. Never silently return null or swallow exceptions.
- **Prisma Error Handling**: The global error handler in `errorHandler.js` catches Prisma error codes (e.g. `P2002` -> 409 Conflict, `P2025` -> 404 Not Found) and returns clean, uniform responses.
- **Frontend**: Catch errors in hooks or feature services, update local error state, and provide actionable feedback to users.
