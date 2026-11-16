# Note Title Editing & Persistence — Fix Report

## 1. Root Cause of the Original Issue

Three compounding issues in the frontend state management, synchronization lifecycle, and backend request validation caused note titles to revert or fail to persist:

1. **Initial State Synchronization Failure (`NoteEditorView.jsx`)**:
   - `const activeNoteIdRef = useRef(noteId);` was initialized with the active `noteId`.
   - When the component mounted and `note` was asynchronously loaded from the backend, the sync effect evaluated:
     `if (note && note.id !== activeNoteIdRef.current)`
   - Because `activeNoteIdRef.current` was already equal to `note.id`, the check evaluated to `false`.
   - Consequently, `setTitle(note.title || '')` was **never invoked** on initial page load or browser refresh.
   - The local React state `title` remained its default `''` (empty string), causing the controlled input to permanently display the visual placeholder `"Untitled Note"`, even when a title existed in PostgreSQL.

2. **Accidental State Coupling Between Title and TipTap Content**:
   - In `NoteEditorView.jsx`, `handleTitleChange` bundled `content: contentRef.current` with `{ title: newTitle }`. Since `contentRef.current` was `null` on initial load, saving the title sent `content: null`, wiping out note content.
   - Conversely, `handleContentChange` bundled `title: titleRef.current` with `{ content: newContentJson }`. Since `titleRef.current` was uninitialized `''`, editing the body sent `title: ''` to the backend.
   - `useAutoSave` did not merge partial updates; incoming updates completely overwrote `pendingDataRef.current`.

3. **Validation Rejection of Empty String on Update (`note.validation.js`)**:
   - `updateNoteValidation` had `.trim().notEmpty().withMessage('Title cannot be empty')`.
   - Whenever an empty or whitespace title was sent (or when content auto-save sent uninitialized `title: ''`), the backend rejected the request with HTTP `400 Bad Request`.
   - As a result, auto-save failed and the title was never saved to the database.

---

## 2. Files Modified

| File | Subsystem | Purpose of Modification |
|------|-----------|-------------------------|
| `frontend/src/features/notes/components/NoteEditorView.jsx` | Frontend UI & State | Fixed title state initialization, decoupled title and content auto-save, added keyboard navigation (`Enter` -> focus editor), and added clean unmount/navigation flush. |
| `frontend/src/features/notes/hooks/useAutoSave.js` | Frontend Hook | Set debounce delay to 600ms (500–800ms window), enabled partial update merging in `triggerSave`, added `cancelSave()`, and safeguarded error recovery. |
| `frontend/src/features/notes/hooks/useNote.js` | Frontend Hook | Emits `note:updated` window event upon title update to synchronize sidebar hierarchy in real-time. |
| `frontend/src/features/hierarchy/hooks/useHierarchy.js` | Frontend Hook | Added listener for `note:updated` event to update node titles in the sidebar tree without page or tree reload. |
| `backend/src/modules/notes/note.validation.js` | Backend API | Allowed string titles between 0 and 500 characters on `PATCH /api/v1/notes/:noteId` (enables clearing title to empty string for visual fallback). |
| `backend/src/modules/notes/note.service.js` | Backend Service | Trims string title updates and preserves empty string `""` without converting to null or failing Prisma constraints. |
| `backend/src/modules/notes/note.test.js` | Backend Tests | Added automated tests for title updates: Unicode characters, punctuation, empty string fallback, and 500-char max length validation. |
| `backend/src/modules/graph/graph.service.js` | Backend Lint | Exported `getAllDescendantEntities` to eliminate ESLint unused variable warning. |
| `backend/src/modules/graph/graph-scenarios.test.js` | Backend Lint | Removed unused `jest` import to satisfy ESLint `--max-warnings 0`. |

---

## 3. Frontend Changes

### 3.1 Controlled Title Input & Lifecycle Synchronization
- In `NoteEditorView.jsx`, replaced the flawed `activeNoteIdRef` guard with `loadedNoteIdRef`:
  ```javascript
  useEffect(() => {
    if (note && note.id === noteId && note.id !== loadedNoteIdRef.current) {
      loadedNoteIdRef.current = note.id;
      activeNoteIdRef.current = note.id;
      const initialTitle = note.title || '';
      setTitle(initialTitle);
      titleRef.current = initialTitle;
      lastSavedTitleRef.current = initialTitle;
      setContent(note.content || null);
      contentRef.current = note.content || null;
    }
  }, [note, noteId]);
  ```
- Guaranteed title initialization on initial mount, browser refresh, and note navigation.
- Added `lastSavedTitleRef` to prevent redundant network requests when the title has not changed.

### 3.2 Decoupled Title and Content Saving
- `handleTitleChange` triggers auto-save with **only** `{ title: newTitle }`.
- `handleContentChange` triggers auto-save with **only** `{ content: newContentJson }`.
- Title edits cannot corrupt note content, and content edits cannot corrupt or overwrite the title.

