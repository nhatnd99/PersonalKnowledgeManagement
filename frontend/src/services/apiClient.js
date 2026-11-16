import axios from 'axios';

/**
 * Centralized Axios API client.
 *
 * All API requests in the application should use this client.
 * Do not create separate axios instances in feature modules.
 *
 * Configuration:
 * - Base URL is loaded from VITE_API_BASE_URL environment variable (defaults to /api/v1)
 * - Default timeout: 15 seconds
 * - withCredentials: true ensures HttpOnly session cookies are transmitted automatically
 * - Default Content-Type: application/json
 */
const rawBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const baseURL = rawBaseURL.replace(/\/+$/, '');

const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ─── Response Interceptor ────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Normalize error structure for consistent handling across frontend features
    const normalizedError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      status: error.response?.status,
      errors: error.response?.data?.errors || [],
      originalError: error,
    };

    return Promise.reject(normalizedError);
  }
);

export default apiClient;
