# Contributing to Knowledge App

Thank you for your interest in contributing to Knowledge App!

## Development Philosophy

- **Notes are the center** — every feature should serve note management
- **Simplicity over complexity** — avoid over-engineering
- **Documentation first** — update docs before or alongside code
- **Test business logic** — write tests for services and utilities

## Branch Strategy

Follow the Git workflow documented in [GIT_WORKFLOW.md](./docs/07-development/GIT_WORKFLOW.md).

| Branch | Purpose |
|--------|---------|
| `main` | Stable, production-ready code |
| `develop` | Integration branch for features |
| `feature/*` | New features |
| `fix/*` | Bug fixes |
| `docs/*` | Documentation updates |

## Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**
```
feat(notes): add auto-save functionality
fix(hierarchy): prevent circular parent references
docs(api): update note endpoints specification
```

## Code Standards

See [CODING_STANDARDS.md](./docs/07-development/CODING_STANDARDS.md) for detailed standards.

Key rules:
- Use ES6+ JavaScript (no TypeScript)
- Use `.js` and `.jsx` file extensions
- Follow feature-based frontend architecture
- Follow modular domain backend architecture
- Write JSDoc comments for public functions
- Use `async/await` over raw Promises
- Handle errors explicitly

## Pull Request Process

1. Create a branch from `develop`
2. Implement changes following the coding standards
3. Write or update tests
4. Update relevant documentation
5. Submit a pull request to `develop`
6. Request review

## AI Agent Contributors

AI agents must read [AGENTS.md](./AGENTS.md) before making any changes.
