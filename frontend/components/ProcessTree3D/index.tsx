'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import SubwayNode from './SubwayNode';
import SubwayLine from './SubwayLine';
import { TREE_NODES } from '@/lib/processTreeData';

interface ProcessTree3DProps {
  currentStage: number;
  substep?: string;
  progress: number;
  status: string;
  activeNodeIds: string[];
  completedNodeIds: string[];
}

const ORACLE_COLORS = {
  oracle1: '#3B82F6', // Blue
  oracle2: '#A855F7', // Purple
  oracle3: '#06B6D4', // Cyan
};

export default function ProcessTree3D({
  currentStage,
  substep,
  progress,
  status,
  activeNodeIds,
  completedNodeIds,
}: ProcessTree3DProps) {
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const getNodeStatus = (nodeId: string) => {
    if (completedNodeIds.includes(nodeId)) return 'completed';
    if (activeNodeIds.includes(nodeId)) return 'active';
    return 'pending';
  };

  // Group nodes by stage
  const uploadNodes = ['node-1', 'node-2', 'node-3'];
  const dispatchNode = 'node-4';
  const oracle1Nodes = ['node-5', 'node-6', 'node-7', 'node-8', 'node-9', 'node-10', 'node-11', 'node-12'];
  const oracle2Nodes = ['node-13', 'node-14', 'node-15', 'node-16', 'node-17', 'node-18', 'node-19', 'node-20'];
  const oracle3Nodes = ['node-21', 'node-22', 'node-23', 'node-24', 'node-25', 'node-26', 'node-27', 'node-28'];
  const consensusNodes = ['node-29', 'node-30', 'node-31', 'node-32', 'node-33'];

  const completedSteps = completedNodeIds.length;
  const totalSteps = 33;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between px-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">
            🛡️ Multi-Oracle Verification Pipeline
          </h3>
          <p className="text-base text-gray-400">
            {completedSteps} of {totalSteps} steps completed • {progressPercent}%
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 mb-1">Byzantine Fault Tolerance</div>
          <div className="text-lg font-semibold text-[#4DA2FF]">3-of-3 Oracle Consensus</div>
        </div>
      </div>

      {/* Main Subway Map Container */}
      <div className="relative rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-950/80 border border-gray-800/60 p-8 backdrop-blur-sm shadow-2xl">
        
        {/* Stage 1: Upload & Encryption */}
        <div className="mb-8">
          <div className="text-sm font-bold text-blue-400 mb-4 flex items-center gap-2">
            <span className="text-lg">📤</span>
            <span>STAGE 1: UPLOAD & ENCRYPTION</span>
          </div>
          <div className="flex items-center gap-3 pl-4">
            {uploadNodes.map((nodeId, idx) => {
              const node = TREE_NODES.find(n => n.id === nodeId)!;
              return (
                <div key={nodeId} className="flex items-center">
                  <SubwayNode
                    node={node}
                    status={getNodeStatus(nodeId)}
                    onClick={() => setSelectedNode(node)}
                    laneColor="#3B82F6"
                  />
                  {idx < uploadNodes.length - 1 && (
                    <SubwayLine
                      color="#3B82F6"
                      active={activeNodeIds.includes(uploadNodes[idx + 1])}
                      completed={completedNodeIds.includes(uploadNodes[idx + 1])}
                      width={40}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stage 2: Dispatch */}
        <div className="mb-8 flex justify-center">
          <div className="text-center">
            <div className="text-sm font-bold text-purple-400 mb-4">
              🎯 JOB DISPATCH
            </div>
            <SubwayNode
              node={TREE_NODES.find(n => n.id === dispatchNode)!}
              status={getNodeStatus(dispatchNode)}
              onClick={() => setSelectedNode(TREE_NODES.find(n => n.id === dispatchNode))}
              laneColor="#A855F7"
            />
          </div>
        </div>

        {/* Stage 3: Oracle Processing (3 Parallel Lanes) */}
        <div className="mb-8">
          <div className="text-sm font-bold text-center text-indigo-400 mb-6 flex items-center justify-center gap-2">
            <span className="text-lg">🛡️</span>
            <span>STAGE 3: MULTI-ORACLE PROCESSING (Nautilus TEE)</span>
          </div>

          <div className="space-y-6">
            {/* Oracle 1 */}
            <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></div>
                <span className="text-sm font-bold text-blue-400">ORACLE 1 (Enclave 1)</span>
                <span className="text-xs text-gray-500 ml-auto">Rep: 0.82 | Stake: 1050 SUI</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {oracle1Nodes.map((nodeId, idx) => {
                  const node = TREE_NODES.find(n => n.id === nodeId)!;
                  return (
                    <div key={nodeId} className="flex items-center flex-shrink-0">
                      <SubwayNode
                        node={node}
                        status={getNodeStatus(nodeId)}
                        onClick={() => setSelectedNode(node)}
                        laneColor={ORACLE_COLORS.oracle1}
                      />
                      {idx < oracle1Nodes.length - 1 && (
                        <SubwayLine
                          color={ORACLE_COLORS.oracle1}
                          active={activeNodeIds.includes(oracle1Nodes[idx + 1])}
                          completed={completedNodeIds.includes(oracle1Nodes[idx + 1])}
                          width={30}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Oracle 2 */}
            <div className="rounded-xl bg-purple-500/5 border border-purple-500/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50"></div>
                <span className="text-sm font-bold text-purple-400">ORACLE 2 (Enclave 2)</span>
                <span className="text-xs text-gray-500 ml-auto">Rep: 0.78 | Stake: 980 SUI</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {oracle2Nodes.map((nodeId, idx) => {
                  const node = TREE_NODES.find(n => n.id === nodeId)!;
                  return (
                    <div key={nodeId} className="flex items-center flex-shrink-0">
                      <SubwayNode
                        node={node}
                        status={getNodeStatus(nodeId)}
                        onClick={() => setSelectedNode(node)}
                        laneColor={ORACLE_COLORS.oracle2}
                      />
                      {idx < oracle2Nodes.length - 1 && (
                        <SubwayLine
                          color={ORACLE_COLORS.oracle2}
                          active={activeNodeIds.includes(oracle2Nodes[idx + 1])}
                          completed={completedNodeIds.includes(oracle2Nodes[idx + 1])}
                          width={30}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Oracle 3 */}
            <div className="rounded-xl bg-cyan-500/5 border border-cyan-500/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50"></div>
                <span className="text-sm font-bold text-cyan-400">ORACLE 3 (Enclave 3)</span>
                <span className="text-xs text-gray-500 ml-auto">Rep: 0.85 | Stake: 1200 SUI</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {oracle3Nodes.map((nodeId, idx) => {
                  const node = TREE_NODES.find(n => n.id === nodeId)!;
                  return (
                    <div key={nodeId} className="flex items-center flex-shrink-0">
                      <SubwayNode
                        node={node}
                        status={getNodeStatus(nodeId)}
                        onClick={() => setSelectedNode(node)}
                        laneColor={ORACLE_COLORS.oracle3}
                      />
                      {idx < oracle3Nodes.length - 1 && (
                        <SubwayLine
                          color={ORACLE_COLORS.oracle3}
                          active={activeNodeIds.includes(oracle3Nodes[idx + 1])}
                          completed={completedNodeIds.includes(oracle3Nodes[idx + 1])}
                          width={30}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Stage 4 & 5: Consensus & Blockchain */}
        <div className="mb-4">
          <div className="text-sm font-bold text-green-400 mb-4 flex items-center gap-2 justify-center">
            <span className="text-lg">⛓️</span>
            <span>STAGE 4 & 5: CONSENSUS & BLOCKCHAIN</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            {consensusNodes.map((nodeId, idx) => {
              const node = TREE_NODES.find(n => n.id === nodeId)!;
              return (
                <div key={nodeId} className="flex items-center">
                  <SubwayNode
                    node={node}
                    status={getNodeStatus(nodeId)}
                    onClick={() => setSelectedNode(node)}
                    laneColor="#22C55E"
                  />
                  {idx < consensusNodes.length - 1 && (
                    <SubwayLine
                      color="#22C55E"
                      active={activeNodeIds.includes(consensusNodes[idx + 1])}
                      completed={completedNodeIds.includes(consensusNodes[idx + 1])}
                      width={40}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 pt-6 border-t border-gray-800/50 flex items-center justify-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-600"></div>
            <span className="text-sm text-gray-400 font-medium">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#6366F1] animate-pulse shadow-lg shadow-[#6366F1]/50"></div>
            <span className="text-sm text-[#6366F1] font-medium">Processing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
            <span className="text-sm text-green-400 font-medium">Completed</span>
          </div>
        </div>

        {/* Tech Stack Footer */}
        <div className="mt-6 text-center">
          <div className="text-xs text-gray-500 mb-2">POWERED BY</div>
          <div className="flex items-center justify-center gap-4 flex-wrap text-xs">
            <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400">🗄️ Walrus</span>
            <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400">🔐 Seal KMS</span>
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">🛡️ Nautilus TEE</span>
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">🔍 SerpAPI</span>
            <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400">⛓️ SUI Blockchain</span>
            <span className="px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400">🤖 AI (7 Models)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
