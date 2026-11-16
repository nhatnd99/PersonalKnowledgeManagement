import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './authContextDef.js';
import * as authApi from '../api/authApi.js';

export { AuthContext };

/**
 * Global Authentication Context Provider.
 * Maintains authenticated user identity and persistent session status.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and restore session from HttpOnly cookie on page load / refresh
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authApi.getMe();
      setUser(currentUser);
      return currentUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials) => {
    const data = await authApi.login(credentials);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const data = await authApi.register(payload);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  const logoutAll = async () => {
    try {
      await authApi.logoutAll();
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (profileData) => {
    const updated = await authApi.updateProfile(profileData);
    setUser((prev) => (prev ? { ...prev, ...updated } : updated));
    return updated;
  };

  const changePassword = async (payload) => {
    return authApi.changePassword(payload);
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    logout,
    logoutAll,
    refreshUser,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};
