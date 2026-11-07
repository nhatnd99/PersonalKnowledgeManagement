import apiClient from '../../../services/apiClient.js';

/**
 * Service for full-text and filtered note search (/api/v1/search).
 */
export const searchService = {
  /**
   * Search notes matching query string, tag, type, and favorite status.
   *
   * @param {Object} [params={}]
   * @param {string} [params.q]
   * @param {string} [params.tag]
   * @param {string} [params.type]
   * @param {boolean} [params.isFavorite]
   * @param {number} [params.page]
   * @param {number} [params.limit]
   * @returns {Promise<{ notes: Array, meta: Object }>}
   */
  async searchNotes(params = {}) {
    const response = await apiClient.get('/search', { params });
    return {
      notes: response.data.data,
      meta: response.data.meta,
    };
  },
};
