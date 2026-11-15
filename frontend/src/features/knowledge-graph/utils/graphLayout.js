/**
 * Graph layout engine for Knowledge App.
 * Computes deterministic, collision-safe 2D positions for nodes in React Flow canvas.
 */

const DEFAULT_CENTER_X = 450;
const DEFAULT_CENTER_Y = 320;

/**
 * Calculates layout positions for scoped graph nodes.
 *
 * @param {Array} rawNodes - Raw node objects from backend API
 * @param {Object} handlers - Event handlers to attach to node data
 * @param {boolean} [isRootScope=false] - Whether rendering root workspace
 * @returns {Array} Formatted React Flow nodes with type, position, and data
 */
export function layoutGraphNodes(rawNodes = [], handlers = {}, isRootScope = false) {
  const count = rawNodes.length;
  if (count === 0) return [];

  const scopeFolderNode = rawNodes.find((n) => n.isScopeFolder || n.isCentralNode);
  const otherNodes = rawNodes.filter((n) => !(n.isScopeFolder || n.isCentralNode));

  const formattedNodes = [];

  if (scopeFolderNode && !isRootScope) {
    // 1. Folder Graph: Place Central Scope Folder at center
    formattedNodes.push({
      id: scopeFolderNode.id,
      type: 'folderNode',
      position: { x: DEFAULT_CENTER_X, y: DEFAULT_CENTER_Y },
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
    const baseRadius = Math.max(220, childCount * 50);

    internalChildren.forEach((node, index) => {
      // Offset initial angle slightly so top and bottom handles line up nicely
      const angle = (index / Math.max(1, childCount)) * 2 * Math.PI - Math.PI / 2;
      const x = DEFAULT_CENTER_X + baseRadius * 1.2 * Math.cos(angle);
      const y = DEFAULT_CENTER_Y + baseRadius * 0.9 * Math.sin(angle);

      formattedNodes.push({
        id: node.id,
        type: node.type === 'FOLDER' ? 'folderNode' : 'noteNode',
        position: { x, y },
        data: {
          ...node,
          ...handlers,
        },
      });
    });

    // Arrange external nodes in outer orbit
    const extCount = externalNodes.length;
    const extRadius = baseRadius + 160;

    externalNodes.forEach((node, index) => {
      const angle = (index / Math.max(1, extCount)) * 2 * Math.PI;
      const x = DEFAULT_CENTER_X + extRadius * 1.25 * Math.cos(angle);
      const y = DEFAULT_CENTER_Y + extRadius * 0.95 * Math.sin(angle);

      formattedNodes.push({
        id: node.id,
        type: node.type === 'FOLDER' ? 'folderNode' : 'noteNode',
        position: { x, y },
        data: {
          ...node,
          ...handlers,
        },
      });
    });
  } else {
    // 2. Root Workspace Graph (or workspace with no single central folder)
    if (count <= 10) {
      // Single ring orbit around workspace center
      const radius = Math.max(240, count * 55);
      rawNodes.forEach((node, index) => {
        const angle = (index / Math.max(1, count)) * 2 * Math.PI - Math.PI / 2;
        const x = DEFAULT_CENTER_X + radius * 1.2 * Math.cos(angle);
        const y = DEFAULT_CENTER_Y + radius * 0.9 * Math.sin(angle);

        formattedNodes.push({
          id: node.id,
          type: node.type === 'FOLDER' ? 'folderNode' : 'noteNode',
          position: { x, y },
          data: {
            ...node,
            ...handlers,
          },
        });
      });
    } else {
      // Clean 4-column responsive grid layout
      const cols = 4;
      const colWidth = 260;
      const rowHeight = 160;
      const startX = 120;
      const startY = 100;

      rawNodes.forEach((node, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = startX + col * colWidth;
        const y = startY + row * rowHeight;

        formattedNodes.push({
          id: node.id,
          type: node.type === 'FOLDER' ? 'folderNode' : 'noteNode',
          position: { x, y },
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
