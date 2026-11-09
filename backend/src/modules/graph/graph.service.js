import { prisma } from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';

/**
 * Service generating Knowledge Graph data (nodes and edges) for graph visualization.
 * Supports both global legacy graphs and folder-scoped modular graphs.
 */

const NOTE_SELECT_FIELDS = {
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
};

/**
 * Traverses ancestors of a folder upwards to build a breadcrumb hierarchy.
 *
 * @param {string} folderId - Folder UUID
 * @returns {Promise<Array<{ id: string, title: string }>>} Breadcrumb chain from root to parent
 */
async function getFolderAncestors(folderId) {
  const ancestors = [];
  let currentId = folderId;
  const visited = new Set();

  while (currentId) {
    if (visited.has(currentId)) break; // cycle protection
    visited.add(currentId);

    const note = await prisma.note.findUnique({
      where: { id: currentId },
      select: { id: true, title: true, parentId: true },
    });

    if (!note || !note.parentId) break;

    const parent = await prisma.note.findUnique({
      where: { id: note.parentId },
      select: { id: true, title: true, parentId: true },
    });

    if (parent) {
      ancestors.unshift({ id: parent.id, title: parent.title });
      currentId = parent.id;
    } else {
      break;
    }
  }

  return ancestors;
}

/**
 * Retrieve a folder-scoped graph (or Root Graph).
 * Only direct children (and the current folder node if scoped) are included.
 *
 * @param {Object} options
 * @param {string} [options.folderId='root'] - Folder UUID or 'root'
 * @param {string} [options.relationshipType] - Filter by specific relationship type
 * @param {boolean} [options.includeHierarchy=false] - Whether to generate hierarchy edges
 * @returns {Promise<{ scope: Object, nodes: Array, edges: Array, meta: Object }>}
 */
