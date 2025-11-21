'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import TreeNode3D from './TreeNode3D';
import TreeConnectionLine from './TreeConnection';
import { TREE_NODES, TREE_CONNECTIONS, TreeNode, TreeConnection } from '@/lib/processTreeData';
import {
  getResponsiveLayout,
  calculateNodePositions,
  getNodeStatus,
  isConnectionActive,
  isConnectionCompleted,
  scrollToActiveNode,
  getVisibleNodeIds,
} from './layout';

export type ProcessStatus = 'IDLE' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

interface ProcessTree3DProps {
  currentStage: number;
  substep?: string;
  progress?: number;
  status: ProcessStatus;
  activeNodeIds?: string[];
  completedNodeIds?: string[];
}

export default function ProcessTree3D({
  currentStage,
  substep,
  progress,
  status,
  activeNodeIds = [],
  completedNodeIds = [],
}: ProcessTree3DProps) {
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Active and completed node sets
  const activeNodes = useMemo(() => new Set(activeNodeIds), [activeNodeIds]);
  const completedNodes = useMemo(() => new Set(completedNodeIds), [completedNodeIds]);

  // Calculate responsive layout
  const layoutConfig = useMemo(
    () => getResponsiveLayout(windowWidth),
    [windowWidth]
  );

  // Calculate node positions
  const nodePositions = useMemo(
    () => calculateNodePositions(TREE_NODES, layoutConfig),
    [layoutConfig]
  );

  // Update nodes with calculated positions
  const positionedNodes = useMemo(
    () =>
      TREE_NODES.map((node) => ({
        ...node,
        position: nodePositions.get(node.id) || node.position,
      })),
    [nodePositions]
  );

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll to active node
  useEffect(() => {
    if (activeNodes.size > 0) {
      const firstActiveNode = Array.from(activeNodes)[0];
      scrollToActiveNode(firstActiveNode, containerRef.current);
    }
  }, [activeNodes]);

  // Get visible nodes for virtualization (optional optimization)
  const [scrollTop, setScrollTop] = useState(0);
  const visibleNodeIds = useMemo(
    () => getVisibleNodeIds(positionedNodes, nodePositions, scrollTop, layoutConfig.height),
    [positionedNodes, nodePositions, scrollTop, layoutConfig.height]
  );

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div className="relative w-full mx-auto" style={{ maxWidth: '900px' }}>
      {/* Elegant Header */}
      <div className="mb-4 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-[#4DA2FF] to-[#06B6D4] rounded-full"></div>
          <div>
            <h3 className="text-base font-bold text-white">
              Verification Pipeline
            </h3>
            <p className="text-sm text-gray-400">
              {completedNodes.size} of 33 steps completed • {progress}%
            </p>
          </div>
        </div>
        {activeNodes.size > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#4DA2FF]/10 border border-[#4DA2FF]/30">
            <div className="w-2.5 h-2.5 rounded-full bg-[#4DA2FF] animate-pulse"></div>
            <span className="text-sm text-[#4DA2FF] font-medium">
              {activeNodes.size} processing
            </span>
          </div>
        )}
      </div>

      {/* Tree Container - Centered, NO overflow-hidden for tooltips */}
      <div
        ref={containerRef}
        className="relative w-full h-[200px] rounded-xl bg-gray-900/30 border border-gray-800/50"
        style={{
          scrollBehavior: 'smooth',
        }}
        onScroll={handleScroll}
      >
        {/* SVG Connections Layer - Synced with nodes */}
        <svg
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
          width="900"
          height="200"
          viewBox="0 0 900 200"
          preserveAspectRatio="xMidYMid meet"
          style={{ top: '0px', left: '50%' }}
        >
          {TREE_CONNECTIONS.map((conn) => {
            const fromNode = positionedNodes.find((n) => n.id === conn.from);
            const toNode = positionedNodes.find((n) => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            const active = isConnectionActive(
              conn.id,
              conn.from,
              conn.to,
              activeNodes,
              completedNodes
            );
            const completed = isConnectionCompleted(conn.from, conn.to, completedNodes);

            return (
              <TreeConnectionLine
                key={conn.id}
                connection={conn}
                fromNode={fromNode}
                toNode={toNode}
                active={active}
                completed={completed}
              />
            );
          })}
        </svg>

        {/* Combined Layer - Labels and Nodes centered together */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ width: '900px', height: 200, top: 0 }}>
          {/* Stage Labels */}
          <div className="absolute inset-0 pointer-events-none" style={{ top: '12px', zIndex: 1 }}>
            <div className="absolute text-xs text-gray-400 font-mono uppercase tracking-wider" style={{ left: '20px' }}>
              Upload
            </div>
            <div className="absolute text-xs text-gray-400 font-mono uppercase tracking-wider" style={{ left: '110px' }}>
              Encrypt
            </div>
            <div className="absolute text-xs text-gray-400 font-mono uppercase tracking-wider" style={{ left: '240px' }}>
              Enclave Processing
            </div>
            <div className="absolute text-xs text-gray-400 font-mono uppercase tracking-wider" style={{ left: '640px' }}>
              Consensus
            </div>
            <div className="absolute text-xs text-gray-400 font-mono uppercase tracking-wider" style={{ left: '790px' }}>
              Blockchain
            </div>
          </div>

          {/* Nodes */}
          <div className="absolute inset-0" style={{ paddingTop: '40px', zIndex: 10 }}>
            {positionedNodes.map((node) => (
              <TreeNode3D
                key={node.id}
                node={node}
                status={getNodeStatus(node.id, activeNodes, completedNodes)}
                onClick={() => setSelectedNode(node)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Elegant Legend */}
      <div className="mt-3 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800/30 border border-gray-700/50">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-600 opacity-50"></div>
          <span className="text-gray-400 font-medium">Pending</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30">
          <div className="w-2.5 h-2.5 rounded-full bg-[#6366F1] animate-pulse shadow-lg shadow-[#6366F1]/50"></div>
          <span className="text-[#6366F1] font-medium">Active</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
          <span className="text-green-400 font-medium">Completed</span>
        </div>
      </div>
    </div>
  );
}

