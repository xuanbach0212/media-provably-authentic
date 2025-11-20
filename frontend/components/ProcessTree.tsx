'use client';

import { FaCheckCircle, FaSpinner, FaTimesCircle } from 'react-icons/fa';

interface ProcessNode {
  id: number;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface ProcessTreeProps {
  currentStage: number;
  stages: Array<{ id: number; name: string }>;
  substep?: string;
  error?: string | null;
}

export default function ProcessTree({ currentStage, stages, substep, error }: ProcessTreeProps) {
  const getNodeStatus = (stageId: number): 'pending' | 'in_progress' | 'completed' | 'failed' => {
    if (error && stageId === currentStage) return 'failed';
    if (stageId < currentStage) return 'completed';
    if (stageId === currentStage) return 'in_progress';
    return 'pending';
  };

  const getNodeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 border-green-400';
      case 'in_progress':
        return 'bg-blue-600 border-blue-400 node-active';
      case 'failed':
        return 'bg-red-500 border-red-400 node-error';
      default:
        return 'bg-gray-700 border-gray-600';
    }
  };

  const getNodeIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle className="text-white text-xl" />;
      case 'in_progress':
        return <FaSpinner className="text-white text-xl animate-spin" />;
      case 'failed':
        return <FaTimesCircle className="text-white text-xl" />;
      default:
        return <div className="w-3 h-3 rounded-full bg-gray-500" />;
    }
  };

  const getLineColor = (fromStage: number) => {
    const status = getNodeStatus(fromStage);
    if (status === 'completed') return 'border-green-500';
    if (status === 'in_progress') return 'border-blue-500 connection-line';
    return 'border-gray-700';
  };

  return (
    <div className="flex flex-col items-center py-8 px-4 bg-dark-surface rounded-lg border border-dark-border h-full">
      <h3 className="text-lg font-bold text-dark-text mb-8">Process Flow</h3>
      
      <div className="flex flex-col items-center space-y-0 w-full max-w-xs">
        {stages.map((stage, index) => {
          const status = getNodeStatus(stage.id);
          const isActive = stage.id === currentStage;

          return (
            <div key={stage.id} className="flex flex-col items-center w-full">
              {/* Node */}
              <div className="flex flex-col items-center node-enter">
                <div
                  className={`
                    w-16 h-16 rounded-full border-4 flex items-center justify-center
                    transition-all-smooth ${getNodeColor(status)}
                    ${isActive ? 'scale-110' : 'scale-100'}
                  `}
                >
                  {getNodeIcon(status)}
                </div>
                
                {/* Stage Name */}
                <div className="mt-3 text-center">
                  <div className={`text-sm font-semibold ${isActive ? 'text-blue-400' : 'text-dark-text'}`}>
                    {stage.name}
                  </div>
                  
                  {/* Substep */}
                  {isActive && substep && (
                    <div className="mt-1 text-xs text-dark-muted max-w-[200px]">
                      {substep}
                    </div>
                  )}
                  
                  {/* Error */}
                  {status === 'failed' && error && (
                    <div className="mt-1 text-xs text-red-400 max-w-[200px]">
                      {error}
                    </div>
                  )}
                </div>
              </div>

              {/* Connection Line */}
              {index < stages.length - 1 && (
                <div className="flex flex-col items-center my-2">
                  <div
                    className={`
                      w-1 h-12 border-l-2 transition-all-smooth
                      ${getLineColor(stage.id)}
                    `}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

