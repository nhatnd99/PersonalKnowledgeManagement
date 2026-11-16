import PropTypes from 'prop-types';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Loader2 } from 'lucide-react';

/**
 * Route wrapper that prevents authenticated users from viewing guest-only auth pages (Login/Register).
 */
export function GuestRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    const destination = location.state?.from?.pathname || '/notes';
    return <Navigate to={destination} replace />;
  }

  return children ? children : <Outlet />;
}

GuestRoute.propTypes = {
  children: PropTypes.node,
};
