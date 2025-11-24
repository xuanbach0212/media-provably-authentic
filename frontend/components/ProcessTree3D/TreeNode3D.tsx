'use client';

import { NodeStatus, TreeNode } from '@/lib/processTreeData';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

interface TreeNode3DProps {
  node: TreeNode;
  status: NodeStatus;
  onHover?: () => void;
  onClick?: () => void;
}

export default function TreeNode3D({ node, status, onHover, onClick }: TreeNode3DProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Status-based styles
  const getStatusStyles = () => {
    switch (status) {
      case 'pending':
        return {
          opacity: 0.5,
          filter: 'grayscale(100%)',
          border: 'border-gray-700',
          bg: 'bg-gray-900/50',
          glow: '',
        };
      case 'active':
        return {
          opacity: 1,
          filter: 'grayscale(0%)',
          border: `border-[${node.color}]`,
          bg: `bg-[${node.color}]/10`,
          glow: 'shadow-[0_0_20px_rgba(99,102,241,0.5)] ring-2 ring-[#6366F1]/50',
        };
      case 'processing':
        return {
          opacity: 1,
          filter: 'grayscale(0%)',
          border: `border-[${node.color}]`,
          bg: `bg-gradient-to-br from-[${node.color}]/20 to-[${node.color}]/5`,
          glow: 'shadow-[0_0_30px_rgba(99,102,241,0.7)] ring-2 ring-[#6366F1]/70 animate-pulse',
        };
      case 'completed':
        return {
          opacity: 1,
          filter: 'grayscale(0%)',
          border: 'border-green-500',
          bg: 'bg-green-500/10',
          glow: 'shadow-[0_0_15px_rgba(34,197,94,0.5)]',
        };
      case 'failed':
        return {
          opacity: 1,
          filter: 'grayscale(0%)',
          border: 'border-red-500',
          bg: 'bg-red-500/10',
          glow: 'shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-shake',
        };
      default:
        return {
          opacity: 0.5,
          filter: 'grayscale(100%)',
          border: 'border-gray-700',
          bg: 'bg-gray-900/50',
          glow: '',
        };
    }
  };

  const statusStyles = getStatusStyles();

  // Icon badge based on status
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg z-10"
          >
            ✓
          </motion.div>
        );
      case 'failed':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg z-10"
          >
            ✕
          </motion.div>
        );
      case 'processing':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-[#6366F1] rounded-full flex items-center justify-center text-white text-xs shadow-lg z-10"
          >
            ⟳
          </motion.div>
        );
      default:
        return null;
    }
  };

  // Service badge color
  const getServiceBadge = () => {
    if (!node.service) return null;
    
    const serviceColors: Record<string, string> = {
      walrus: 'bg-blue-500/20 text-blue-300 border-blue-500',
      seal: 'bg-purple-500/20 text-purple-300 border-purple-500',
      sui: 'bg-cyan-500/20 text-cyan-300 border-cyan-500',
      ai: 'bg-green-500/20 text-green-300 border-green-500',
      'reverse-search': 'bg-orange-500/20 text-orange-300 border-orange-500',
      queue: 'bg-indigo-500/20 text-indigo-300 border-indigo-500',
      gateway: 'bg-violet-500/20 text-violet-300 border-violet-500',
      aggregator: 'bg-pink-500/20 text-pink-300 border-pink-500',
    };

    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${serviceColors[node.service]} uppercase font-mono`}>
        {node.service}
      </span>
    );
  };

  // Enclave badge
  const getEnclaveBadge = () => {
    if (!node.enclaveId) return null;
    
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-300 border border-gray-600 font-mono">
        E{node.enclaveId}
      </span>
    );
  };

  // Particle effects for processing state - DISABLED
  const renderParticles = () => {
    // Particles disabled to keep clean UI
    return null;
  };

  return (
    <div 
      className="absolute"
      style={{
        left: `${node.position.x}px`,
        top: `${node.position.y}px`,
        transform: `translateX(-50%)`,
        zIndex: isHovered ? 50 : 10,
      }}
    >
      <motion.div
        className="relative cursor-pointer group"
        onMouseEnter={() => {
          setIsHovered(true);
          onHover?.();
        }}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
        onClick={onClick}
      >
        {/* Node Dot - Elegant Glowing Orb */}
        <motion.div
          className="relative"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: 1,
            opacity: 1,
          }}
          transition={{ delay: 0.1 }}
        >
          {/* Outer glow ring for active/processing */}
          {(status === 'active' || status === 'processing') && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, ${node.color}40 0%, transparent 70%)`,
                width: '20px',
                height: '20px',
                left: '-4px',
                top: '-4px',
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
          
          {/* Main orb - LARGER Beautiful glowing sphere */}
          <motion.div
            className="w-6 h-6 rounded-full relative z-10"
            style={{ 
              background: status === 'pending' 
                ? 'linear-gradient(135deg, #374151 0%, #1F2937 100%)'
                : `linear-gradient(135deg, ${node.color} 0%, ${node.color}CC 100%)`,
              boxShadow: status === 'active' || status === 'processing' 
                ? `0 0 20px ${node.color}, 0 0 40px ${node.color}90, 0 0 60px ${node.color}60, inset 0 3px 6px rgba(255,255,255,0.5), inset 0 -3px 6px rgba(0,0,0,0.4)` 
                : status === 'completed'
                ? `0 0 16px #22C55E, 0 0 32px #22C55E80, inset 0 3px 6px rgba(255,255,255,0.5), inset 0 -3px 6px rgba(0,0,0,0.4)`
                : status === 'pending'
                ? `0 3px 6px rgba(0,0,0,0.4), inset 0 2px 4px rgba(0,0,0,0.6)`
                : 'none',
              border: status === 'pending' ? '1.5px solid #4B5563' : `1.5px solid ${node.color}40`,
            }}
            animate={{ 
              scale: status === 'active' || status === 'processing' ? [1, 1.4, 1] : 1,
              boxShadow: status === 'active' || status === 'processing'
                ? [
                    `0 0 20px ${node.color}, 0 0 40px ${node.color}90, 0 0 60px ${node.color}60, inset 0 3px 6px rgba(255,255,255,0.5)`,
                    `0 0 32px ${node.color}, 0 0 64px ${node.color}CC, 0 0 96px ${node.color}80, inset 0 3px 6px rgba(255,255,255,0.6)`,
                    `0 0 20px ${node.color}, 0 0 40px ${node.color}90, 0 0 60px ${node.color}60, inset 0 3px 6px rgba(255,255,255,0.5)`,
                  ]
                : undefined,
            }}
            transition={{
              scale: {
                duration: 1.5,
                repeat: status === 'active' || status === 'processing' ? Infinity : 0,
                ease: 'easeInOut',
              },
              boxShadow: {
                duration: 2,
                repeat: status === 'active' || status === 'processing' ? Infinity : 0,
                ease: 'easeInOut',
              }
            }}
            whileHover={{ 
              scale: 2.8, 
              transition: { duration: 0.1 },
              boxShadow: `0 0 30px ${node.color}, 0 0 60px ${node.color}CC, 0 0 90px ${node.color}80`,
            }}
          >
            {/* Inner highlight */}
            {status !== 'pending' && (
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)',
                }}
              />
            )}
          </motion.div>
        </motion.div>

        {/* Status Icon Badge - Removed for cleaner UI */}

        {/* Particles - Mini */}
        {(status === 'processing' || status === 'active') && renderParticles()}
      </motion.div>

      {/* Premium Tooltip - Always on top */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.1 }}
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
            style={{
              top: '28px',
              zIndex: 99999,
            }}
          >
            <div 
              className="px-3 py-2 rounded-lg text-xs font-semibold shadow-2xl backdrop-blur-md whitespace-nowrap"
              style={{
                background: `linear-gradient(135deg, rgba(17, 24, 39, 0.98) 0%, rgba(31, 41, 55, 0.98) 100%)`,
                border: `1px solid ${node.color}60`,
                boxShadow: `0 4px 12px rgba(0,0,0,0.5), 0 0 20px ${node.color}30`,
              }}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ 
                    backgroundColor: node.color,
                    boxShadow: `0 0 6px ${node.color}`,
                  }}
                />
                <span className="text-white">{node.name}</span>
              </div>
              {node.service && (
                <div className="mt-1 text-[10px] opacity-60 text-gray-300">
                  {node.service}
                </div>
              )}
            </div>
            {/* Arrow */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 rotate-45"
              style={{
                background: 'rgba(17, 24, 39, 0.98)',
                borderLeft: `1px solid ${node.color}60`,
                borderTop: `1px solid ${node.color}60`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

