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
  // Direct pixel positions for dots
  const fromX = fromNode.position.x;
  const fromY = fromNode.position.y;
  const toX = toNode.position.x;
  const toY = toNode.position.y;

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
      {/* Base path (static) - thin line */}
      <path
        d={path}
        fill="none"
        stroke={completed ? '#1F2937' : '#374151'}
        strokeWidth="1"
        opacity="0.2"
      />

      {/* Animated path (active) - thinner */}
      {(active || completed) && (
        <motion.path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: completed ? 0.6 : 0.8 
          }}
          transition={{ 
            duration: 0.6, 
            ease: 'easeInOut' 
          }}
        />
      )}

      {/* Glow effect for active connections - subtle */}
      {active && !completed && (
        <motion.path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="3"
          opacity="0.2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{ filter: 'blur(2px)' }}
        />
      )}

      {/* Flow particles - tiny dots */}
      {active && !completed && (
        <g>
          <motion.circle
            r="2"
            fill={color}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.8, 0],
              cx: [fromX, toX],
              cy: [fromY, toY],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              filter: `drop-shadow(0 0 3px ${color})`,
            }}
          />
        </g>
      )}
    </g>
  );
}

