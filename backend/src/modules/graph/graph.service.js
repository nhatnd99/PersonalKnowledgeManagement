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
  archivedAt: true,
  updatedAt: true,
  tags: {
    include: {
      tag: {
        select: { id: true, name: true, color: true },
      },
    },
  },
};

async function findNoteRecord(where, options = {}) {
  if (typeof prisma.note?.findFirst === 'function') {
    return prisma.note.findFirst({ where, ...options });
  }
  if (typeof prisma.note?.findUnique === 'function' && where.id) {
    const record = await prisma.note.findUnique({ where: { id: where.id }, ...options });
    if (record && where.userId && record.userId && record.userId !== where.userId) {
      return null;
    }
    return record;
  }
  return null;
}

/**
 * Traverses ancestors of a folder upwards to build a breadcrumb hierarchy.
 *
 * @param {string} folderId - Folder UUID
 * @returns {Promise<Array<{ id: string, title: string }>>} Breadcrumb chain from root to parent
 */
async function getFolderAncestors(folderId, userId = null) {
  const ancestors = [];
  let currentId = folderId;
  const visited = new Set();

  while (currentId) {
    if (visited.has(currentId)) break; // cycle protection
    visited.add(currentId);

    const noteWhere = { id: currentId };
    if (userId) noteWhere.userId = userId;

    const note = await findNoteRecord(noteWhere, {
      select: { id: true, title: true, parentId: true },
    });

    if (!note || !note.parentId) break;

    const parentWhere = { id: note.parentId };
    if (userId) parentWhere.userId = userId;

    const parent = await findNoteRecord(parentWhere, {
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
 * Recursively collects all descendant notes and folders under a parent.
 *
 * @param {string} parentId - Parent note/folder UUID
 * @returns {Promise<Array>} List of all descendants at all depths
 */
export async function getAllDescendantEntities(parentId) {
  const directChildren = await prisma.note.findMany({
    where: { parentId, archivedAt: null },
    select: NOTE_SELECT_FIELDS,
    orderBy: [{ type: 'desc' }, { title: 'asc' }],
  });

  const allDescendants = [...directChildren];
  for (const child of directChildren) {
    const subChildren = await getAllDescendantEntities(child.id);
    allDescendants.push(...subChildren);
  }
  return allDescendants;
}

/**
 * List all folders with their child counts and hierarchy paths.
 *
 * @param {string} [userId] - Authenticated user UUID
 * @returns {Promise<{ folders: Array, total: number }>}
 */
export async function listAllFolders(userId = null) {
  const where = { type: 'FOLDER', archivedAt: null };
  if (userId) where.userId = userId;

  const folders = await prisma.note.findMany({
    where,
    select: {
      id: true,
      title: true,
      parentId: true,
      updatedAt: true,
    },
    orderBy: { title: 'asc' },
  });

  const countWhere = { archivedAt: null };
  if (userId) countWhere.userId = userId;

  const childCounts = await prisma.note.groupBy({
    by: ['parentId'],
    where: countWhere,
    _count: { id: true },
  });
  const countMap = new Map(childCounts.map((c) => [c.parentId, c._count.id]));

  const enrichedFolders = [];
  for (const folder of folders) {
    const ancestors = await getFolderAncestors(folder.id, userId);
    const path = ['Root', ...ancestors.map((a) => a.title), folder.title].join(' > ');

    enrichedFolders.push({
      id: folder.id,
      title: folder.title,
      parentId: folder.parentId,
      childCount: countMap.get(folder.id) || 0,
      path,
      updatedAt: folder.updatedAt,
    });
  }

  return { folders: enrichedFolders, total: enrichedFolders.length };
}

/**
 * Retrieve a folder-scoped graph (or Root Graph).
 * When a folder is specified, includes the Central Folder node and ALL its descendants at any depth.
 *
 * @param {Object} options
 * @param {string} [options.folderId='root'] - Folder UUID or 'root'
 * @param {string} [options.relationshipType] - Filter by specific relationship type
 * @param {boolean} [options.includeHierarchy=false] - Whether to generate hierarchy edges
 * @param {boolean} [options.includeKnowledge=true] - Whether to include semantic knowledge edges
 * @param {boolean} [options.includeExternal=true] - Whether to include external endpoint nodes
 * @param {string} [userId] - Authenticated user UUID
 * @returns {Promise<{ scope: Object, nodes: Array, edges: Array, meta: Object }>}
 */
export async function getFolderGraphData(options = {}, userId = null) {
  const {
    folderId = 'root',
    relationshipType,
    includeHierarchy = false,
    includeKnowledge = true,
    includeExternal = true,
  } = options;

  const shouldIncludeKnowledge = Boolean(includeKnowledge);
  const shouldIncludeExternal = folderId !== 'root' && Boolean(includeExternal) && shouldIncludeKnowledge;

  let currentFolder = null;
  let breadcrumbs = [{ id: 'root', title: 'Root' }];
  let descendants = [];
  let scopeNodes = [];

  if (folderId === 'root' || !folderId) {
    // 1. Root Workspace Graph: top-level items
    const rootWhere = {
      parentId: null,
      archivedAt: null,
    };
    if (userId) rootWhere.userId = userId;

    descendants = await prisma.note.findMany({
      where: rootWhere,
      select: NOTE_SELECT_FIELDS,
      orderBy: [{ type: 'desc' }, { title: 'asc' }],
    });

    scopeNodes = descendants;
  } else {
    // 2. Folder-Centric Graph
    const folderWhere = { id: folderId };
    if (userId) folderWhere.userId = userId;

    currentFolder = await findNoteRecord(folderWhere, {
      select: NOTE_SELECT_FIELDS,
    });

    if (!currentFolder || currentFolder.archivedAt) {
      throw new AppError(`Folder with ID ${folderId} not found`, 404);
    }

    if (currentFolder.type !== 'FOLDER') {
      throw new AppError(`Entity with ID ${folderId} is a NOTE, not a FOLDER`, 400);
    }

    const ancestors = await getFolderAncestors(folderId, userId);
    breadcrumbs = [
      { id: 'root', title: 'Root' },
      ...ancestors,
      { id: currentFolder.id, title: currentFolder.title },
    ];

    // Fetch direct children under this folder (immediate notes and subfolders)
    const childWhere = {
      parentId: folderId,
      archivedAt: null,
    };
    if (userId) childWhere.userId = userId;

    descendants = await prisma.note.findMany({
      where: childWhere,
      select: NOTE_SELECT_FIELDS,
      orderBy: [{ type: 'desc' }, { title: 'asc' }],
    });

    // Scope contains the container folder itself (Central Node) plus direct children
    scopeNodes = [currentFolder, ...descendants];
  }

  const scopeNodeIds = new Set(scopeNodes.map((n) => n.id));

  // 3. Query all relationships connected to any node in scope
  const relWhere = {
    OR: [
      { sourceNoteId: { in: Array.from(scopeNodeIds) } },
      { targetNoteId: { in: Array.from(scopeNodeIds) } },
    ],
  };
  if (userId) relWhere.userId = userId;
  if (relationshipType) relWhere.relationshipType = relationshipType;

  const allConnectedRelationships = await prisma.noteRelationship.findMany({
    where: relWhere,
    select: {
      id: true,
      sourceNoteId: true,
      targetNoteId: true,
      relationshipType: true,
      description: true,
    },
  });

  // 4. Calculate child counts for folders and external connection counts
  const childGroupWhere = {
    parentId: { in: Array.from(scopeNodeIds) },
    archivedAt: null,
  };
  if (userId) childGroupWhere.userId = userId;

  const childCounts = await prisma.note.groupBy({
    by: ['parentId'],
    where: childGroupWhere,
    _count: { id: true },
  });
  const childCountMap = new Map(childCounts.map((c) => [c.parentId, c._count.id]));

  const externalCountMap = new Map();
  for (const id of scopeNodeIds) {
    externalCountMap.set(id, 0);
  }

  // 5. Partition relationships into internal scope edges vs external connections
  const internalEdges = [];
  const externalEdges = [];
  const externalNodeIds = new Set();

  for (const rel of allConnectedRelationships) {
    const sourceInScope = scopeNodeIds.has(rel.sourceNoteId);
    const targetInScope = scopeNodeIds.has(rel.targetNoteId);

    if (sourceInScope && targetInScope) {
      if (shouldIncludeKnowledge) {
        internalEdges.push({
          id: rel.id,
          source: rel.sourceNoteId,
          target: rel.targetNoteId,
          relationshipType: rel.relationshipType,
          description: rel.description,
          isHierarchy: false,
          isExternal: false,
        });
      }
    } else {
      if (sourceInScope) {
        externalCountMap.set(rel.sourceNoteId, (externalCountMap.get(rel.sourceNoteId) || 0) + 1);
        externalNodeIds.add(rel.targetNoteId);
        if (shouldIncludeExternal) {
          externalEdges.push({
            id: rel.id,
            source: rel.sourceNoteId,
            target: rel.targetNoteId,
            relationshipType: rel.relationshipType,
            description: rel.description,
            isHierarchy: false,
            isExternal: true,
          });
        }
      }
      if (targetInScope) {
        externalCountMap.set(rel.targetNoteId, (externalCountMap.get(rel.targetNoteId) || 0) + 1);
        externalNodeIds.add(rel.sourceNoteId);
        if (shouldIncludeExternal) {
          externalEdges.push({
            id: rel.id,
            source: rel.sourceNoteId,
            target: rel.targetNoteId,
            relationshipType: rel.relationshipType,
            description: rel.description,
            isHierarchy: false,
            isExternal: true,
          });
        }
      }
    }
  }

  // 6. Fetch external nodes if requested and present
  let externalNodes = [];
  if (shouldIncludeExternal && externalNodeIds.size > 0) {
    const extWhere = {
      id: { in: Array.from(externalNodeIds) },
      archivedAt: null,
    };
    if (userId) extWhere.userId = userId;

    const externalRecords = await prisma.note.findMany({
      where: extWhere,
      select: {
        id: true,
        title: true,
        type: true,
        parentId: true,
        updatedAt: true,
      },
    });

    externalNodes = externalRecords.map((node) => ({
      id: node.id,
      title: node.title,
      type: node.type,
      parentId: node.parentId,
      isFavorite: false,
      isScopeFolder: false,
      isCentralNode: false,
      isExternal: true,
      childCount: 0,
      externalConnectionCount: 0,
      tags: [],
    }));
  }

  // 7. Add hierarchy edges if requested
  const hierarchyEdges = [];
  if (includeHierarchy && currentFolder) {
    for (const node of descendants) {
      if (node.parentId && scopeNodeIds.has(node.parentId)) {
        hierarchyEdges.push({
          id: `hierarchy-${node.parentId}-${node.id}`,
          source: node.parentId,
          target: node.id,
          relationshipType: 'PARENT_OF',
          isHierarchy: true,
          isExternal: false,
        });
      }
    }
  }

  const allEdges = [...internalEdges, ...hierarchyEdges, ...externalEdges];

  // 8. Format nodes with metadata
  const formattedScopeNodes = scopeNodes.map((node) => {
    const isCurrentScopeFolder = currentFolder && node.id === currentFolder.id;
    return {
      id: node.id,
      title: node.title,
      type: node.type,
      parentId: node.parentId,
      isFavorite: node.isFavorite,
      updatedAt: node.updatedAt,
      isScopeFolder: isCurrentScopeFolder,
      isCentralNode: isCurrentScopeFolder,
      isExternal: false,
      childCount: node.type === 'FOLDER' ? childCountMap.get(node.id) || 0 : 0,
      externalConnectionCount: externalCountMap.get(node.id) || 0,
      tags: (node.tags || []).map((nt) => nt.tag),
    };
  });

  const allNodes = [...formattedScopeNodes, ...externalNodes];
  const folderCount = formattedScopeNodes.filter((n) => n.type === 'FOLDER').length;
  const noteCount = formattedScopeNodes.filter((n) => n.type === 'NOTE').length;

  return {
    scope: {
      id: currentFolder ? currentFolder.id : 'root',
      title: currentFolder ? currentFolder.title : 'Root Workspace',
      type: currentFolder ? 'FOLDER' : 'ROOT',
      breadcrumbs,
    },
    nodes: allNodes,
    edges: allEdges,
    metadata: {
      nodeCount: allNodes.length,
      edgeCount: allEdges.length,
      folderCount,
      noteCount,
    },
    meta: {
      totalNodes: allNodes.length,
      scopeNodesCount: formattedScopeNodes.length,
      externalNodesCount: externalNodes.length,
      totalEdges: allEdges.length,
      internalEdgesCount: internalEdges.length,
      hierarchyEdgesCount: hierarchyEdges.length,
      externalEdgesCount: externalEdges.length,
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
export async function getGraphData(options = {}, userId = null) {
  const {
    rootId,
    folderId,
    depth = 1,
    relationshipType,
    includeHierarchy = false,
    includeKnowledge = true,
    includeExternal = true,
  } = options;

  // If folderId is explicitly provided, delegate to folder-scoped graph service
  if (folderId) {
    return getFolderGraphData({
      folderId,
      relationshipType,
      includeHierarchy,
      includeKnowledge,
      includeExternal,
    }, userId);
  }

  // 1. Fetch non-archived notes
  const noteWhere = { archivedAt: null };
  if (userId) noteWhere.userId = userId;

  const notes = await prisma.note.findMany({
    where: noteWhere,
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
  if (userId) relWhere.userId = userId;
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
