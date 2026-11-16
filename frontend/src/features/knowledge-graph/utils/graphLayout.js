/**
 * Graph layout engine for Knowledge App.
 * Computes deterministic, collision-safe 2D positions for nodes in React Flow canvas.
 */

const DEFAULT_CENTER_X = 500;
const DEFAULT_CENTER_Y = 350;

/**
 * Calculates layout positions for scoped graph nodes.
 *
 * @param {Array} rawNodes - Raw node objects from backend API
 * @param {Object} handlers - Event handlers to attach to node data
 * @param {boolean} [isRootScope=false] - Whether rendering root workspace
 * @param {Map<string, {x: number, y: number}>} [existingPositions=new Map()] - Preserved positions from manual drags
 * @returns {Array} Formatted React Flow nodes with type, position, and data
 */
export function layoutGraphNodes(
  rawNodes = [],
  handlers = {},
  isRootScope = false,
  existingPositions = new Map()
) {
  const count = rawNodes.length;
  if (count === 0) return [];

  const scopeFolderNode = rawNodes.find((n) => n.isScopeFolder || n.isCentralNode);
  const otherNodes = rawNodes.filter((n) => !(n.isScopeFolder || n.isCentralNode));

  const formattedNodes = [];

  if (scopeFolderNode && !isRootScope) {
    // 1. Folder Graph: Place Central Scope Folder at center
    const centralPos = existingPositions.get(scopeFolderNode.id) || {
      x: DEFAULT_CENTER_X,
      y: DEFAULT_CENTER_Y,
    };

    formattedNodes.push({
      id: scopeFolderNode.id,
      type: 'folderNode',
      position: centralPos,
      data: {
        ...scopeFolderNode,
        isCentralNode: true,
        ...handlers,
      },
    });

    // Partition remaining into direct children and external nodes
    const internalChildren = otherNodes.filter((n) => !n.isExternal);
    const externalNodes = otherNodes.filter((n) => n.isExternal);

    // Arrange direct children in primary orbit
    const childCount = internalChildren.length;
    // Nodes are ~220px wide and 100px tall; give ample circumference
    const baseRadius = Math.max(260, (childCount * 280) / (2 * Math.PI));

    internalChildren.forEach((node, index) => {
      const savedPos = existingPositions.get(node.id);
      let position = savedPos;

      if (!position) {
        // Offset initial angle slightly so top and bottom handles line up nicely
        const angle = (index / Math.max(1, childCount)) * 2 * Math.PI - Math.PI / 2;
        const x = DEFAULT_CENTER_X + baseRadius * 1.35 * Math.cos(angle);
        const y = DEFAULT_CENTER_Y + baseRadius * 1.05 * Math.sin(angle);
        position = { x, y };
      }

      formattedNodes.push({
        id: node.id,
        type: node.type === 'FOLDER' ? 'folderNode' : 'noteNode',
        position,
        data: {
          ...node,
          ...handlers,
        },
      });
    });

    // Arrange external nodes in outer orbit
    const extCount = externalNodes.length;
    const extRadius = baseRadius + 220;

    externalNodes.forEach((node, index) => {
      const savedPos = existingPositions.get(node.id);
      let position = savedPos;

      if (!position) {
        const angle = (index / Math.max(1, extCount)) * 2 * Math.PI;
        const x = DEFAULT_CENTER_X + extRadius * 1.4 * Math.cos(angle);
        const y = DEFAULT_CENTER_Y + extRadius * 1.1 * Math.sin(angle);
        position = { x, y };
      }

      formattedNodes.push({
        id: node.id,
        type: node.type === 'FOLDER' ? 'folderNode' : 'noteNode',
        position,
        data: {
          ...node,
          ...handlers,
        },
      });
    });
  } else {
    // 2. Root Workspace Graph (or workspace with no single central folder)
    if (count <= 8) {
      // Single ring orbit around workspace center
      const radius = Math.max(260, (count * 280) / (2 * Math.PI));
      rawNodes.forEach((node, index) => {
        const savedPos = existingPositions.get(node.id);
        let position = savedPos;

        if (!position) {
          const angle = (index / Math.max(1, count)) * 2 * Math.PI - Math.PI / 2;
          const x = DEFAULT_CENTER_X + radius * 1.35 * Math.cos(angle);
          const y = DEFAULT_CENTER_Y + radius * 1.05 * Math.sin(angle);
          position = { x, y };
        }

        formattedNodes.push({
          id: node.id,
          type: node.type === 'FOLDER' ? 'folderNode' : 'noteNode',
          position,
          data: {
            ...node,
            ...handlers,
          },
        });
      });
    } else {
      // Clean 4-column responsive grid layout
      const cols = 4;
      const colWidth = 280;
      const rowHeight = 180;
      const startX = 120;
      const startY = 120;

      rawNodes.forEach((node, index) => {
        const savedPos = existingPositions.get(node.id);
        let position = savedPos;

        if (!position) {
          const col = index % cols;
          const row = Math.floor(index / cols);
          const x = startX + col * colWidth;
          const y = startY + row * rowHeight;
          position = { x, y };
        }

        formattedNodes.push({
          id: node.id,
          type: node.type === 'FOLDER' ? 'folderNode' : 'noteNode',
          position,
          data: {
            ...node,
            ...handlers,
          },
        });
      });
    }
  }

  return formattedNodes;
}
