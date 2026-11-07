# Knowledge App

A Personal Knowledge Management (PKM) web application that allows users to capture, organize, connect, navigate, and explore personal knowledge.

## Core Concept

Notes are the center of the entire application. The application provides two complementary knowledge organization models:

1. **Hierarchical Tree Structure** — Parent-child note relationships with unlimited depth
2. **Knowledge Graph Structure** — Independent relationships between any notes

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS, shadcn/ui |
| Routing | React Router |
| Rich Text | TipTap Editor |
| Graph | React Flow |
| HTTP Client | Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| ODM | Mongoose |

## Monorepo Structure

```
knowledge-app/
├── frontend/          # React application
├── backend/           # Express.js API server
├── docs/              # Project documentation
├── AGENTS.md          # AI agent collaboration guidelines
└── package.json       # Root monorepo configuration
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB (local or Atlas)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd knowledge-app

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install
```

### Configuration

1. Copy `backend/.env.example` to `backend/.env` and configure your MongoDB URI
2. Copy `frontend/.env.example` to `frontend/.env` and configure the API URL

### Development

```bash
# Start backend (from backend/ directory)
npm run dev

# Start frontend (from frontend/ directory)
npm run dev
```

## Documentation

See the [`docs/`](./docs/) directory for complete documentation:

- [Project Overview](./docs/01-project-overview/PROJECT_OVERVIEW.md)
- [Architecture](./docs/03-architecture/SYSTEM_ARCHITECTURE.md)
- [API Specification](./docs/05-api/API_SPECIFICATION.md)
- [Development Roadmap](./docs/07-development/DEVELOPMENT_ROADMAP.md)
- [Environment Setup](./docs/07-development/ENVIRONMENT_SETUP.md)

## AI Agent Collaboration

See [AGENTS.md](./AGENTS.md) for guidelines on how AI agents should interact with this codebase.

## Status

🚧 **Phase 0: Foundation** — Project initialization and architecture setup in progress.

See [CHANGELOG.md](./CHANGELOG.md) for version history.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.
