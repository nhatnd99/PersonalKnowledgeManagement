# NOTE EDITOR UPGRADE PLAN — PROFESSIONAL RICH TEXT EDITOR

## 1. Comprehensive Audit of Current Implementation

### 1.1 TipTap Version & Dependencies
- `@tiptap/core`: `^2.1.13`
- `@tiptap/react`: `^2.1.13`
- `@tiptap/starter-kit`: `^2.1.13` (includes Bold, Italic, Strike, Heading [1-3], BulletList, OrderedList, ListItem, Blockquote, Code, CodeBlock, Document, Paragraph, Text, History, HorizontalRule, Dropcursor, Gapcursor, HardBreak)
- Additional Extensions:
  - `@tiptap/extension-underline`: `^2.1.13`
  - `@tiptap/extension-task-list` & `@tiptap/extension-task-item`: `^2.1.13`
  - `@tiptap/extension-link`: `^2.1.13`
  - `@tiptap/extension-placeholder`: `^2.1.13`
  - `@tiptap/extension-color` & `@tiptap/extension-text-style`: `^2.27.3`
  - `@tiptap/extension-highlight`: `^2.27.3`
  - `@tiptap/extension-font-family`: `^2.27.3`
  - `@tiptap/extension-text-align`: `^2.27.3`
  - `@tiptap/extension-table`, `table-row`, `table-header`, `table-cell`: `^2.27.3`
  - `@tiptap/extension-image`: `^2.27.3`
  - `@tiptap/extension-code-block-lowlight`: `^2.27.3` with `lowlight` `^2.9.0`
  - Custom extensions: `FontSize`, `InternalNoteLink`, `SlashCommands`

### 1.2 Root Cause Analysis of Existing Problems

#### A. Heading & List Commands Visual Failure (Tailwind Preflight Reset)
- **Problem**: Heading commands appeared not to work; bullet lists and numbered lists appeared as unindented plain text without bullets or numbers.
- **Root Cause**:
  1. Tailwind CSS Preflight (`@tailwind base`) resets all HTML headings (`h1-h6`) to `font-size: inherit; font-weight: inherit; margin: 0;`.
  2. Tailwind CSS Preflight resets all `ul` and `ol` to `list-style: none; margin: 0; padding: 0;`.
  3. `@tailwindcss/typography` was NOT installed in `package.json` nor configured in `tailwind.config.js`. The `prose` class applied in `NoteEditor.jsx` had zero effect.
  4. `index.css` had custom CSS for tables, task lists, code blocks, blockquotes, and hr, but **zero CSS rules** for `h1`, `h2`, `h3`, `ul`, `ol`, and `li`.
  5. As a result, when TipTap created semantic `<h1>` or `<ul><li>`, the browser rendered them as plain unstyled text without bullets or heading sizes.

#### B. Editor Reinitialization & Focus/Selection Loss on Auto-Save
- **Problem**: While typing or formatting, the cursor jumps to the start/end, text selection is lost, and the editor occasionally blurs or flickers.
- **Root Cause**:
  1. Controlled Component Anti-Pattern: In `NoteEditor.jsx`, an effect watched `initialContent` and compared `JSON.stringify(editor.getJSON()) !== JSON.stringify(initialContent)`.
  2. In `NoteEditorView.jsx`, every typing event triggered `handleContentChange(newJson)`.
  3. `useAutoSave` triggered `saveNote` after debounce.
  4. `useNote.js` received the Postgres API response and updated `note` state via `setNote(response.data)`.
  5. `NoteEditorView` received the updated `note` and ran `setContent(note.content)`.
  6. Because Postgres JSONB does not preserve JSON key order, `JSON.stringify(editor.getJSON()) !== JSON.stringify(initialContent)` evaluated to `true`.
  7. `editor.commands.setContent(initialContent)` was executed on every background save!
  8. `setContent()` destroys the ProseMirror cursor, selection, and history, causing visible jumps and destroying ongoing user interactions.

#### C. Focus Loss from Toolbar Button Clicks
- **Problem**: Clicking toolbar buttons or dropdowns caused the editor to lose focus and selection.
- **Root Cause**:
  - Toolbar buttons did not intercept `onMouseDown`. A standard browser mouse-down event transfers DOM focus to the button element, causing ProseMirror to blur and collapse its selection range before `onClick` fires.
  - Using `onMouseDown={(e) => e.preventDefault()}` on all toolbar buttons ensures the editor maintains active focus and selection throughout all formatting actions.

#### D. HeadingSelector Native `<select>` Focus Stealing
- **Problem**: The native `<select>` element in `HeadingSelector.jsx` took focus away from the editor, had mismatching heading levels (1-6 vs 1-3 configured in StarterKit), and caused selection loss.
- **Fix**: Rebuild heading selector as an accessible, custom dropdown with `onMouseDown={(e) => e.preventDefault()}`, clean visual indicators, and proper command chaining.

