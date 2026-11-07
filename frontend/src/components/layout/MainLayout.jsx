import { Outlet } from 'react-router-dom';
import { Header } from './Header.jsx';
import { Sidebar } from './Sidebar.jsx';

/**
 * Main application shell with Top Header, Collapsible Left Sidebar, and Content Area.
 */
export function MainLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
