# Backend Architecture

## Approach: Domain-Based Modular Architecture

Each business domain is a self-contained module with separated responsibilities.

## Directory Structure

```
src/
├── modules/                     # Business domain modules
│   ├── notes/
│   │   ├── note.model.js        # Mongoose schema + model
│   │   ├── note.controller.js   # HTTP handler (req/res)
│   │   ├── note.service.js      # Business logic
│   │   ├── note.routes.js       # Route definitions
│   │   ├── note.validation.js   # express-validator rules
│   │   └── note.test.js         # Module tests
│   ├── hierarchy/
│   ├── relationships/
│   ├── backlinks/
│   ├── tags/
│   ├── search/
│   └── users/
│
├── config/
│   ├── database.js              # MongoDB connection
│   └── env.js                   # Environment config
│
├── middlewares/
│   ├── errorHandler.js          # Global error handler + AppError
│   └── validateRequest.js       # express-validator result checker
│
├── utils/
│   └── apiResponse.js           # Response helpers
│
├── constants/
│   └── index.js                 # Backend constants
│
├── app.js                       # Express app factory
└── server.js                    # HTTP server entry point
```

## Layer Responsibilities

| Layer | File | Responsibility |
|-------|------|---------------|
| Model | `*.model.js` | Schema definition, indexes, Mongoose model |
| Controller | `*.controller.js` | Parse request, call service, send response |
| Service | `*.service.js` | Business logic, DB operations, validation rules |
| Routes | `*.routes.js` | URL mapping, middleware chain, controller binding |
| Validation | `*.validation.js` | express-validator rule arrays |

## Rules

### 1. No Business Logic in Controllers
Controllers only:
- Extract data from `req`
- Call the appropriate service method
- Send the response using `apiResponse` helpers

### 2. Services Own Business Logic
Services:
- Execute DB queries via Mongoose models
- Enforce business rules (e.g., prevent circular hierarchy)
- Throw `AppError` for operational errors

### 3. Centralized Error Handling
- Use `AppError` class for all operational errors
- `globalErrorHandler` middleware handles all error types
- Never send raw error objects to the client

### 4. Response Format
All responses follow the standard format:
```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "meta": null
}
```

### 5. Validation
- Use `express-validator` for input validation in `*.validation.js`
- Use `validateRequest` middleware to check results
- Return field-level errors to the client

## Module Registration
New modules are registered in `app.js`:
```javascript
app.use('/api/notes', noteRoutes);
app.use('/api/relationships', relationshipRoutes);
```
