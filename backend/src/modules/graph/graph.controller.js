import * as graphService from './graph.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

/**
 * Controller handling HTTP requests for the knowledge graph.
 * Enforces authenticated user scoping.
 */

/**
 * List all folders with their child counts and hierarchy paths.
 * GET /api/v1/graph/folders
 */
export async function listFoldersHandler(req, res) {
  const result = await graphService.listAllFolders(req.user?.id);
  return sendSuccess(res, result, 'Folders retrieved successfully');
}

/**
 * Get Root Graph (top-level folders and notes).
 * GET /api/v1/graph/root
 */
export async function getRootGraphHandler(req, res) {
  const { relationshipType, includeHierarchy, includeKnowledge, includeExternal } = req.query;

  const graphData = await graphService.getFolderGraphData(
    {
      folderId: 'root',
      relationshipType,
      includeHierarchy: includeHierarchy === 'true' || includeHierarchy === true,
      includeKnowledge: includeKnowledge !== undefined ? (includeKnowledge === 'true' || includeKnowledge === true) : true,
      includeExternal: includeExternal !== undefined ? (includeExternal === 'true' || includeExternal === true) : true,
    },
    req.user?.id
  );

  return sendSuccess(res, graphData, 'Root graph data retrieved successfully');
}

/**
 * Get Folder Graph scoped to a specific folder.
 * GET /api/v1/graph/folders/:folderId
 */
export async function getFolderGraphHandler(req, res) {
  const { folderId } = req.params;
  const { relationshipType, includeHierarchy, includeKnowledge, includeExternal } = req.query;

  const graphData = await graphService.getFolderGraphData(
    {
      folderId,
      relationshipType,
      includeHierarchy: includeHierarchy === 'true' || includeHierarchy === true,
      includeKnowledge: includeKnowledge !== undefined ? (includeKnowledge === 'true' || includeKnowledge === true) : true,
      includeExternal: includeExternal !== undefined ? (includeExternal === 'true' || includeExternal === true) : true,
    },
    req.user?.id
  );

  return sendSuccess(res, graphData, 'Folder graph data retrieved successfully');
}

/**
 * Get graph nodes and edges (supports legacy queries as well as ?folderId=...).
 * GET /api/v1/graph
 */
export async function getGraphHandler(req, res) {
  const { rootId, folderId, depth, relationshipType, includeHierarchy, includeKnowledge, includeExternal } = req.query;

  const graphData = await graphService.getGraphData(
    {
      rootId,
      folderId,
      depth: depth ? parseInt(depth, 10) : undefined,
      relationshipType,
      includeHierarchy: includeHierarchy === 'true' || includeHierarchy === true,
      includeKnowledge: includeKnowledge !== undefined ? (includeKnowledge === 'true' || includeKnowledge === true) : true,
      includeExternal: includeExternal !== undefined ? (includeExternal === 'true' || includeExternal === true) : true,
    },
    req.user?.id
  );

  return sendSuccess(res, graphData, 'Graph data retrieved successfully');
}
