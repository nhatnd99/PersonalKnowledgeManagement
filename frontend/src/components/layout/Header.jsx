import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Network, Search, Tag, Settings } from 'lucide-react';

/**
 * Application header with search shortcut, breadcrumbs placeholder, and primary navigation tabs.
 */
export function Header() {
  const location = useLocation();

  const navLinks = [
    { to: '/notes', label: 'Notes', icon: BookOpen },
    { to: '/graph', label: 'Knowledge Graph', icon: Network },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/tags', label: 'Tags', icon: Tag },
  ];

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <Link to="/notes" className="flex items-center gap-2 font-bold text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm">
            K
          </span>
          <span className="text-base tracking-tight">Knowledge App</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 pl-4">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-muted text-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          v0.1.0 • PostgreSQL
        </span>
        <button
          type="button"
          aria-label="Settings"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
