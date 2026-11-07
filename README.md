# Knowledge App

A Personal Knowledge Management (PKM) web application that empowers users to capture, organize, connect, navigate, and explore personal knowledge.

---

## Core Principles

- **Notes are the center of the entire application.**
- **Hierarchy and relationships are independent**:
  - `parentId` governs tree hierarchy.
  - `NoteRelationship` governs directional graph connections.
  - Moving notes within the folder hierarchy never alters or breaks knowledge graph relationships.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, shadcn/ui (Radix UI) |
| **Routing** | React Router v6 |
| **Rich Text Editor** | TipTap (ProseMirror JSON stored in PostgreSQL `JSONB`) |
| **Knowledge Graph** | React Flow (`reactflow`) |
| **HTTP Client** | Axios (centralized client with `/api/v1` prefix) |
| **Backend** | Node.js (ES Modules), Express.js |
| **ORM** | Prisma ORM (v5.22.0) |
| **Database** | PostgreSQL (Local development & Neon managed PostgreSQL) |
| **Testing** | Jest with native ES Modules, Supertest |

---

## Monorepo Structure

```
knowledge-app/
├── frontend/          # React SPA (Vite + Tailwind + TipTap + React Flow)
│   ├── README.md      # Frontend setup & run documentation
│   ├── src/           # Features (notes, hierarchy, relationships, graph, search, tags)
│   └── package.json
├── backend/           # Express.js REST API + Prisma ORM
│   ├── README.md      # Backend setup, API endpoints & database guide
│   ├── prisma/        # schema.prisma, seed.js
│   ├── src/           # Modules (notes, relationships, tags, search, graph, export, users)
│   └── package.json
├── docs/              # 25-document comprehensive architecture suite
├── .agent/            # Master Orchestrator, Gap Analysis, Checklist, Logs
├── AGENTS.md          # Architectural rules and agent instructions
└── package.json       # Monorepo workspace configuration
```

---

## ⚡ Quick Start: How to Setup & Start Frontend and Backend

Follow these 4 simple steps to get both backend and frontend running locally:

### Step 1: Install Dependencies
From the repository root:
```bash
npm run install:all
```

### Step 2: Configure Environment Variables
Create the `.env` files for both backend and frontend:

**Backend (`backend/.env`):**
```bash
# Copy from example
cp backend/.env.example backend/.env
```
Ensure your PostgreSQL connection string is set in `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/knowledge_app?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/knowledge_app?schema=public"
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**Frontend (`frontend/.env`):**
```bash
# Copy from example
cp frontend/.env.example frontend/.env
```
Ensure the API URL points to the backend in `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### Step 3: Initialize Database (Prisma)
Run migrations and seed the sample knowledge base:
```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed sample folders, notes, tags, and relationships
npm run prisma:seed
```

### Step 4: Start Frontend and Backend Servers
Open two terminal tabs:

**Terminal 1 — Backend Server:**
```bash
npm run dev:backend
```
👉 Backend API will run on **`http://localhost:3000/api/v1`** (Health check: `http://localhost:3000/health`)

**Terminal 2 — Frontend App:**
```bash
npm run dev:frontend
```
👉 Frontend Web UI will run on **`http://localhost:5173`**

---

## Dedicated Component Guides

For detailed, independent guides, see:
- 📘 [**Frontend README** (`frontend/README.md`)](./frontend/README.md) — Independent frontend setup, UI architecture, TipTap editor, and React Flow knowledge graph.
- 📙 [**Backend README** (`backend/README.md`)](./backend/README.md) — Independent backend setup, PostgreSQL database options (Local / Neon), Prisma Studio, and complete REST API endpoint reference.

---

## Getting Started & Local Development Details

### 1. Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** (local instance or free cloud database on [Neon](https://neon.tech))

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd PersonalKnowledgeManagement

# Install all dependencies across both workspaces
npm run install:all
```

### 3. Environment Configuration

#### Backend Configuration
Copy `backend/.env.example` to `backend/.env`:
```bash
# Local PostgreSQL configuration:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/knowledge_app?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/knowledge_app?schema=public"

PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```
*(If using Neon PostgreSQL, paste your pooled `DATABASE_URL` and direct `DIRECT_URL` provided in your Neon dashboard).*

#### Frontend Configuration
Copy `frontend/.env.example` to `frontend/.env`:
```bash
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME="Knowledge App"
VITE_APP_VERSION=0.2.0
VITE_ENABLE_KNOWLEDGE_GRAPH=true
VITE_ENABLE_DEBUG_MODE=false
```

### 4. Database Setup & Seeding

```bash
# Generate the Prisma Client
npm run prisma:generate

