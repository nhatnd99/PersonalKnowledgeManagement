import apiClient from '../../../services/apiClient.js';

/**
 * Service for Knowledge Graph API communication (/api/v1/graph).
 * Supports Root Workspace Graph, Folder-Scoped Graph, and general graph queries.
 */
export const graphService = {
  /**
   * Fetch Root Workspace Graph nodes and edges.
   *
   * @param {Object} [options={}]
   * @param {string} [options.relationshipType] - Filter relationship type
   * @param {boolean} [options.includeHierarchy] - Include parent-child hierarchy edges
   * @returns {Promise<{ scope: Object, nodes: Array, edges: Array, meta: Object }>}
   */
  async getRootGraph(options = {}) {
    const params = new URLSearchParams();
    if (options.relationshipType) params.append('relationshipType', options.relationshipType);
    if (options.includeHierarchy) params.append('includeHierarchy', 'true');

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`/graph/root${queryString}`);
    return response.data.data;
  },

  /**
   * Fetch Folder-Scoped Graph nodes and edges.
   *
   * @param {string} folderId - Folder UUID
   * @param {Object} [options={}]
   * @param {string} [options.relationshipType] - Filter relationship type
   * @param {boolean} [options.includeHierarchy] - Include parent-child hierarchy edges
   * @returns {Promise<{ scope: Object, nodes: Array, edges: Array, meta: Object }>}
   */
  async getFolderGraph(folderId, options = {}) {
    if (!folderId || folderId === 'root') {
      return this.getRootGraph(options);
    }

    const params = new URLSearchParams();
    if (options.relationshipType) params.append('relationshipType', options.relationshipType);
    if (options.includeHierarchy) params.append('includeHierarchy', 'true');

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`/graph/folders/${folderId}${queryString}`);
    return response.data.data;
  },

  /**
   * Fetch knowledge graph nodes and edges (legacy/flexible endpoint).
   *
   * @param {Object} [options={}]
   * @param {string} [options.folderId] - Scoped folder ID
   * @param {string} [options.rootId] - Center sub-graph around note UUID
   * @param {number} [options.depth] - Traversal depth
   * @param {string} [options.relationshipType] - Filter relationship type
   * @param {boolean} [options.includeHierarchy] - Include parent-child hierarchy edges
   * @returns {Promise<{ nodes: Array, edges: Array, totalNodes: number, totalEdges: number }>}
   */
  async getGraph(options = {}) {
    const params = new URLSearchParams();
    if (options.folderId) params.append('folderId', options.folderId);
    if (options.rootId) params.append('rootId', options.rootId);
    if (options.depth) params.append('depth', options.depth);
    if (options.relationshipType) params.append('relationshipType', options.relationshipType);
    if (options.includeHierarchy) params.append('includeHierarchy', 'true');

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`/graph${queryString}`);
    return response.data.data;
  },
};

