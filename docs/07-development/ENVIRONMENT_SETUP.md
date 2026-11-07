# Environment Setup

## Prerequisites

- **Node.js**: Version >= 18.0.0
- **npm**: Version >= 9.0.0
- **MongoDB**: Local MongoDB instance or MongoDB Atlas connection URI
- **OS**: Windows, macOS, or Linux

---

## Workspace Setup

### 1. Install Dependencies

In the monorepo root:
```bash
npm run install:all
```
Or individually:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment Variables

**Backend (`backend/.env`)**:
Copy from `backend/.env.example`:
```ini
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/knowledge-app
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=debug
```

**Frontend (`frontend/.env`)**:
Copy from `frontend/.env.example`:
```ini
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=Knowledge App
VITE_ENABLE_KNOWLEDGE_GRAPH=true
```

---

## Running in Development

Run backend:
```bash
npm run dev:backend
# Starts Express server at http://localhost:3000 with node --watch
```

Run frontend:
```bash
npm run dev:frontend
# Starts Vite dev server at http://localhost:5173
```
