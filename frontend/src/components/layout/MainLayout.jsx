import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header.jsx';
import { Sidebar } from './Sidebar.jsx';
import { MobileFolderDrawer } from './MobileFolderDrawer.jsx';
import { MobileBottomNavigation } from './MobileBottomNavigation.jsx';

/**
 * Main application shell with Desktop Navigation, Tablet Adaptations,
 * Mobile Header with Hierarchy Drawer toggle, and Mobile Bottom Navigation.
 */
export function MainLayout() {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer whenever navigation changes
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header onToggleMobileDrawer={() => setIsMobileDrawerOpen((prev) => !prev)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar (hidden on mobile) */}
        <Sidebar />

        {/* Main Content Area (with bottom padding on mobile for bottom navigation) */}
        <main className="flex-1 overflow-y-auto bg-background/50 pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Hierarchy Drawer */}
      <MobileFolderDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
      />

      {/* Mobile Fixed Bottom Navigation */}
      <MobileBottomNavigation />
    </div>
  );
}