export async function getFolderGraphData(options = {}) {
  const { folderId = 'root', relationshipType, includeHierarchy = false } = options;

  let currentFolder = null;
  let breadcrumbs = [{ id: 'root', title: 'Root' }];
  let directChildren = [];
  let scopeNodes = [];

  if (folderId === 'root' || !folderId) {
    // 1. Root Workspace Graph
    directChildren = await prisma.note.findMany({
      where: {
        parentId: null,
        archivedAt: null,
      },
      select: NOTE_SELECT_FIELDS,
      orderBy: [{ type: 'desc' }, { title: 'asc' }],
    });

    scopeNodes = directChildren;
  } else {
    // 2. Folder-Scoped Graph
    currentFolder = await prisma.note.findUnique({
      where: { id: folderId },
      select: NOTE_SELECT_FIELDS,
    });

    if (!currentFolder || currentFolder.archivedAt !== null) {
      throw new AppError(`Folder with ID ${folderId} not found`, 404);
    }

    if (currentFolder.type !== 'FOLDER') {
      throw new AppError(`Entity with ID ${folderId} is a NOTE, not a FOLDER`, 400);
    }

    const ancestors = await getFolderAncestors(folderId);
    breadcrumbs = [
      { id: 'root', title: 'Root' },
      ...ancestors,
      { id: currentFolder.id, title: currentFolder.title },
    ];

    directChildren = await prisma.note.findMany({
      where: {
        parentId: folderId,
        archivedAt: null,
      },
      select: NOTE_SELECT_FIELDS,
      orderBy: [{ type: 'desc' }, { title: 'asc' }],
    });

    // Scope contains the container folder itself plus its direct children
    scopeNodes = [currentFolder, ...directChildren];
  }

  const scopeNodeIds = new Set(scopeNodes.map((n) => n.id));

  // 3. Query all relationships connected to any node in scope
  // This allows finding both within-scope edges and calculating external connection counts
  const allConnectedRelationships = await prisma.noteRelationship.findMany({
    where: {
      OR: [
        { sourceNoteId: { in: Array.from(scopeNodeIds) } },
        { targetNoteId: { in: Array.from(scopeNodeIds) } },
      ],
      ...(relationshipType ? { relationshipType } : {}),
    },
    select: {
      id: true,
      sourceNoteId: true,
      targetNoteId: true,
      relationshipType: true,
      description: true,
    },
  });

  // 4. Calculate child counts for folders and external connection counts
  const childCounts = await prisma.note.groupBy({
    by: ['parentId'],
    where: {
      parentId: { in: Array.from(scopeNodeIds) },
      archivedAt: null,
    },
    _count: { id: true },
  });
  const childCountMap = new Map(childCounts.map((c) => [c.parentId, c._count.id]));

  const externalCountMap = new Map();
  for (const id of scopeNodeIds) {
    externalCountMap.set(id, 0);
  }

  // 5. Partition relationships into internal scope edges vs external connections
  const internalEdges = [];
  for (const rel of allConnectedRelationships) {
    const sourceInScope = scopeNodeIds.has(rel.sourceNoteId);
    const targetInScope = scopeNodeIds.has(rel.targetNoteId);

    if (sourceInScope && targetInScope) {
      internalEdges.push({
        id: rel.id,
        source: rel.sourceNoteId,
        target: rel.targetNoteId,
        relationshipType: rel.relationshipType,
        description: rel.description,
        isHierarchy: false,
      });
    } else {
      if (sourceInScope) {
        externalCountMap.set(rel.sourceNoteId, (externalCountMap.get(rel.sourceNoteId) || 0) + 1);
      }
      if (targetInScope) {
        externalCountMap.set(rel.targetNoteId, (externalCountMap.get(rel.targetNoteId) || 0) + 1);
      }
    }
  }

  // 6. Add hierarchy edges if requested
  const hierarchyEdges = [];
  if (includeHierarchy && currentFolder) {
    for (const child of directChildren) {
      hierarchyEdges.push({
        id: `hierarchy-${currentFolder.id}-${child.id}`,
        source: currentFolder.id,
        target: child.id,
        relationshipType: 'PARENT_OF',
        isHierarchy: true,
      });
    }
  }

  const allEdges = [...internalEdges, ...hierarchyEdges];

  // 7. Format nodes with metadata
  const formattedNodes = scopeNodes.map((node) => {
    const isCurrentScopeFolder = currentFolder && node.id === currentFolder.id;
    return {
      id: node.id,
      title: node.title,
      type: node.type,
      parentId: node.parentId,
      isFavorite: node.isFavorite,
      updatedAt: node.updatedAt,
      isScopeFolder: isCurrentScopeFolder,
      childCount: node.type === 'FOLDER' ? childCountMap.get(node.id) || 0 : 0,
      externalConnectionCount: externalCountMap.get(node.id) || 0,
      tags: (node.tags || []).map((nt) => nt.tag),
    };
  });

  const folderCount = formattedNodes.filter((n) => n.type === 'FOLDER').length;
  const noteCount = formattedNodes.filter((n) => n.type === 'NOTE').length;

  return {
    scope: {
      id: currentFolder ? currentFolder.id : 'root',
      title: currentFolder ? currentFolder.title : 'Root Workspace',
      type: currentFolder ? 'FOLDER' : 'ROOT',
      breadcrumbs,
    },
    nodes: formattedNodes,
    edges: allEdges,
    meta: {
      totalNodes: formattedNodes.length,
      totalEdges: allEdges.length,
      internalEdgesCount: internalEdges.length,
      hierarchyEdgesCount: hierarchyEdges.length,
      folderCount,
      noteCount,
    },
  };
}

/**
 * Get knowledge graph data formatted for graph layout engines (e.g. React Flow).
 * Retained for backward compatibility with existing tests and global views.
 *
 * @param {Object} [options={}] - Graph options
 * @param {string} [options.rootId] - Optional root note UUID for localized sub-graph
 * @param {string} [options.folderId] - Optional folder UUID for scoped folder graph
 * @param {number} [options.depth=1] - Traversal depth for localized sub-graph
 * @param {string} [options.relationshipType] - Filter by specific relationship type
 * @param {boolean} [options.includeHierarchy=false] - Whether to include parent-child hierarchy edges
 * @returns {Promise<{ nodes: Array, edges: Array, totalNodes: number, totalEdges: number }>}
 */
export async function getGraphData(options = {}) {
  const { rootId, folderId, depth = 1, relationshipType, includeHierarchy = false } = options;

  // If folderId is explicitly provided, delegate to folder-scoped graph service
  if (folderId) {
    return getFolderGraphData({
      folderId,
      relationshipType,
      includeHierarchy,
    });
  }

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
