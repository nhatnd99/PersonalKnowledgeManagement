# NOTE EDITOR UPGRADE REPORT — PROFESSIONAL RICH TEXT EDITOR

## 1. Executive Summary

This report documents the architectural review, root-cause resolution, and professional upgrade of the **Note Editor** in the Knowledge App. The editor now delivers a seamless, reliable, and smooth rich text experience inspired by **Jira**, **Confluence**, and **Notion**.

Formatting commands (Headings H1-H3, Bullet Lists, Numbered Lists, Task Lists, Blockquotes, Tables, Code Blocks, Inline formatting) now execute predictably. Most importantly, the background auto-save mechanism has been completely redesigned so that persistence operates silently in the background **without ever stealing focus, moving the cursor, collapsing selection, or overwriting in-flight user edits**.

---

## 2. Root Cause Analysis of Previous Problems

### 2.1 CSS Preflight Typography Wipeout (Headings & Lists)
- **Previous Symptom**: Headings (H1-H3) and lists (bullet, ordered) appeared broken or indistinguishable from regular paragraphs.
- **Root Cause**:
  1. Tailwind CSS Preflight (`@tailwind base`) aggressively resets `h1-h6` to `font-size: inherit; font-weight: inherit; margin: 0;`.
  2. Tailwind Preflight resets `ul, ol` to `list-style: none; margin: 0; padding: 0;`.
  3. The `@tailwindcss/typography` plugin was not installed, leaving `.prose` ineffective.
  4. `index.css` lacked styling rules for `.ProseMirror h1`, `.ProseMirror h2`, `.ProseMirror h3`, `.ProseMirror ul`, `.ProseMirror ol`, and `.ProseMirror li`.
  5. While TipTap created semantic `<h1>` and `<ul><li>` DOM nodes, they were rendered as plain unstyled text.
- **Fix**: Added explicit, high-contrast, scalable CSS rules in `frontend/src/index.css` covering H1, H2, H3, standard paragraphs, bullet lists (`disc`), ordered lists (`decimal`), nested lists (`circle`, `square`, `lower-alpha`, `lower-roman`), and selection highlights.

### 2.2 Controlled Component Anti-Pattern & Cursor/Focus Loss during Auto-Save
- **Previous Symptom**: While typing or formatting, the cursor would jump to the beginning/end of the document, selection was lost, and typing felt jittery.
- **Root Cause**:
  1. `NoteEditor.jsx` had an effect:
     ```javascript
     if (JSON.stringify(editor.getJSON()) !== JSON.stringify(initialContent)) {
       editor.commands.setContent(initialContent);
     }
     ```
  2. On every user edit, `useAutoSave` triggered `saveNote(data)`.
  3. `useNote.js` received the updated note from the PostgreSQL backend and called `setNote(response.data)`.
  4. `NoteEditorView` received the updated `note` and set `setContent(note.content)`.
  5. Because PostgreSQL JSONB normalizes and reorders JSON keys, `JSON.stringify(editor.getJSON()) !== JSON.stringify(initialContent)` evaluated to `true`.
  6. `editor.commands.setContent()` was executed on **every single background save**!
  7. `setContent()` destroys the active ProseMirror cursor, selection, history, and active list item tracking.
- **Fix**:
  1. Made the **TipTap Editor the single source of truth** for active document editing.
  2. Mounted `<NoteEditor key={note.id} initialContent={note.content} onChange={handleContentChange} />`. The editor initializes once per note.
  3. Removed the destructive `useEffect` from `NoteEditor.jsx`.
  4. Updated `useNote.js` so that background auto-save updates note metadata (`updatedAt`, `title`, `isFavorite`) without mutating `content` state.
  5. Content persistence is now completely decoupled from active editor rendering.

### 2.3 Focus Stealing from Toolbar Button Clicks
- **Previous Symptom**: Clicking a formatting button (Bold, Italic, List, etc.) would sometimes lose the highlighted text selection or cause focus bounce.
- **Root Cause**: Mouse-down on standard HTML `<button>` elements naturally transfers browser DOM focus to the button before `onClick` fires, causing ProseMirror to blur and drop the native text range.
- **Fix**: Added `onMouseDown={(e) => e.preventDefault()}` across all buttons, dropdown items, and color triggers in `EditorToolbar.jsx`, `HeadingSelector.jsx`, `TextColorPicker.jsx`, `HighlightColorPicker.jsx`, `AlignmentMenu.jsx`, and `TableMenu.jsx`.

### 2.4 Native `<select>` Element in HeadingSelector
- **Previous Symptom**: Changing headings via the dropdown felt clunky and occasionally lost selection.
- **Root Cause**: The HTML `<select>` element forced browser focus onto the dropdown menu and listed mismatched levels (1 to 6) while StarterKit was configured with levels 1 to 3.
- **Fix**: Replaced the native `<select>` with a custom, accessible Radix-style dropdown in `HeadingSelector.jsx` with keyboard shortcut hints (`Ctrl+Alt+1`, `Ctrl+Alt+2`, `Ctrl+Alt+3`, `Ctrl+Alt+0`) and `onMouseDown={(e) => e.preventDefault()}`.

---

## 3. Upgraded Features & Architecture

