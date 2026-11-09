import * as graphService from './graph.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

/**
 * Controller handling HTTP requests for the knowledge graph.
 */

/**
 * Get Root Graph (top-level folders and notes).
 * GET /api/v1/graph/root
 */
export async function getRootGraphHandler(req, res) {
  const { relationshipType, includeHierarchy } = req.query;

  const graphData = await graphService.getFolderGraphData({
    folderId: 'root',
    relationshipType,
    includeHierarchy: includeHierarchy === 'true' || includeHierarchy === true,
  });

  return sendSuccess(res, graphData, 'Root graph data retrieved successfully');
}

/**
 * Get Folder Graph scoped to a specific folder.
 * GET /api/v1/graph/folders/:folderId
 */
export async function getFolderGraphHandler(req, res) {
  const { folderId } = req.params;
  const { relationshipType, includeHierarchy } = req.query;

  const graphData = await graphService.getFolderGraphData({
    folderId,
    relationshipType,
    includeHierarchy: includeHierarchy === 'true' || includeHierarchy === true,
  });

  return sendSuccess(res, graphData, 'Folder graph data retrieved successfully');
}

/**
 * Get graph nodes and edges (supports legacy queries as well as ?folderId=...).
 * GET /api/v1/graph
 */
export async function getGraphHandler(req, res) {
  const { rootId, folderId, depth, relationshipType, includeHierarchy } = req.query;

  if (folderId) {
    const graphData = await graphService.getFolderGraphData({
      folderId,
      relationshipType,
      includeHierarchy: includeHierarchy === 'true' || includeHierarchy === true,
    });
    return sendSuccess(res, graphData, 'Folder graph data retrieved successfully');
  }

  const graphData = await graphService.getGraphData({
    rootId,
    depth: depth ? parseInt(depth, 10) : undefined,
    relationshipType,
    includeHierarchy: includeHierarchy === 'true' || includeHierarchy === true,
  });

  return sendSuccess(res, graphData, 'Graph data retrieved successfully');
}

