# Development Roadmap

## Project Phases

| Phase | Title | Scope | Status |
|-------|-------|-------|--------|
| **Phase 0** | **Foundation** | Project structure, documentation, Monorepo config, schemas, entry points | ✅ Completed |
| **Phase 1** | **Core Note System** | CRUD notes & folders, TipTap rich text, auto-save engine | 📋 Ready to implement |
| **Phase 2** | **Hierarchical Organization** | Tree view sidebar, drag-and-drop, reordering, circular reference check | 📋 Planned |
| **Phase 3** | **Knowledge Connections** | Directional typed relationships, backlinks panel, relationship cleanup | 📋 Planned |
| **Phase 4** | **Knowledge Discovery** | Search API & UI, tags management, favorites, recent notes | 📋 Planned |
| **Phase 5** | **Knowledge Graph** | React Flow visual canvas, interactive nodes, edge styling, local graph filter | 📋 Planned |
| **Phase 6+**| **Authentication & Platform**| User authentication, authorization, export/import (Markdown, JSON) | 🔮 Future |

---

## Phase 1 Implementation Plan (Next Immediate Step)

1. **Backend Note Module**:
   - `note.validation.js`: Validation rules for note creation and updating.
   - `note.service.js`: Note CRUD business logic.
   - `note.controller.js`: Request/response handling.
   - `note.routes.js`: Express routes registered in `app.js`.
   - `note.test.js`: Unit & integration tests.

2. **Frontend Note Feature**:
   - `useNote.js` & `useAutoSave.js`: State hooks managing active note and debounce saving.
   - `NoteEditor.jsx`: TipTap editor integration.
   - `Sidebar.jsx`: Notes listing and note creation buttons.
