# Non-Functional Requirements

## NFR-01: Performance

| ID | Requirement |
|----|-------------|
| NFR-01.1 | Note list must load within 500ms for up to 1,000 notes |
| NFR-01.2 | Note content must load within 300ms |
| NFR-01.3 | Search must return results within 1 second |
| NFR-01.4 | Knowledge graph must render up to 200 nodes smoothly |
| NFR-01.5 | Auto-save must not interrupt the user typing experience |

## NFR-02: Scalability

| ID | Requirement |
|----|-------------|
| NFR-02.1 | Data model must support future multi-user mode without schema redesign |
| NFR-02.2 | Hierarchy traversal must not require recursive database queries by default |
| NFR-02.3 | Indexes must be defined for all common query patterns |

## NFR-03: Maintainability

| ID | Requirement |
|----|-------------|
| NFR-03.1 | Frontend must use feature-based modular architecture |
| NFR-03.2 | Backend must use domain-based modular architecture |
| NFR-03.3 | Business logic must be isolated in service layers |
| NFR-03.4 | Error handling must be centralized |
| NFR-03.5 | All public functions must have JSDoc documentation |

## NFR-04: Reliability

| ID | Requirement |
|----|-------------|
| NFR-04.1 | API must return consistent error response format |
| NFR-04.2 | Database connection failures must be handled gracefully |
| NFR-04.3 | The server must perform graceful shutdown on SIGTERM |
| NFR-04.4 | Auto-save failures must not result in data loss |

## NFR-05: Security

| ID | Requirement |
|----|-------------|
| NFR-05.1 | No sensitive credentials in source code |
| NFR-05.2 | CORS must be configured to allow only the frontend origin |
| NFR-05.3 | Helmet.js must be enabled for HTTP security headers |
| NFR-05.4 | Rate limiting must be applied to all API routes |
| NFR-05.5 | Environment variables must be used for all configurable secrets |

## NFR-06: Developer Experience

| ID | Requirement |
|----|-------------|
| NFR-06.1 | Frontend and backend must run independently |
| NFR-06.2 | Hot reload must be supported in development |
| NFR-06.3 | Environment configuration must use .env files |
| NFR-06.4 | ESLint must be configured for both frontend and backend |
