'use client';

import { motion } from 'framer-motion';
import { TreeNode, TreeConnection } from '@/lib/processTreeData';

interface TreeConnectionProps {
  connection: TreeConnection;
  fromNode: TreeNode;
  toNode: TreeNode;
  active: boolean;
  completed: boolean;
}

export default function TreeConnectionLine({ connection, fromNode, toNode, active, completed }: TreeConnectionProps) {
  // Node center positions - adjusted for node size (24px = 6 tailwind units) and padding (30px)
  // Nodes are rendered with paddingTop: 30px and node size is w-6 h-6 (24px)
  const nodeOffsetY = 30 + 12; // paddingTop + half of node height (24/2 = 12)
  
  const fromX = fromNode.position.x;
  const fromY = fromNode.position.y + nodeOffsetY;
  const toX = toNode.position.x;
  const toY = toNode.position.y + nodeOffsetY;

  // Generate path based on connection type
  const generatePath = () => {
    switch (connection.type) {
      case 'vertical':
        // Straight vertical line
        return `M ${fromX} ${fromY} L ${toX} ${toY}`;
      
      case 'horizontal':
        // Horizontal line
        return `M ${fromX} ${fromY} L ${toX} ${toY}`;
      
      case 'diagonal':
        // Smooth Bezier curve for diagonal connections
        const midY = (fromY + toY) / 2;
        return `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;
      
      default:
        return `M ${fromX} ${fromY} L ${toX} ${toY}`;
    }
  };

  const path = generatePath();

  // Path length for animation
  const pathLength = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));

  // Color based on status
  const getColor = () => {
    if (completed) return '#22C55E'; // green-500
    if (active) return '#6366F1'; // indigo-500
    return '#4B5563'; // gray-600
  };

  const color = getColor();

  return (
    <g>
      {/* Base path (static) - Always visible, even when pending, THICKER */}
      <path
        d={path}
        fill="none"
        stroke={completed ? '#22C55E40' : active ? '#6366F140' : '#37415180'}
        strokeWidth="2"
        opacity={completed ? 0.4 : active ? 0.5 : 0.2}
      />

      {/* Animated path (active) - THICKER */}
      {(active || completed) && (
        <motion.path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="3"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: completed ? 0.8 : 1 
          }}
          transition={{ 
            duration: 0.6, 
            ease: 'easeInOut' 
          }}
        />
      )}

      {/* Glow effect for active connections - MORE PROMINENT */}
      {active && !completed && (
        <motion.path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="6"
          opacity="0.3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{ filter: 'blur(4px)' }}
        />
      )}

      {/* Flow particles - DISABLED for cleaner UI */}
    </g>
  );
}