# Apply migrations to your database
npm run prisma:migrate

# Seed sample knowledge base (folders, notes, tags, and relationships)
npm run prisma:seed
```

### 5. Starting the Development Servers

In two separate terminals (or using the monorepo dev script):

```bash
# Start backend API server (runs on http://localhost:3000)
npm run dev:backend

# Start frontend Vite dev server (runs on http://localhost:5173)
npm run dev:frontend
```

Once started:
- **Frontend Web UI**: `http://localhost:5173`
- **Backend API Root**: `http://localhost:3000/api/v1`
- **Backend Health Check**: `http://localhost:3000/health`

---

## Automated Verification & Testing

```bash
# Run ESLint across frontend and backend workspaces (0 warnings, 0 errors)
npm run lint

# Run all 7 Jest backend test suites (49 tests pass)
npm test

# Build frontend production bundle with Vite
npm run build
```

---

## Manual UI Testing Guide

When testing locally in the browser (`http://localhost:5173`):

### 1. Note CRUD & Rich-Text Editing
1. Click **New Note** or **New Folder** in the sidebar.
2. Edit the note title in the header input.
3. Use the TipTap editor toolbar to add headings, bold/italic text, task lists, and code blocks.
4. Verify that formatting persists accurately after page refresh.

### 2. Auto-Save & Save Status
1. Type changes into the editor or title.
2. Observe the auto-save indicator badge transitioning from **"Saving..."** to **"Saved at HH:mm"** after the 1500ms debounce.
3. Navigate to another note; any pending edits flush immediately before routing.

### 3. Folder & Note Hierarchy (Drag and Drop)
1. Drag a note and drop it onto a folder in the sidebar tree.
2. Drop it onto the root area to move it to the root level.
3. Observe breadcrumbs at the top of the editor reflecting the updated ancestor path.
4. Note that reparenting never produces circular loops.

### 4. Knowledge Connections & Backlinks
1. In the note editor, click the **Connections** button or scroll to the bottom connections section.
2. Click **Add Connection**, pick a target note, and select a relationship type (`DEPENDS_ON`, `REFERENCES`, `EXTENDS`, `CONTRADICTS`, `RELATED_TO`).
3. Click the target note link to navigate to it; verify that the original note appears in the **Backlinks** panel.
4. Delete a relationship and verify immediate removal.

### 5. Search, Tags & Discovery
1. In the note editor, click **Add Tag** on the tag chip bar to select an existing tag or type a new tag with custom color.
2. Navigate to **Tags** (`/tags`) to see all tags with note count badges and edit/delete options.
3. Navigate to **Search** (`/search`) to search notes by keywords, filter by note vs folder, or click tag filter pills.

### 6. Knowledge Graph Visualization
1. Navigate to **Graph** (`/graph`) in the navigation bar.
2. Pan, zoom, and explore the interactive multi-ring node layout.
3. Use the floating **Graph View** toolbar to filter edges by relationship type or toggle **Hierarchy Links**.
4. Click any node to open the slide-out inspector drawer and click **Open Note in Editor**.

### 7. Import & Export
1. On any note, click the **Export MD** button in the header toolbar to download a clean `.md` file containing YAML frontmatter and connections.
2. Use the backend `/api/v1/notes/:id/export?format=json` endpoint to export a portable JSON backup.

---

## Documentation

Full architectural documentation is maintained in the [`docs/`](./docs/) directory:

- [System Architecture](./docs/03-architecture/SYSTEM_ARCHITECTURE.md)
- [Frontend Architecture](./docs/03-architecture/FRONTEND_ARCHITECTURE.md)
- [Backend Architecture](./docs/03-architecture/BACKEND_ARCHITECTURE.md)
- [Database Schema](./docs/04-database/DATABASE_SCHEMA.md)
- [API Specification](./docs/05-api/API_SPECIFICATION.md)
- [Development Roadmap](./docs/07-development/DEVELOPMENT_ROADMAP.md)
- [Deployment Guide](./docs/09-deployment/DEPLOYMENT_GUIDE.md)

---

## Status & Quality Gates

✅ **Complete & Verified (Phases 0 through 9)**
- **Lint**: 0 errors, 0 warnings (`npm run lint`).
- **Tests**: 49/49 passing tests across 7 suites (`npm test`).
- **Build**: Vite production build succeeded (1603 modules transformed).
