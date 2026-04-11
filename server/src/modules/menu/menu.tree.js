/**
 * Menu tree utilities.
 *
 * Builds a nested tree from a flat list of menu_nodes.
 * Calculates depth for validation purposes.
 */

/**
 * Assemble a flat array of nodes into a nested tree.
 * Each node gets a `children` array. Nodes with no parent_id are roots.
 * Children are sorted by sort_order.
 */
function buildTree(flatNodes) {
  const nodeMap = {};
  const roots = [];

  // Index by id
  for (const node of flatNodes) {
    nodeMap[node.id] = { ...node, children: [] };
  }

  // Build parent-child relationships
  for (const node of flatNodes) {
    const treeNode = nodeMap[node.id];
    if (node.parent_id && nodeMap[node.parent_id]) {
      nodeMap[node.parent_id].children.push(treeNode);
    } else {
      roots.push(treeNode);
    }
  }

  // Sort children by sort_order at every level
  sortChildrenRecursive(roots);

  return roots;
}

function sortChildrenRecursive(nodes) {
  nodes.sort((a, b) => a.sort_order - b.sort_order);
  for (const node of nodes) {
    if (node.children.length > 0) {
      sortChildrenRecursive(node.children);
    }
  }
}

/**
 * Calculate max depth of a tree rooted at the given nodes.
 * Root level = 1.
 */
function calculateMaxDepth(nodes, currentDepth = 1) {
  let maxDepth = currentDepth;
  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      const childDepth = calculateMaxDepth(node.children, currentDepth + 1);
      if (childDepth > maxDepth) maxDepth = childDepth;
    }
  }
  return maxDepth;
}

/**
 * Calculate the depth of a specific parent node in the tree.
 * Returns the depth level (1-based) of the node with the given parentId.
 * If parentId is null, return 0 (inserting at root level).
 */
function getNodeDepth(flatNodes, nodeId) {
  if (!nodeId) return 0;
  let depth = 0;
  let currentId = nodeId;
  const nodeMap = {};
  for (const n of flatNodes) {
    nodeMap[n.id] = n;
  }
  while (currentId) {
    depth++;
    const node = nodeMap[currentId];
    if (!node) break;
    currentId = node.parent_id;
  }
  return depth;
}

/**
 * Get the maximum depth of the subtree below a given node.
 * If the node has no children, returns 0.
 */
function getSubtreeDepth(flatNodes, nodeId) {
  const nodeMap = {};
  for (const n of flatNodes) {
    nodeMap[n.id] = { ...n, children: [] };
  }
  for (const n of flatNodes) {
    if (n.parent_id && nodeMap[n.parent_id]) {
      nodeMap[n.parent_id].children.push(nodeMap[n.id]);
    }
  }
  const target = nodeMap[nodeId];
  if (!target) return 0;
  return calculateMaxDepth(target.children, 0);
}

module.exports = { buildTree, calculateMaxDepth, getNodeDepth, getSubtreeDepth };