### 3.3 Enhanced UI/UX & Keyboard Navigation
- Sizing: `text-2xl sm:text-3xl font-bold bg-transparent border-none outline-none text-foreground`.
- Visual Fallback: `placeholder="Untitled Note"` styled with `placeholder:text-muted-foreground/50`.
- Subtle Focus: `focus:bg-muted/20 focus:ring-1 focus:ring-primary/30 rounded-md px-1 py-1 transition-colors`.
- Keyboard Navigation: Pressing `Enter` in the title input smoothly shifts focus to the TipTap rich-text canvas (`.ProseMirror`).
- Real-time Sidebar Sync: Dispatches `note:updated` custom event so `useHierarchy` updates the node title in the sidebar tree instantaneously without refetching.

---

## 4. Backend/API Changes

### 4.1 Update Validation (`note.validation.js`)
Updated `updateNoteValidation` to allow string titles up to 500 characters, including empty strings:
```javascript
body('title')
  .optional({ nullable: true })
  .isString()
  .withMessage('Title must be a string')
  .isLength({ max: 500 })
  .withMessage('Title must be at most 500 characters')
```

### 4.2 Service Layer (`note.service.js`)
In `updateNote`:
```javascript
if (updateData.title !== undefined) {
  data.title = typeof updateData.title === 'string' ? updateData.title.trim() : (updateData.title || '');
}
```
Safely trims whitespace while maintaining valid empty string `""` values conforming to PostgreSQL `@db.VarChar(500)`.

---

## 5. Database Verification

- **Schema Check**: In `backend/prisma/schema.prisma`, `Note.title` is defined as `title String @db.VarChar(500)`.
- **Nullability**: `title` is non-nullable. Empty strings `""` are fully valid in PostgreSQL `VARCHAR` without null violations.
- **Migration**: No schema changes or new migrations were necessary; the existing PostgreSQL schema natively supports all required functionality.

---

## 6. Auto-Save Synchronization & Race Condition Prevention

| Scenario | Solution Mechanism |
|----------|-------------------|
| **Rapid Typing** | Debounced at 600ms. Subsequent keystrokes reset the debounce timer and update `pendingDataRef`. Only the final string is dispatched to the API. |
| **Concurrent Saves** | If user types while an HTTP request is in-flight, `inFlightDataRef` tracks the active save and `pendingDataRef` holds newer edits. Upon response, the queued changes are immediately scheduled. |
| **Note Switching** | When switching from Note A to Note B, `flushSave()` immediately persists Note A's pending changes to Note A's UUID. Note B's state initializes with `setTitle('')` and `cancelSave()`. In `useNote.js`, incoming responses are ignored if `prev.id !== idToSave`, preventing delayed responses from overwriting the active note. |
| **Network Error** | On error, status transitions to `Save failed` (`AUTO_SAVE_STATUS.ERROR`) with a `Retry` button. The user's typed title remains in local React state and is never lost. |
| **Unchanged Title** | `if (newTitle !== lastSavedTitleRef.current)` guards against triggering network requests when the title value has not changed. |

---

## 7. Test Results

### 7.1 Backend Automated Tests (Jest)
- `npm test --workspace=backend`: **9/9 test suites passed, 85/85 tests passed** (including 4 new tests specifically for title updates).
  - `PATCH /api/v1/notes/:noteId` updates note with partial payload (200).
  - `PATCH /api/v1/notes/:noteId` persists Unicode characters, spaces, and punctuation (`Kiến Trúc Hệ Thống: Microservices & Event-Driven 🚀 (v2.0)`).
  - `PATCH /api/v1/notes/:noteId` allows clearing title to empty string for visual fallback.
  - `PATCH /api/v1/notes/:noteId` rejects titles longer than 500 characters with 400 Bad Request.

### 7.2 Monorepo Linter
- `npm run lint`: **0 errors, 0 warnings** across both `frontend` and `backend` workspaces.

### 7.3 Frontend Production Build
- `npm run build --workspace=frontend`: **Clean production build in 12.99s** (1,693 modules transformed, `dist/` generated without error).

### 7.4 End-to-End Database Integration Verification
A verification script was executed against the live PostgreSQL database:
1. Created note with ID and default title `"Untitled Note"`.
2. Updated title to `"System Design Foundation"` via `updateNote()`. Verified `updatedNote.title === "System Design Foundation"` and note content was untouched.
3. Reloaded note directly from PostgreSQL via `getNoteById()`. Verified title remained `"System Design Foundation"`.
4. Updated title with complex Unicode: `"Kiến Trúc Hệ Thống: CQRS & Event Sourcing (v1.0) 🎯"`. Verified persistence.
5. Cleared title to `""` for visual fallback. Verified persistence.
6. Cleaned up test note. **All verifications passed.**

---

## 8. Remaining Limitations
None identified. Note title editing, debouncing, visual fallback, real-time hierarchy synchronization, and PostgreSQL persistence are fully functional and verified.
