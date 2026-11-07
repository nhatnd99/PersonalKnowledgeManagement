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
 */
export function sendSuccess(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Send a successful response with pagination metadata.
 * @param {import('express').Response} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} meta - Pagination metadata
 * @param {number} meta.total - Total number of items
 * @param {number} meta.page - Current page number
 * @param {number} meta.limit - Items per page
 * @param {string} [message] - Optional success message
 */
export function sendPaginatedSuccess(res, data, meta, message = 'Success') {
  const { total, page, limit } = meta;
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
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
