'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaCheckCircle, FaSpinner, FaClock } from 'react-icons/fa';

interface SimplifiedProgressProps {
  currentStage: number;
  substep?: string;
  progress: number;
  status: string;
}

const STAGES = [
  { id: 1, name: 'Upload', icon: '📤', color: '#3B82F6' },
  { id: 2, name: 'Encrypt', icon: '🔐', color: '#A855F7' },
  { id: 3, name: 'Oracle Processing', icon: '🛡️', color: '#6366F1', hasDetails: true },
  { id: 4, name: 'Consensus', icon: '⚖️', color: '#06B6D4' },
  { id: 5, name: 'Blockchain', icon: '⛓️', color: '#22C55E' },
];

const ORACLE_STEPS = [
  { name: 'Queue Job', icon: '📋' },
  { name: 'Decrypt Media', icon: '🔓' },
  { name: 'Fetch from Walrus', icon: '🗄️' },
  { name: 'Reverse Search', icon: '🔍' },
  { name: 'AI Detection', icon: '🤖' },
  { name: 'Store Report', icon: '📝' },
  { name: 'Submit Attestation', icon: '✍️' },
];

export default function SimplifiedProgress({ currentStage, substep, progress, status }: SimplifiedProgressProps) {
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  const getStageStatus = (stageId: number) => {
    if (stageId < currentStage) return 'completed';
    if (stageId === currentStage) return 'active';
    return 'pending';
  };

  const getOracleProgress = () => {
    if (currentStage !== 3) return { oracle1: 0, oracle2: 0, oracle3: 0 };
    
    // Simulate oracle progress based on substep
    const stepMap: { [key: string]: number } = {
      'queue': 1,
      'decrypt': 2,
      'fetch': 3,
      'reverse': 4,
      'ai': 5,
      'report': 6,
      'attest': 7,
    };

    const currentStep = Object.keys(stepMap).find(key => 
      substep?.toLowerCase().includes(key)
    ) || 'queue';

    const step = stepMap[currentStep] || 1;

    return {
      oracle1: Math.min(7, step + 1),
      oracle2: step,
      oracle3: Math.max(0, step - 1),
    };
  };

  const oracleProgress = getOracleProgress();

  const totalSteps = 5;
  // Use progress from backend if available, otherwise calculate from stage
  const progressPercent = progress > 0 ? progress : Math.round(((currentStage > 0 ? currentStage - 1 : 0) / totalSteps) * 100);

  return (
    <div className="w-full">
      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-400">
            Stage {currentStage} of {totalSteps} • {progressPercent}% Complete
          </div>
          <div className="text-xs text-gray-500">
            {status === 'PROCESSING' ? '🔄 Processing...' : status === 'COMPLETED' ? '✅ Completed' : '⏳ Ready'}
          </div>
        </div>

        {/* Single Progress Bar with Stage Icons */}
        <div className="mb-4">
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden relative">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
              }}
            />
          </div>
        </div>

        {/* Stage Icons */}
        <div className="flex justify-between px-2">
          {STAGES.map((stage) => {
            const stageStatus = getStageStatus(stage.id);
            return (
              <div
                key={stage.id}
                className="flex flex-col items-center"
              >
                <div 
                  className={`text-2xl transition-all duration-300 ${
                    stageStatus === 'completed' ? 'opacity-100 scale-110' :
                    stageStatus === 'active' ? 'opacity-100 scale-125 animate-pulse' :
                    'opacity-40 scale-100'
                  }`}
                  style={{
                    filter: stageStatus === 'active' ? `drop-shadow(0 0 8px ${stage.color})` : 'none',
                  }}
                >
                  {stage.icon}
                </div>
                <div className={`text-xs mt-1 transition-all duration-300 ${
                  stageStatus === 'completed' ? 'text-green-400 font-semibold' :
                  stageStatus === 'active' ? 'text-blue-400 font-semibold' :
                  'text-gray-500'
                }`}>
                  {stage.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expandable Oracle Details */}
      {currentStage === 3 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-xl bg-gray-900/40 border border-indigo-500/30 overflow-hidden"
        >
          {/* Header */}
          <button
            onClick={() => setExpandedStage(expandedStage === 3 ? null : 3)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛡️</span>
              <div className="text-left">
                <div className="text-sm font-semibold text-white">Multi-Oracle Processing</div>
                <div className="text-xs text-gray-400">3 Enclaves • Byzantine Fault Tolerance</div>
              </div>
            </div>
            {expandedStage === 3 ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
          </button>

          {/* Expandable Content */}
          <AnimatePresence>
            {expandedStage === 3 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-800/50"
              >
                <div className="p-6 space-y-4">
                  {/* Oracle 1 */}
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="text-sm font-semibold text-blue-400">Oracle 1 (Enclave 1)</span>
                      </div>
                      <span className="text-xs text-gray-500">Rep: 0.82</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {ORACLE_STEPS.map((step, idx) => {
                        const isCompleted = idx < oracleProgress.oracle1;
                        const isActive = idx === oracleProgress.oracle1;
                        return (
                          <div
                            key={idx}
                            className="flex-1 text-center"
                            title={step.name}
                          >
                            <div
                              className={`text-lg transition-all ${
                                isCompleted
                                  ? 'opacity-100 scale-110'
                                  : isActive
                                  ? 'opacity-70 animate-pulse'
                                  : 'opacity-30'
                              }`}
                            >
                              {isCompleted ? '✓' : step.icon}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Oracle 2 */}
                  <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                        <span className="text-sm font-semibold text-purple-400">Oracle 2 (Enclave 2)</span>
                      </div>
                      <span className="text-xs text-gray-500">Rep: 0.78</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {ORACLE_STEPS.map((step, idx) => {
                        const isCompleted = idx < oracleProgress.oracle2;
                        const isActive = idx === oracleProgress.oracle2;
                        return (
                          <div
                            key={idx}
                            className="flex-1 text-center"
                            title={step.name}
                          >
                            <div
                              className={`text-lg transition-all ${
                                isCompleted
                                  ? 'opacity-100 scale-110'
                                  : isActive
                                  ? 'opacity-70 animate-pulse'
                                  : 'opacity-30'
                              }`}
                            >
                              {isCompleted ? '✓' : step.icon}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Oracle 3 */}
                  <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                        <span className="text-sm font-semibold text-cyan-400">Oracle 3 (Enclave 3)</span>
                      </div>
                      <span className="text-xs text-gray-500">Rep: 0.85</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {ORACLE_STEPS.map((step, idx) => {
                        const isCompleted = idx < oracleProgress.oracle3;
                        const isActive = idx === oracleProgress.oracle3;
                        return (
                          <div
                            key={idx}
                            className="flex-1 text-center"
                            title={step.name}
                          >
                            <div
                              className={`text-lg transition-all ${
                                isCompleted
                                  ? 'opacity-100 scale-110'
                                  : isActive
                                  ? 'opacity-70 animate-pulse'
                                  : 'opacity-30'
                              }`}
                            >
                              {isCompleted ? '✓' : step.icon}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Current Step Info */}
      {substep && status === 'PROCESSING' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 px-4 py-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sm text-blue-300"
        >
          <FaSpinner className="inline animate-spin mr-2" />
          {substep}
        </motion.div>
      )}
    </div>
  );
}

