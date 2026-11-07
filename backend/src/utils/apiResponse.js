/**
 * Standard API response helpers.
 * Use these to ensure consistent response shapes across all endpoints.
 *
 * Response format:
 * {
 *   success: boolean,
 *   message: string,
 *   data: any,          // present on success
 *   errors: array,      // present on error
 *   meta: object,       // optional pagination metadata
 * }
 */

/**
 * Send a successful response.
 * @param {import('express').Response} res - Express response object
 * @param {*} data - Response data payload
 * @param {string} [message] - Optional success message
 * @param {number} [statusCode=200] - HTTP status code
 * @param {Object} [meta=null] - Optional metadata
 */
export function sendSuccess(res, data, message = 'Success', statusCode = 200, meta = null) {
  const payload = {
    success: true,
    message,
    data,
  };
  if (meta) {
    payload.meta = meta;
  }
  return res.status(statusCode).json(payload);
}

/**
 * Send a successful response with pagination metadata.
 * @param {import('express').Response} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} meta - Pagination metadata
 * @param {string} [message] - Optional success message
 */
export function sendPaginatedSuccess(res, data, meta, message = 'Success') {
  return sendSuccess(res, data, message, 200, buildPaginationMeta(meta.total, meta.page, meta.limit));
}

/**
 * Helper to build standard pagination meta object.
 * @param {number} total
 * @param {number} page
 * @param {number} limit
 * @returns {Object}
 */
export function buildPaginationMeta(total, page, limit) {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Send a 201 Created response.
 * @param {import('express').Response} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} [message] - Optional success message
 */
export function sendCreated(res, data, message = 'Created successfully') {
  return sendSuccess(res, data, message, 201);
}

/**
 * Send a 204 No Content response.
 * @param {import('express').Response} res - Express response object
 */
export function sendNoContent(res) {
  return res.status(204).send();
}
