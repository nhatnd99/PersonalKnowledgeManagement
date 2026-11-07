import apiClient from '../../../services/apiClient.js';

/**
 * Service for Knowledge Graph API communication (/api/v1/graph).
 */
export const graphService = {
  /**
   * Fetch knowledge graph nodes and edges.
   *
   * @param {Object} [options={}]
   * @param {string} [options.rootId] - Center sub-graph around note UUID
   * @param {number} [options.depth] - Traversal depth
   * @param {string} [options.relationshipType] - Filter relationship type
   * @param {boolean} [options.includeHierarchy] - Include parent-child hierarchy edges
   * @returns {Promise<{ nodes: Array, edges: Array, totalNodes: number, totalEdges: number }>}
   */
  async getGraph(options = {}) {
    const params = new URLSearchParams();
    if (options.rootId) params.append('rootId', options.rootId);
    if (options.depth) params.append('depth', options.depth);
    if (options.relationshipType) params.append('relationshipType', options.relationshipType);
    if (options.includeHierarchy) params.append('includeHierarchy', 'true');

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`/graph${queryString}`);
    return response.data.data;
  },
};
