# UI Guidelines

## Design System

Knowledge App uses **Tailwind CSS** combined with accessible primitive patterns from **shadcn/ui (Radix UI)**.

## Visual Foundations

### Color Tokens (CSS Custom Properties)
Theme values are defined using HSL values in `src/index.css`:
- `--background`: Primary canvas color
- `--foreground`: Primary high-contrast typography
- `--primary`: Main accent for call-to-actions, active tree nodes, selection states
- `--muted`: Secondary background and subtext
- `--border`: Fine hairline borders for panel divisions
- `--destructive`: Warning and delete operations

### Typography
- Primary font: System native sans-serif stack for optimal rendering speed
- Monospace font: Code blocks, inline code, and technical identifiers
- Hierarchy:
  - Heading 1: 2rem (32px), bold
  - Heading 2: 1.5rem (24px), semibold
  - Heading 3: 1.25rem (20px), medium
  - Body: 0.9375rem (15px), normal line height 1.6
  - Caption / Metadata: 0.8125rem (13px), text-muted-foreground

## Layout Structure

Three-panel responsive desktop layout:

```
┌────────────────────────────────────────────────────────┐
│ App Header (Search bar, Quick Action, Settings)        │
├──────────────┬──────────────────────────┬──────────────┤
│ Sidebar      │ Main Content Area        │ Context      │
│ - Tree Nav   │ - Note Editor (TipTap)   │ - Backlinks  │
│ - Favorites  │ - Knowledge Graph Canvas │ - Outgoing   │
│ - Tags list  │   (React Flow)           │ - Tags / Meta│
└──────────────┴──────────────────────────┴──────────────┘
```

## Accessibility (a11y)
- Full keyboard navigation for note tree navigation (arrow keys, Enter to open)
- High-contrast visual focus indicators
- ARIA landmarks for sidebar navigation and main content regions
