import apiClient from '../../../services/apiClient.js';

/**
 * Service for Knowledge Relationships API calls.
 */
export const relationshipService = {
  /**
   * Get all relationships for a note.
   * @param {string} noteId
   * @param {Object} [options]
   * @param {'both'|'incoming'|'outgoing'} [options.direction='both']
   * @param {string} [options.type]
   * @returns {Promise<Object>} { note, outgoing, incoming, total }
   */
  async getNoteRelationships(noteId, options = {}) {
    const params = new URLSearchParams();
    if (options.direction) params.append('direction', options.direction);
    if (options.type) params.append('type', options.type);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`/notes/${noteId}/relationships${queryString}`);
    return response.data.data;
  },

  /**
   * Create a new directional relationship.
   * @param {Object} payload
   * @param {string} payload.sourceNoteId
   * @param {string} payload.targetNoteId
   * @param {string} payload.relationshipType
   * @param {string} [payload.description]
   * @returns {Promise<Object>} Created relationship
   */
  async createRelationship(payload) {
    const response = await apiClient.post('/relationships', payload);
    return response.data.data;
  },

  /**
   * Delete a relationship by ID.
   * @param {string} relationshipId
   * @returns {Promise<void>}
   */
  async deleteRelationship(relationshipId) {
    await apiClient.delete(`/relationships/${relationshipId}`);
  },

  /**
   * List all relationships (e.g. for global graph).
   * @param {Object} [filter]
   * @returns {Promise<Array>}
   */
  async listAll(filter = {}) {
    const response = await apiClient.get('/relationships', { params: filter });
    return response.data.data;
  },
};
