import { NavLink } from 'react-router-dom';
import { BookOpen, Network, Search, Tag } from 'lucide-react';

const navItems = [
  { to: '/notes', label: 'Notes', icon: BookOpen },
  { to: '/graph', label: 'Graph', icon: Network },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/tags', label: 'Tags', icon: Tag },
];

/**
 * MobileBottomNavigation: Fixed, touch-friendly bottom navigation bar for mobile viewports.
 * Displays primary tabs with active route highlighting and safe-area inset support.
 */
export function MobileBottomNavigation() {
  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-30 md:hidden border-t border-border bg-card/95 backdrop-blur-md safe-pb"
    >
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-colors select-none ${
                  isActive
                    ? 'text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`flex items-center justify-center p-1 rounded-full transition-all ${
                      isActive ? 'bg-primary/10 text-primary scale-110' : ''
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="mt-0.5 tracking-tight">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
