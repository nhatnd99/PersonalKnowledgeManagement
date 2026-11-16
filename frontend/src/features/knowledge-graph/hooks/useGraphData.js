import { useState, useEffect, useRef, useCallback } from 'react';
import { graphService } from '../services/graphService.js';

/**
 * Custom hook to fetch and manage Knowledge Graph data for a given scope.
 * Guarantees race-condition protection when switching folders rapidly.
 *
 * @param {string} folderId - Folder UUID or 'root'
 * @param {Object} options - Query options
 * @param {string} [options.relationshipType] - Filter by relationship type
 * @param {boolean} [options.includeHierarchy=true] - Include hierarchy edges
 * @param {boolean} [options.includeKnowledge=true] - Include semantic knowledge edges
 * @param {boolean} [options.includeExternal=true] - Include external connected nodes
 * @returns {Object} Graph state and reload helper
 */
export function useGraphData(folderId, options = {}) {
  const {
    relationshipType,
    includeHierarchy = true,
    includeKnowledge = true,
    includeExternal = true,
  } = options;

  const [scopeData, setScopeData] = useState(null);
  const [rawNodes, setRawNodes] = useState([]);
  const [rawEdges, setRawEdges] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Request tracker to discard stale responses from previous folder switches
  const requestIdRef = useRef(0);

  const fetchGraph = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const data = await graphService.getFolderGraph(folderId, {
        relationshipType: relationshipType || undefined,
        includeHierarchy,
        includeKnowledge,
        includeExternal,
      });

      // Ignore if a newer fetch request was initiated
      if (currentRequestId !== requestIdRef.current) return;

      setScopeData(data.scope || null);
      setRawNodes(data.nodes || []);
      setRawEdges(data.edges || []);
      setMetadata(data.metadata || data.meta || null);
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) return;

      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to load graph data';
      setError(errorMessage);
      setScopeData(null);
      setRawNodes([]);
      setRawEdges([]);
      setMetadata(null);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [folderId, relationshipType, includeHierarchy, includeKnowledge, includeExternal]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  return {
    scopeData,
    rawNodes,
    rawEdges,
    metadata,
    isLoading,
    error,
    reload: fetchGraph,
  };
}
