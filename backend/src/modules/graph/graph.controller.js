import * as graphService from './graph.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

/**
 * Controller handling HTTP requests for the knowledge graph.
 */

/**
 * Get graph nodes and edges.
 * GET /api/v1/graph
 */
export async function getGraphHandler(req, res) {
  const { rootId, depth, relationshipType, includeHierarchy } = req.query;

  const graphData = await graphService.getGraphData({
    rootId,
    depth: depth ? parseInt(depth, 10) : undefined,
    relationshipType,
    includeHierarchy: includeHierarchy === 'true' || includeHierarchy === true,
  });

  return sendSuccess(res, graphData, 'Graph data retrieved successfully');
}
