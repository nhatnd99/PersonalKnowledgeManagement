# Knowledge App — Frontend

The client-side single page application (SPA) for the Personal Knowledge Management system, built with React 18, Vite, Tailwind CSS, TipTap rich text editor, and React Flow.

---

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- Running backend API server (defaults to `http://localhost:3000/api/v1`)

---

## 1. Setup & Installation

From the repository root:
```bash
# Option A: From root using workspace command
npm install --workspace=frontend

# Option B: Navigate to frontend directory directly
cd frontend
npm install
```

---

## 2. Environment Configuration

Copy `.env.example` to `.env` inside the `frontend/` folder:

```bash
cp .env.example .env
```

Contents of `frontend/.env`:
```env
# URL of the backend REST API
VITE_API_BASE_URL=http://localhost:3000/api/v1

# Application metadata
VITE_APP_NAME="Knowledge App"
VITE_APP_VERSION=0.2.0

# Feature flags
VITE_ENABLE_KNOWLEDGE_GRAPH=true
VITE_ENABLE_DEBUG_MODE=false
```

---

## 3. Start Frontend Development Server

```bash
# If inside frontend/ directory:
npm run dev

# Or from repository root:
npm run dev:frontend
```

The frontend will be available at:
👉 **`http://localhost:5173`**

---

## 4. Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite development server with Hot Module Replacement (HMR) |
| `npm run build` | Compiles and bundles production-ready assets to `dist/` |
| `npm run preview` | Serves the production build locally for testing on `http://localhost:4173` |
| `npm run lint` | Runs ESLint across all `.js` and `.jsx` files (0 warnings allowed) |
| `npm run lint:fix` | Automatically fixes auto-fixable lint issues |

---

## 5. Key Architecture & Features

- **Note Editor**: [`src/features/notes/components/NoteEditor.jsx`](./src/features/notes/components/NoteEditor.jsx) (TipTap with ProseMirror JSON).
- **Auto-Save Engine**: [`src/features/notes/hooks/useAutoSave.js`](./src/features/notes/hooks/useAutoSave.js) (1500ms debounce + navigation flush).
- **Hierarchy Tree**: [`src/features/hierarchy/components/HierarchyTree.jsx`](./src/features/hierarchy/components/HierarchyTree.jsx) (drag-and-drop reparenting).
- **Knowledge Graph**: [`src/features/knowledge-graph/components/KnowledgeGraphView.jsx`](./src/features/knowledge-graph/components/KnowledgeGraphView.jsx) (React Flow interactive canvas).
- **Connections & Backlinks**: [`src/features/relationships/`](./src/features/relationships/) and [`src/features/backlinks/`](./src/features/backlinks/).
- **Search & Discovery**: [`src/features/search/`](./src/features/search/) and [`src/features/tags/`](./src/features/tags/).
