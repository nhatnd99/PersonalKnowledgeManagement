# Git Workflow

## Branching Strategy

```
main          ────────●─────────● (Stable releases)
                      │         ▲
develop       ────────●───●─────● (Integration)
                          │     ▲
feature/notes-crud        └──●──┘
```

- `main`: Production-ready, fully verified stable code.
- `develop`: Integration branch for tested features.
- `feature/*`: Dedicated branches for distinct features (e.g. `feature/tiptap-editor`, `feature/graph-canvas`).
- `fix/*`: Bug fixes addressing specific defects.

---

## Commit Message Conventions

Use Conventional Commits format:

```
<type>(<scope>): <short description>

[optional body explaining reason and architectural trade-offs]
```

### Supported Types:
- `feat`: New feature addition.
- `fix`: Bug fix.
- `docs`: Documentation addition or changes.
- `refactor`: Code refactoring without changing observable behavior.
- `test`: Adding or updating test suites.
- `chore`: Dependency updates, tooling, or scaffolding changes.

### Examples:
- `feat(notes): implement TipTap rich text auto-save`
- `fix(hierarchy): prevent circular reference when reparenting notes`
- `docs(database): document composite indexes for relationships`
