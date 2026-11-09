import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with clsx.
 * @param {...any} inputs - Class inputs
 * @returns {string} Merged class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Shared utility functions.
 * Keep these pure functions with no side effects.
 * Feature-specific utilities should live in their feature directory.
 */

/**
 * Formats a date string into a human-readable format.
 * @param {string|Date} date - ISO date string or Date object
 * @param {Intl.DateTimeFormatOptions} [options] - Intl format options
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(new Date(date));
}

/**
 * Formats a date as a relative time string (e.g., "2 hours ago").
 * @param {string|Date} date - ISO date string or Date object
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now - target;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

/**
 * Truncates a string to a maximum length, appending ellipsis if needed.
 * @param {string} str - Input string
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
export function truncate(str, maxLength = 100) {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength).trim() + '…';
}

/**
 * Debounces a function call.
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Generates a build-route path by substituting named parameters.
 * @param {string} route - Route template (e.g., '/notes/:noteId')
 * @param {Object} params - Parameter values
 * @returns {string} Resolved path
 */
export function buildPath(route, params = {}) {
  return Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`:${key}`, value),
    route
  );
}

/**
 * Checks if a value is a non-empty string.
 * @param {*} value
 * @returns {boolean}
 */
export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
