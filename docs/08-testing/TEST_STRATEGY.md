# Test Strategy

## 1. Testing Philosophy

A feature is not considered complete without accompanying automated tests. Tests verify domain rules, edge cases, error conditions, and API compliance.

---

## 2. Testing Levels

### Unit Tests
- **Target**: Domain services and pure utilities (`note.service.js`, circular reference check algorithm).
- **Location**: `backend/tests/unit/` or beside domain modules (`*.test.js`).
- **Tooling**: Jest with Native ES Modules support.

### Integration Tests
- **Target**: HTTP API endpoints end-to-end (route -> validation -> controller -> service -> database).
- **Location**: `backend/tests/integration/`.
- **Tooling**: Supertest + in-memory MongoDB / isolated test database.

---

## 3. Test Execution Commands

From `backend/`:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with code coverage report
npm run test:coverage
```
