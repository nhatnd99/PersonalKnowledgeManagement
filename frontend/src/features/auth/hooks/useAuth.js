import { useContext } from 'react';
import { AuthContext } from '../context/authContextDef.js';

/**
 * Hook to consume the authentication context.
 *
 * @returns {Object} Auth state and action methods
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
