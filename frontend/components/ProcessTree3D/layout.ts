// Layout Engine for 33-Node Process Tree
// Calculates responsive positions for all nodes across different screen sizes

import { TreeNode } from '@/lib/processTreeData';

export interface LayoutConfig {
  width: number;
  height: number;
  nodeWidth: number;
  nodeHeight: number;
  verticalSpacing: number;
  horizontalSpacing: number;
}

export interface CalculatedPosition {
  x: number;
  y: number;
  z: number;
}

// Default desktop layout config
export const DEFAULT_LAYOUT: LayoutConfig = {
  width: 1200,
  height: 1200,
  nodeWidth: 100,
  nodeHeight: 80,
  verticalSpacing: 80,
  horizontalSpacing: 150,
};

// Responsive breakpoints
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
};

/**
 * Calculate responsive layout based on screen size
 */
export function getResponsiveLayout(windowWidth: number): LayoutConfig {
  if (windowWidth < BREAKPOINTS.mobile) {
    // Mobile: Single column, compressed vertical
    return {
      width: windowWidth,
      height: 2400,
      nodeWidth: 120,
      nodeHeight: 100,
      verticalSpacing: 80,
      horizontalSpacing: 0,
    };
  } else if (windowWidth < BREAKPOINTS.tablet) {
    // Tablet: 2 columns for enclaves
    return {
      width: windowWidth,
      height: 2000,
      nodeWidth: 130,
      nodeHeight: 110,
      verticalSpacing: 90,
      horizontalSpacing: 150,
    };
  } else {
    // Desktop: Full 3 columns
    return {
      ...DEFAULT_LAYOUT,
      width: windowWidth,
    };
  }
}

/**
 * Calculate positions for all 33 nodes hierarchically
 * HORIZONTAL LAYOUT - Nodes flow from left to right
 * Returns positions in PIXELS for both x and y
 */
export function calculateNodePositions(
  nodes: TreeNode[],
  config: LayoutConfig
): Map<string, CalculatedPosition> {
  const positions = new Map<string, CalculatedPosition>();

  // Compact Horizontal Layout - Fit viewport better
  // Y splits for parallel processing (3 enclaves)
  
  // Stage positions (X axis - horizontal flow) - More compact
  const stageX = {
    upload: 30,
    store: 90,
    dispatch: 150,
    // Enclave processing - compressed
    e1: 210, 
    keyReq: 260, 
    keyRecv: 300,
    fetchMedia: 350,
    reverse: 400,
    ai: 450,
    report: 500,
    attest: 550,
    // Final stages
    aggregate: 620,
    consensus: 680,
    emit: 740,
    final: 800,
  };

  // Y positions for parallel lanes - tighter spacing
  const centerY = 70;
  const laneSpacing = 40; // Reduced from 50
  
  const levels = [
    // Stage 1: Upload
    { ids: ['node-1'], x: stageX.upload, y: centerY },
    { ids: ['node-2', 'node-3'], x: stageX.store, y: [centerY - 20, centerY + 20] },
    { ids: ['node-4'], x: stageX.dispatch, y: centerY },
    
    // Stage 2-4: Enclaves (3 parallel lanes)
    { ids: ['node-5', 'node-13', 'node-21'], x: stageX.e1, y: [centerY - laneSpacing, centerY, centerY + laneSpacing] },
    { ids: ['node-6', 'node-14', 'node-22'], x: stageX.keyReq, y: [centerY - laneSpacing, centerY, centerY + laneSpacing] },
    { ids: ['node-7', 'node-15', 'node-23'], x: stageX.keyRecv, y: [centerY - laneSpacing, centerY, centerY + laneSpacing] },
    { ids: ['node-8', 'node-16', 'node-24'], x: stageX.fetchMedia, y: [centerY - laneSpacing, centerY, centerY + laneSpacing] },
    { ids: ['node-9', 'node-17', 'node-25'], x: stageX.reverse, y: [centerY - laneSpacing, centerY, centerY + laneSpacing] },
    { ids: ['node-10', 'node-18', 'node-26'], x: stageX.ai, y: [centerY - laneSpacing, centerY, centerY + laneSpacing] },
    { ids: ['node-11', 'node-19', 'node-27'], x: stageX.report, y: [centerY - laneSpacing, centerY, centerY + laneSpacing] },
    { ids: ['node-12', 'node-20', 'node-28'], x: stageX.attest, y: [centerY - laneSpacing, centerY, centerY + laneSpacing] },
    
    // Stage 5-6: Consensus
    { ids: ['node-29'], x: stageX.aggregate, y: centerY },
    { ids: ['node-30'], x: stageX.consensus, y: centerY },
    { ids: ['node-31', 'node-32'], x: stageX.emit, y: [centerY - 20, centerY + 20] },
    { ids: ['node-33'], x: stageX.final, y: centerY },
  ];

  levels.forEach((level) => {
    level.ids.forEach((id, index) => {
      const node = nodes.find((n) => n.id === id);
      if (!node) return;

      const x = level.x;
      const y = Array.isArray(level.y) ? level.y[index] : level.y;

      positions.set(id, {
        x,
        y,
        z: 0,
      });
    });
  });

  return positions;
}

/**
 * Get node status based on current stage and substep
 */
export function getNodeStatus(
  nodeId: string,
  activeNodes: Set<string>,
  completedNodes: Set<string>
): 'pending' | 'active' | 'processing' | 'completed' | 'failed' {
  if (completedNodes.has(nodeId)) return 'completed';
  if (activeNodes.has(nodeId)) return 'processing';
  
  // Check if any child is active (make parent active too)
  // This is handled by progressMapper logic
  
  return 'pending';
}

/**
 * Check if a connection is active
 */
export function isConnectionActive(
  connectionId: string,
  fromNodeId: string,
  toNodeId: string,
  activeNodes: Set<string>,
  completedNodes: Set<string>
): boolean {
  // Connection is active if:
  // 1. From node is completed and to node is active
  // 2. Both nodes are completed
  const fromCompleted = completedNodes.has(fromNodeId);
  const toActive = activeNodes.has(toNodeId);
  const toCompleted = completedNodes.has(toNodeId);

  return (fromCompleted && toActive) || (fromCompleted && toCompleted);
}

/**
 * Check if a connection is completed
 */
export function isConnectionCompleted(
  fromNodeId: string,
  toNodeId: string,
  completedNodes: Set<string>
): boolean {
  return completedNodes.has(fromNodeId) && completedNodes.has(toNodeId);
}

/**
 * Auto-scroll to active node
 */
export function scrollToActiveNode(activeNodeId: string, containerRef: HTMLElement | null) {
  if (!containerRef) return;

  const nodeElement = containerRef.querySelector(`[data-node-id="${activeNodeId}"]`);
  if (nodeElement) {
    nodeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    });
  }
}

/**
 * Calculate viewport bounds for virtualization
 */
export function getVisibleNodeIds(
  nodes: TreeNode[],
  positions: Map<string, CalculatedPosition>,
  scrollTop: number,
  viewportHeight: number,
  buffer: number = 200
): Set<string> {
  const visibleIds = new Set<string>();

  nodes.forEach((node) => {
    const pos = positions.get(node.id);
    if (!pos) return;

    const nodeTop = pos.y;
    const nodeBottom = pos.y + 120; // Node height

    // Check if node is in viewport (with buffer)
    if (
      nodeBottom >= scrollTop - buffer &&
      nodeTop <= scrollTop + viewportHeight + buffer
    ) {
      visibleIds.add(node.id);
    }
  });

  return visibleIds;
}