### 3.1 Rebuilt Toolbar Experience
- **Logical Grouping**: Undo/Redo $\rightarrow$ Heading/Block selector $\rightarrow$ Inline formatting (Bold, Italic, Underline, Strikethrough, Code) $\rightarrow$ Colors (Text, Highlight) $\rightarrow$ Text Alignment $\rightarrow$ Lists (Bullet, Ordered, Task) $\rightarrow$ Rich blocks (Quote, Code Block, Horizontal Divider, Table, Link, Internal Note Link, Image) $\rightarrow$ Clear formatting.
- **Active States**: High-contrast visual indication (`bg-primary text-primary-foreground`) when the selection is inside a formatted mark or block.
- **Disabled States**: Undo/Redo buttons automatically reflect `editor.can().undo()` / `editor.can().redo()`.
- **Tooltips & Shortcuts**: Every button displays action label and keyboard shortcut (e.g. `Ctrl+B`, `Ctrl+I`, `Ctrl+U`, `Ctrl+Shift+X`, `Ctrl+E`, `Ctrl+Shift+8`, `Ctrl+Shift+7`, `Ctrl+Shift+9`, `Ctrl+Shift+B`, `Ctrl+K`).

### 3.2 Core Editing Experience & List Handling
- **Block Transformations**:
  - Heading 1 $\leftrightarrow$ Heading 2 $\leftrightarrow$ Heading 3 $\leftrightarrow$ Paragraph transforms smoothly using `.chain().focus().setHeading({ level })` / `.setParagraph()`.
- **List Nesting & Indentation**:
  - `Tab`: Indents/nests bullet and ordered list items (`sinkListItem`).
  - `Shift+Tab`: Outdents list items (`liftListItem`).
  - `Enter`: Creates the next list item.
  - Double `Enter` or `Backspace` on an empty list item: Cleanly exits the list back into a paragraph.
- **Code Block**: Preserves syntax highlighting via `CodeBlockLowlight` and `lowlight`.

### 3.3 Redesigned Auto-Save Architecture
- **State Machine**:
  - `unsaved`: User typed new content; save is scheduled.
  - `saving`: Network request in-flight.
  - `saved`: Content successfully persisted to PostgreSQL.
  - `error`: Network or server failure; shows subtle error with "Retry" action.
- **Debounced Queue**: 1000ms delay. If the user continues typing while a save is in-flight, the latest payload is queued and dispatched when the current request settles.
- **Lifecycle Flush on Navigation**: When switching notes or closing the tab, `useAutoSave` flushes pending changes immediately before navigation completes.
- **Subtle Indicator**: Rendered in the note header with subtle colored dots (`bg-emerald-500`, `bg-amber-500`, `bg-destructive`) without causing any layout shifts.

---

## 4. Verification & Testing

### 4.1 Automated Backend Test Suite
Executed: `npm test --workspace=backend`
- 7/7 test suites passed:
  - `user.test.js`: PASS
  - `export.test.js`: PASS
  - `search.test.js`: PASS
  - `relationship.test.js`: PASS
  - `graph.test.js`: PASS
  - `tag.test.js`: PASS
  - `note.test.js`: PASS
- **Total: 58 passed, 58 total (100% success rate)**.

### 4.2 Frontend Code Quality & ESLint
Executed: `npm run lint --workspace=frontend`
- Result: **0 errors, 0 warnings**.

### 4.3 Production Build Verification
Executed: `npm run build --workspace=frontend`
- Vite production build completed in 11.32s with zero bundle errors:
  - `dist/index.html` (0.56 kB)
  - `dist/assets/index-CpgQe2pe.css` (42.61 kB)
  - `dist/assets/index-CLP8QAxO.js` (1,168.43 kB)

---

## 5. Summary of Modified Files

| File | Nature of Changes |
|---|---|
| `frontend/src/index.css` | Added comprehensive typography, heading sizes, bullet list styles, ordered list decimal numbers, and selection highlights for `.ProseMirror`. |
| `frontend/src/features/notes/components/editor/HeadingSelector.jsx` | Replaced native `<select>` with custom accessible dropdown, preventing selection loss with `e.preventDefault()` on mousedown. |
| `frontend/src/features/notes/components/editor/EditorToolbar.jsx` | Added `onMouseDown={(e) => e.preventDefault()}` on all buttons, enhanced tooltips and keyboard shortcuts. |
| `frontend/src/features/notes/components/editor/TextColorPicker.jsx` | Added `e.preventDefault()` on mousedown to maintain editor focus during color selection. |
| `frontend/src/features/notes/components/editor/HighlightColorPicker.jsx` | Added `e.preventDefault()` on mousedown to maintain editor focus during highlight selection. |
| `frontend/src/features/notes/components/editor/AlignmentMenu.jsx` | Added `e.preventDefault()` on mousedown and PropTypes. |
| `frontend/src/features/notes/components/editor/TableMenu.jsx` | Added `e.preventDefault()` on mousedown and PropTypes. |
| `frontend/src/features/notes/components/NoteEditor.jsx` | Removed destructive `useEffect` that reset content on auto-save; cleaned up CSS classes; fixed unused imports. |
| `frontend/src/features/notes/components/NoteEditorView.jsx` | Keyed `NoteEditor` by `note.id`; decoupled live document state from server responses; implemented lifecycle flush. |
| `frontend/src/features/notes/hooks/useAutoSave.js` | Redesigned auto-save with `unsaved`/`saving`/`saved`/`error` state machine, in-flight queue, race-condition guard, and retry. |
| `frontend/src/features/notes/hooks/useNote.js` | Isolated document state updates so background saves update metadata without mutating active content. |
| `frontend/src/features/notes/constants/index.js` | Added `AUTO_SAVE_STATUS.UNSAVED`. |
| `frontend/src/features/notes/components/AutoSaveIndicator.jsx` | Added subtle unsaved state and retry action without shifting layout. |
| `NOTE_EDITOR_UPGRADE_PLAN.md` | Comprehensive architectural audit and upgrade plan. |
| `NOTE_EDITOR_UPGRADE_REPORT.md` | Final technical report and verification results. |
