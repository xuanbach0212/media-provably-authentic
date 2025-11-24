'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { TreeNode } from '@/lib/processTreeData';

interface SubwayNodeProps {
  node: TreeNode;
  status: 'pending' | 'active' | 'processing' | 'completed';
  onClick?: () => void;
  laneColor: string;
}

export default function SubwayNode({ node, status, onClick, laneColor }: SubwayNodeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getStatusColor = () => {
    if (status === 'completed') return '#22C55E';
    if (status === 'active' || status === 'processing') return laneColor;
    return '#6B7280';
  };

  const statusColor = getStatusColor();

  return (
    <div
      className="relative inline-flex flex-col items-center gap-2"
      style={{
        minWidth: '80px',
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Node Circle */}
      <motion.div
        className="relative cursor-pointer"
        onClick={onClick}
        whileHover={{ scale: 1.3 }}
        transition={{ duration: 0.2 }}
        style={{ zIndex: showTooltip ? 100 : 10 }}
      >
        {/* Outer glow for active */}
        {(status === 'active' || status === 'processing') && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              width: '48px',
              height: '48px',
              left: '-8px',
              top: '-8px',
              background: `radial-gradient(circle, ${statusColor}60 0%, transparent 70%)`,
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Main circle */}
        <motion.div
          className="w-8 h-8 rounded-full relative z-10 flex items-center justify-center"
          style={{
            background: status === 'pending'
              ? 'linear-gradient(135deg, #374151 0%, #1F2937 100%)'
              : `linear-gradient(135deg, ${statusColor} 0%, ${statusColor}CC 100%)`,
            border: status === 'pending' 
              ? '2px solid #4B5563' 
              : `2px solid ${statusColor}`,
            boxShadow: status === 'active' || status === 'processing'
              ? `0 0 20px ${statusColor}, 0 0 40px ${statusColor}80, inset 0 2px 4px rgba(255,255,255,0.3)`
              : status === 'completed'
              ? `0 0 15px #22C55E, 0 0 30px #22C55E80, inset 0 2px 4px rgba(255,255,255,0.3)`
              : '0 2px 4px rgba(0,0,0,0.3)',
          }}
          animate={
            status === 'active' || status === 'processing'
              ? {
                  scale: [1, 1.15, 1],
                  boxShadow: [
                    `0 0 20px ${statusColor}, 0 0 40px ${statusColor}80`,
                    `0 0 30px ${statusColor}, 0 0 60px ${statusColor}CC`,
                    `0 0 20px ${statusColor}, 0 0 40px ${statusColor}80`,
                  ],
                }
              : {}
          }
          transition={{
            duration: 1.5,
            repeat: status === 'active' || status === 'processing' ? Infinity : 0,
            ease: 'easeInOut',
          }}
        >
          {/* Checkmark for completed */}
          {status === 'completed' && (
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}

          {/* Inner highlight */}
          <div
            className="absolute top-1 left-1 w-3 h-3 rounded-full"
            style={{
              background: 'radial-gradient(circle at top left, rgba(255,255,255,0.6), transparent)',
            }}
          />
        </motion.div>
      </motion.div>

      {/* Service Label */}
      <div className="text-center">
        <div className="text-xs font-semibold text-gray-300 whitespace-nowrap">
          {node.service || node.name}
        </div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 px-4 py-3 rounded-lg text-sm shadow-2xl pointer-events-none whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.98) 0%, rgba(31, 41, 55, 0.98) 100%)',
              border: `2px solid ${statusColor}80`,
              backdropFilter: 'blur(12px)',
              zIndex: 99999,
              maxWidth: '300px',
            }}
          >
            <div className="font-bold mb-1" style={{ color: statusColor }}>
              {node.name}
            </div>
            <div className="text-gray-400 text-xs mb-1">
              {node.description}
            </div>
            <div className="text-gray-500 text-xs">
              Service: {node.service}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

