# Coding Standards

## 1. General JavaScript Standards

- **Language Level**: JavaScript ES6+ only (ES Modules).
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
| Mongoose Model | PascalCase | `Note`, `NoteRelationship` |
| Constants | UPPER_SNAKE_CASE | `NOTE_TYPES.FOLDER`, `AUTO_SAVE_DELAY_MS` |

---

## 3. Documentation & JSDoc

All exported functions, services, and middlewares must include JSDoc comments defining parameters, return types, and potential errors thrown:

```javascript
/**
 * Moves a note to a new parent location after verifying ancestor integrity.
 * @param {string} noteId - ID of note to move
 * @param {string|null} newParentId - ID of target parent or null for root
 * @returns {Promise<Object>} Updated note document
 * @throws {AppError} 400 if circular reference detected, 404 if not found
 */
export async function moveNote(noteId, newParentId) { ... }
```

---

## 4. Error Handling Standards

- **Backend**: Always throw `AppError` from services for operational business errors. Never silently return null or swallow exceptions.
- **Frontend**: Catch errors in hooks or feature services, update local error state, and provide actionable feedback to users.
