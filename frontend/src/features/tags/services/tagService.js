import apiClient from '../../../services/apiClient.js';

/**
 * Service for Tags API communication (/api/v1/tags).
 */
export const tagService = {
  /**
   * List all tags with note counts.
   * @returns {Promise<Array>}
   */
  async getTags() {
    const response = await apiClient.get('/tags');
    return response.data.data;
  },

  /**
   * Get single tag by ID with notes.
   * @param {string} tagId
   * @returns {Promise<Object>}
   */
  async getTagById(tagId) {
    const response = await apiClient.get(`/tags/${tagId}`);
    return response.data.data;
  },

  /**
   * Create a new tag.
   * @param {Object} data
   * @param {string} data.name
   * @param {string} [data.color]
   * @param {string} [data.description]
   * @returns {Promise<Object>}
   */
  async createTag(data) {
    const response = await apiClient.post('/tags', data);
    return response.data.data;
  },

  /**
   * Update an existing tag.
   * @param {string} tagId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async updateTag(tagId, data) {
    const response = await apiClient.patch(`/tags/${tagId}`, data);
    return response.data.data;
  },

  /**
   * Delete a tag.
   * @param {string} tagId
   * @returns {Promise<void>}
   */
  async deleteTag(tagId) {
    await apiClient.delete(`/tags/${tagId}`);
  },

  /**
   * Assign tag to a note.
   * @param {string} noteId
   * @param {string} tagId
   * @returns {Promise<Object>}
   */
  async assignTag(noteId, tagId) {
    const response = await apiClient.post(`/notes/${noteId}/tags`, { tagId });
    return response.data.data;
  },

  /**
   * Remove tag from a note.
   * @param {string} noteId
   * @param {string} tagId
   * @returns {Promise<void>}
   */
  async removeTag(noteId, tagId) {
    await apiClient.delete(`/notes/${noteId}/tags/${tagId}`);
  },
};
