# Frontend Architecture

## Approach: Feature-Based Modular Architecture

Each domain feature is self-contained with its own components, hooks, services, and utilities.

## Directory Structure

```
src/
├── features/                    # Domain features (primary code location)
│   ├── notes/
│   │   ├── components/          # Note-specific React components
│   │   ├── hooks/               # Note-specific hooks (useNote, useNoteEditor)
│   │   ├── services/            # Note API calls (noteService.js)
│   │   ├── constants/           # Note-specific constants
│   │   └── utils/               # Note-specific utilities
│   ├── hierarchy/
│   ├── relationships/
│   ├── backlinks/
│   ├── tags/
│   ├── search/
│   └── knowledge-graph/
│
├── components/                  # Shared, reusable components
│   ├── common/                  # Generic UI: Button, Input, Modal, Badge
│   ├── layout/                  # App shell: Sidebar, Header, MainLayout
│   └── ui/                      # shadcn/ui component wrappers
│
├── services/
│   └── apiClient.js             # Centralized Axios instance
│
├── hooks/                       # Shared hooks (useDebounce, useLocalStorage)
├── stores/                      # Global state (future: Zustand or Context)
├── routes/
│   └── AppRoutes.jsx            # Central route definitions
├── utils/                       # Shared pure utility functions
├── constants/                   # App-wide constants
├── App.jsx                      # Root component (providers + routing)
└── main.jsx                     # React DOM entry point
```

## Rules

### 1. API Communication
- All HTTP calls go through `services/apiClient.js` (Axios instance)
- Feature services import `apiClient`, not raw `axios`
- UI components do NOT make direct API calls

### 2. Component Responsibility
- **Feature components**: business-specific UI, use feature hooks
- **Common components**: generic, reusable, no business logic
- **Layout components**: application shell structure

### 3. State Management (MVP)
- Local state: `useState`, `useReducer`
- Server state: custom hooks wrapping service calls
- Global state: React Context (introduce only when needed)
- Future: evaluate Zustand for complex state

### 4. Import Aliases
Configured in `vite.config.js`:
- `@/` -> `src/`
- `@components/` -> `src/components/`
- `@features/` -> `src/features/`
- `@services/` -> `src/services/`
- `@hooks/` -> `src/hooks/`
- `@utils/` -> `src/utils/`
- `@constants/` -> `src/constants/`

### 5. Routing
- Centralized in `src/routes/AppRoutes.jsx`
- Do not define routes inside feature components

## Component Naming Conventions
| Type | Convention | Example |
|------|-----------|---------|
| Feature component | PascalCase | `NoteEditor.jsx` |
| Shared component | PascalCase | `Button.jsx` |
| Hook | camelCase with `use` prefix | `useNote.js` |
| Service | camelCase with `Service` suffix | `noteService.js` |
| Constants | UPPER_SNAKE_CASE values | `NOTE_TYPES.NOTE` |