#### E. Auto-Save Race Conditions & Missing Save States
- **Problem**: Rapid sequential edits could lead to out-of-order saves; save status only had `idle`, `saving`, `saved`, `error`, lacking explicit `unsaved` state; navigation away could abandon pending edits.
- **Fix**: Re-architect `useAutoSave` with a state machine (`unsaved`, `saving`, `saved`, `error`), a queue/timestamp to drop stale responses, debounced 800–1000ms delay, and immediate flush on note navigation.

---

## 2. Upgrade Architecture & Implementation Plan

### Phase 2: Professional Editor Styling (CSS & Typography)
1. Add explicit, robust `.ProseMirror` styling in `index.css`:
   - Headings: `h1` (2rem, bold, tracking-tight), `h2` (1.5rem, semibold), `h3` (1.25rem, semibold).
   - Bullet lists: `ul:not([data-type="taskList"])` with `list-style-type: disc`, `padding-left: 1.5rem`, `margin: 0.5rem 0`.
   - Ordered lists: `ol` with `list-style-type: decimal`, `padding-left: 1.5rem`, `margin: 0.5rem 0`.
   - Nested lists: nested `ul` with `circle`/`square`, nested `ol` with `lower-alpha`/`lower-roman`, correct indentation.
   - List items: `li` with `margin: 0.25rem 0`, clean paragraph spacing.
   - Selection highlight: `.ProseMirror ::selection` with high-contrast accent.

### Phase 3: Toolbar Rebuild & Selection Preservation
1. Add `onMouseDown={(e) => e.preventDefault()}` to all buttons, menus, and dropdown triggers in `EditorToolbar.jsx`, `HeadingSelector.jsx`, and formatting popovers.
2. Upgrade `HeadingSelector`:
   - Replace native `<select>` with a polished custom dropdown or Radix dropdown.
   - Display active block type: "Paragraph", "Heading 1", "Heading 2", "Heading 3".
   - Support smooth transformation: Heading 1 $\leftrightarrow$ Heading 2 $\leftrightarrow$ Heading 3 $\leftrightarrow$ Paragraph.
3. Add tooltips with keyboard shortcuts for all buttons:
   - Bold: `Ctrl+B`
   - Italic: `Ctrl+I`
   - Underline: `Ctrl+U`
   - Strikethrough: `Ctrl+Shift+X`
   - Inline Code: `Ctrl+E`
   - Bullet List: `Ctrl+Shift+8`
   - Ordered List: `Ctrl+Shift+7`
   - Task List: `Ctrl+Shift+9`
   - Blockquote: `Ctrl+Shift+B`
   - Link: `Ctrl+K`

### Phase 4: Auto-Save Redesign & State Isolation
1. **Source of Truth Separation**:
   - TipTap Editor is the sole source of truth for the active document.
   - The server is purely a persistence layer.
   - Mounting strategy: Mount `<NoteEditor key={note.id} initialContent={note.content} />`.
   - When switching notes (`note.id`), the editor mounts fresh with the new note's content.
   - While editing the same note, `NoteEditor` NEVER re-syncs or calls `setContent()` from background auto-save responses.
2. **`useAutoSave` Enhancements**:
   - Debounce delay set to 1000ms.
   - States: `unsaved` $\rightarrow$ `saving` $\rightarrow$ `saved` (or `error`).
   - In-flight tracking: If edits occur while a save is in-flight, a subsequent save is automatically triggered once the in-flight request finishes.
   - Stale response guard: Save response never overwrites local editing state.
   - Navigation flush: When `noteId` changes or user leaves, flush pending changes for the active note immediately.
3. **Subtle Save Status Indicator**:
   - Unsaved: subtle dot with "Unsaved changes".
   - Saving: subtle pulsing dot with "Saving...".
   - Saved: subtle green dot with "Saved at HH:MM:SS".
   - Error: red dot with "Save failed" and retry button.
   - Zero layout shifts.

### Phase 5: Keyboard Shortcuts & List Editing Refinement
1. Verify Enter behavior:
   - Enter in list item: creates next item.
   - Enter twice in empty list item: lifts out of list into paragraph.
   - Backspace at start of empty list item: exits list into paragraph.
   - Tab / Shift+Tab in list items: indents (`sinkListItem`) and outdents (`liftListItem`).
2. Verify Headings:
   - Enter at end of Heading: creates a Paragraph.
   - Backspace at start of Heading: converts to Paragraph.

### Phase 6: Testing & Verification
1. Automated backend tests (`npm test --workspace=backend`).
2. Frontend lint check (`npm run lint --workspace=frontend`).
3. Frontend production build (`npm run build --workspace=frontend`).
4. End-to-end verification of headings, lists, formatting, selection stability, and auto-save.
5. Generate `NOTE_EDITOR_UPGRADE_REPORT.md`.
