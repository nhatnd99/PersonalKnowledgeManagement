import apiClient from '../../../services/apiClient.js';

/**
 * Authentication and session API service.
 * Communicates with backend /api/v1/auth and /api/v1/users endpoints.
 */

export async function login({ email, password, rememberMe = false }) {
  const response = await apiClient.post('/auth/login', {
    email,
    password,
    rememberMe,
  });
  return response.data.data;
}

export async function register({ email, password, displayName }) {
  const response = await apiClient.post('/auth/register', {
    email,
    password,
    displayName,
  });
  return response.data.data;
}

export async function logout() {
  const response = await apiClient.post('/auth/logout');
  return response.data;
}

export async function logoutAll() {
  const response = await apiClient.post('/auth/logout-all');
  return response.data;
}

export async function getMe() {
  const response = await apiClient.get('/auth/me');
  return response.data.data?.user;
}

export async function forgotPassword({ email }) {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
}

export async function resetPassword({ token, newPassword }) {
  const response = await apiClient.post('/auth/reset-password', {
    token,
    newPassword,
  });
  return response.data;
}

export async function changePassword({ currentPassword, newPassword }) {
  const response = await apiClient.patch('/auth/change-password', {
    currentPassword,
    newPassword,
  });
  return response.data;
}

export async function getSessions() {
  const response = await apiClient.get('/auth/sessions');
  return response.data.data;
}

export async function revokeSession(sessionId) {
  const response = await apiClient.delete(`/auth/sessions/${sessionId}`);
  return response.data;
}

export async function updateProfile(data) {
  const response = await apiClient.patch('/users/me', data);
  return response.data.data;
}
