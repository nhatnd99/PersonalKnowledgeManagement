import axios from 'axios';

/**
 * Centralized Axios API client.
 *
 * All API requests in the application should use this client.
 * Do not create separate axios instances in feature modules.
 *
 * Configuration:
 * - Base URL is loaded from VITE_API_BASE_URL environment variable
 * - Default timeout: 15 seconds
 * - Default Content-Type: application/json
 *
 * Interceptors:
 * - Request interceptor: attach auth token when available (future)
 * - Response interceptor: normalize error responses
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  (config) => {
    // Future: attach authentication token
    // const token = getAuthToken();
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ─── Response Interceptor ────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => {
    // Return the data directly for convenience
    return response;
  },
  (error) => {
    // Normalize error structure for consistent handling in features
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
