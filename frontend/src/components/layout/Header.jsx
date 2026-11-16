import PropTypes from 'prop-types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Network, Search, Tag, Settings, FolderTree, LogOut } from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/useAuth.js';

/**
 * Application header with responsive navigation, folder drawer toggle, and quick actions.
 */
export function Header({ onToggleMobileDrawer }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navLinks = [
    { to: '/notes', label: 'Notes', icon: BookOpen },
    { to: '/graph', label: 'Knowledge Graph', icon: Network },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/tags', label: 'Tags', icon: Tag },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-3 sm:px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile Folder Hierarchy Drawer Button */}
        {onToggleMobileDrawer && (
          <button
            type="button"
            onClick={onToggleMobileDrawer}
            aria-label="Open folder hierarchy"
            title="Open folder hierarchy"
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <FolderTree className="h-5 w-5 text-primary" />
          </button>
        )}

        <Link to="/notes" className="flex items-center gap-2 font-bold text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm">
            K
          </span>
          <span className="text-base tracking-tight truncate max-w-[150px] sm:max-w-none">
            Knowledge App
          </span>
        </Link>

        {/* Desktop Navigation Tabs */}
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

      <div className="flex items-center gap-2 sm:gap-3">
        {user && (
          <Link
            to="/settings"
            className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted transition text-xs text-foreground"
            title="Account Settings"
          >
            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="hidden sm:inline-block font-medium truncate max-w-[120px]">
              {user.displayName || user.email}
            </span>
          </Link>
        )}

        <Link
          to="/settings"
          aria-label="Account Settings"
          title="Account Settings"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
        </Link>

        {user && (
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log Out"
            title="Log Out"
            className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
}

Header.propTypes = {
  onToggleMobileDrawer: PropTypes.func,
};
