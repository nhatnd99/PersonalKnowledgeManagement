# Test Strategy (PostgreSQL & Prisma)

## 1. Testing Philosophy
Test business rules, hierarchy constraints, cycle detection, relationship cascades, and API contracts thoroughly before declaring a phase complete.

---

## 2. Testing Levels

### Unit Tests (Service Layer)
- **Target**: Business logic in `*.service.js` (e.g. cycle detection algorithm during note moves, reparenting logic, cascade calculations).
- **Location**: `backend/tests/unit/` or beside module files (`*.test.js`).
- **Prisma Mocking**: Unit tests mock PrismaClient calls using `jest.mock` or a lightweight test harness, avoiding slow physical database calls for pure logic checks.

### Integration Tests (API Endpoints)
- **Target**: REST API endpoints under `/api/v1/*` end-to-end.
- **Location**: `backend/tests/integration/`.
- **Tooling**: Supertest against Express app factory (`createApp()`) connected to a dedicated test PostgreSQL database or transactional schema.

---

## 3. Priority Test Matrix for Note Module (Phase 1)

| Area | Test Scenario | Expected Outcome |
|------|---------------|------------------|
| **Validation** | Create note with valid title & type | `201 Created` with valid UUID |
| **Validation** | Create note with missing title | `400 Bad Request` with field error |
| **Validation** | Create note with invalid UUID parentId | `400 Bad Request` with field error |
| **Query** | Retrieve note by UUID | `200 OK` with JSONB content intact |
| **Query** | Retrieve non-existent UUID | `404 Not Found` |
| **Hierarchy** | Move note to valid new parent | `200 OK` with updated `parentId` |
| **Hierarchy** | Move note into its own descendant (cycle) | `400 Bad Request` "Circular reference detected" |
| **Hierarchy** | Move note to itself | `400 Bad Request` |
| **Deletion** | Delete note (default `cascade=false`) | Direct children promoted to parent; note deleted |
| **Deletion** | Delete note (`cascade=true`) | Descendant notes recursively deleted |
| **Graph Cascade** | Delete note with active relationships | Associated `note_relationships` rows deleted automatically |

---

## 4. Test Execution Commands

From monorepo root:
```bash
# Run backend test suite
npm test

# Run tests in watch mode
npm run test:watch --workspace=backend

# Run tests with coverage report
npm run test:coverage --workspace=backend
```
