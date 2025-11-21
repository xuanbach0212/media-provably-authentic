'use client';

import { motion } from 'framer-motion';
import { TreeNode } from '@/lib/processTreeData';

interface NodeTooltipProps {
  node: TreeNode;
}

export default function NodeTooltip({ node }: NodeTooltipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
    >
      <div
        className="glass-premium rounded-lg p-4 border-2 max-w-md shadow-2xl"
        style={{ borderColor: node.color }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="text-3xl">{node.icon}</div>
          <div className="flex-1">
            <h3 className="font-semibold text-white text-sm mb-1">{node.name}</h3>
            {node.service && (
              <div className="flex gap-2 items-center">
                <span
                  className="text-[10px] px-2 py-0.5 rounded border uppercase font-mono"
                  style={{
                    backgroundColor: `${node.color}20`,
                    borderColor: node.color,
                    color: node.color,
                  }}
                >
                  {node.service}
                </span>
                {node.enclaveId && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-gray-700/50 text-gray-300 border border-gray-600 font-mono">
                    Enclave {node.enclaveId}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-300 mb-3 leading-relaxed">{node.description}</p>

        {/* Metadata */}
        <div className="flex gap-4 text-[10px] text-gray-400">
          <div>
            <span className="font-mono">Stage:</span> <span className="text-white">{node.stage}</span>
          </div>
          <div>
            <span className="font-mono">Type:</span> <span className="text-white">{node.type}</span>
          </div>
          <div>
            <span className="font-mono">Time:</span> <span className="text-white">{node.estimatedTime}</span>
          </div>
        </div>

        {/* Arrow pointing down */}
        <div
          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 rotate-45 border-b-2 border-r-2"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: node.color,
          }}
        />
      </div>
    </motion.div>
  );
}

