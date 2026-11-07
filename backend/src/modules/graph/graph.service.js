import { prisma } from '../../config/database.js';

/**
 * Service generating Knowledge Graph data (nodes and edges) for graph visualization.
 */

/**
 * Get knowledge graph data formatted for graph layout engines (e.g. React Flow).
 *
 * @param {Object} [options={}] - Graph options
 * @param {string} [options.rootId] - Optional root note UUID for localized sub-graph
 * @param {number} [options.depth=1] - Traversal depth for localized sub-graph
 * @param {string} [options.relationshipType] - Filter by specific relationship type
 * @param {boolean} [options.includeHierarchy=false] - Whether to include parent-child hierarchy edges
 * @returns {Promise<{ nodes: Array, edges: Array, totalNodes: number, totalEdges: number }>}
 */
export async function getGraphData(options = {}) {
  const { rootId, depth = 1, relationshipType, includeHierarchy = false } = options;

  // 1. Fetch non-archived notes
  const notes = await prisma.note.findMany({
    where: { archivedAt: null },
    select: {
      id: true,
      title: true,
      type: true,
      parentId: true,
      isFavorite: true,
      updatedAt: true,
      tags: {
        include: {
          tag: {
            select: { id: true, name: true, color: true },
          },
        },
      },
    },
  });

  const noteMap = new Map(notes.map((n) => [n.id, n]));

  // 2. Fetch relationships
  const relWhere = {};
  if (relationshipType) {
    relWhere.relationshipType = relationshipType;
  }

  const relationships = await prisma.noteRelationship.findMany({
    where: relWhere,
    select: {
      id: true,
      sourceNoteId: true,
      targetNoteId: true,
      relationshipType: true,
      description: true,
    },
  });

  // 3. Build adjacency list for localized traversal if rootId is specified
  let includedNodeIds = new Set(notes.map((n) => n.id));

  if (rootId && noteMap.has(rootId)) {
    includedNodeIds = new Set([rootId]);
    let currentQueue = [rootId];

    // Build undirected adjacency graph for local hop discovery
    const neighbors = new Map();
    for (const rel of relationships) {
      if (!neighbors.has(rel.sourceNoteId)) neighbors.set(rel.sourceNoteId, new Set());
      if (!neighbors.has(rel.targetNoteId)) neighbors.set(rel.targetNoteId, new Set());
      neighbors.get(rel.sourceNoteId).add(rel.targetNoteId);
      neighbors.get(rel.targetNoteId).add(rel.sourceNoteId);
    }

    if (includeHierarchy) {
      for (const note of notes) {
        if (note.parentId) {
          if (!neighbors.has(note.id)) neighbors.set(note.id, new Set());
          if (!neighbors.has(note.parentId)) neighbors.set(note.parentId, new Set());
          neighbors.get(note.id).add(note.parentId);
          neighbors.get(note.parentId).add(note.id);
        }
      }
    }

    for (let d = 0; d < depth; d++) {
      const nextQueue = [];
      for (const nodeId of currentQueue) {
        const adjacent = neighbors.get(nodeId);
        if (adjacent) {
          for (const nextId of adjacent) {
            if (!includedNodeIds.has(nextId) && noteMap.has(nextId)) {
              includedNodeIds.add(nextId);
              nextQueue.push(nextId);
            }
          }
        }
      }
      currentQueue = nextQueue;
    }
  }

  // 4. Format nodes
  const nodes = [];
  for (const nodeId of includedNodeIds) {
    const note = noteMap.get(nodeId);
    if (!note) continue;

    nodes.push({
      id: note.id,
      title: note.title,
      type: note.type,
      parentId: note.parentId,
      isFavorite: note.isFavorite,
      updatedAt: note.updatedAt,
      tags: note.tags.map((nt) => nt.tag),
    });
  }

  // 5. Format edges
  const edges = [];

  for (const rel of relationships) {
    if (includedNodeIds.has(rel.sourceNoteId) && includedNodeIds.has(rel.targetNoteId)) {
      edges.push({
        id: rel.id,
        source: rel.sourceNoteId,
        target: rel.targetNoteId,
        relationshipType: rel.relationshipType,
        description: rel.description,
        isHierarchy: false,
      });
    }
  }

  // Include hierarchy edges if requested
  if (includeHierarchy) {
    for (const note of nodes) {
      if (note.parentId && includedNodeIds.has(note.parentId)) {
        edges.push({
          id: `hierarchy-${note.id}`,
          source: note.parentId,
          target: note.id,
          relationshipType: 'PARENT_OF',
          isHierarchy: true,
        });
      }
    }
  }

  return {
    nodes,
    edges,
    totalNodes: nodes.length,
    totalEdges: edges.length,
  };
}
