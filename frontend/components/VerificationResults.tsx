'use client';

import { ApiClient } from '@/lib/api';
import { ErrorUpdate, ProgressUpdate, SocketClient } from '@/lib/socket';
import { useEffect, useState } from 'react';
import { FaCheckCircle, FaSpinner, FaTimesCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import ProcessTree from './ProcessTree';
import EnsembleGauge from './charts/EnsembleGauge';
import ModelScoresBar from './charts/ModelScoresBar';
import FileInfoCard from './FileInfoCard';

interface VerificationResultsProps {
  jobId: string;
}

const STAGES = [
  { id: 1, name: 'Initializing' },
  { id: 2, name: 'Encrypting & Storing' },
  { id: 3, name: 'Dispatching to Enclaves' },
  { id: 4, name: 'Enclave Processing' },
  { id: 5, name: 'Computing Consensus' },
  { id: 6, name: 'Blockchain Attestation' },
];

export default function VerificationResults({ jobId }: VerificationResultsProps) {
  const [status, setStatus] = useState<string>('PENDING');
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [stageName, setStageName] = useState<string>('Initializing');
  const [substep, setSubstep] = useState<string>('Starting verification process...');
  const [progress, setProgress] = useState<number>(0);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryable, setRetryable] = useState<boolean>(false);
  const [socketClient] = useState(() => new SocketClient());
  
  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    aiModels: true,
    forensics: false,
    reverseSearch: false,
    blockchain: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    // Get wallet info from session storage
    const walletAddress = sessionStorage.getItem('walletAddress') || 'anonymous';
    const signature = sessionStorage.getItem('signature') || '';

    // Connect to socket
    socketClient.connect(walletAddress, signature);

    // Subscribe to job updates
    socketClient.subscribeToJob(jobId, {
      onProgress: (data: ProgressUpdate) => {
        setCurrentStage(data.stage);
        setStageName(data.stageName);
        setSubstep(data.substep);
        setProgress(data.progress);
        setStatus('PROCESSING');
      },
      onError: (errorData: ErrorUpdate) => {
        setError(errorData.message);
        setRetryable(errorData.retryable);
        setStatus('FAILED');
      },
      onComplete: (finalReport: any) => {
        setReport(finalReport);
        setStatus('COMPLETED');
        setProgress(100);
      },
    });

    // Cleanup
    return () => {
      socketClient.unsubscribeFromJob(jobId);
      socketClient.disconnect();
    };
  }, [jobId, socketClient]);

  const handleRetry = async () => {
    try {
      setError(null);
      setProgress(0);
      setStatus('PENDING');
      await ApiClient.retryJob(jobId);
    } catch (err: any) {
      setError(err.message || 'Failed to retry');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'bg-red-500';
    if (score >= 0.5) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return { text: 'High AI Likelihood', color: 'text-red-700' };
    if (score >= 0.5) return { text: 'Medium Likelihood', color: 'text-orange-700' };
    return { text: 'Low AI Likelihood', color: 'text-green-700' };
  };

  // Error Display
  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full p-8 bg-dark-surface border border-red-900 rounded-lg">
          <div className="flex items-center mb-4">
            <FaTimesCircle className="text-red-500 text-4xl mr-4" />
            <div>
              <h3 className="text-xl font-bold text-red-400">Analysis Failed</h3>
              <p className="mt-1 text-dark-text">{error}</p>
            </div>
          </div>
          {retryable && (
            <button
              onClick={handleRetry}
              className="mt-4 bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition"
            >
              Retry Analysis
            </button>
          )}
          {!retryable && (
            <button
              onClick={() => window.location.href = '/'}
              className="mt-4 bg-gray-600 text-white py-2 px-6 rounded-lg hover:bg-gray-700 transition"
            >
              Return Home
            </button>
          )}
        </div>
      </div>
    );
  }

  // Processing Display - WITH TREE
  if (status !== 'COMPLETED' || !report) {
    return (
      <div className="min-h-screen bg-dark-bg p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-dark-text mb-2 text-center">Analysis in Progress</h1>
          <p className="text-dark-muted text-center mb-6 text-sm">Job ID: {jobId}</p>

          {/* Process Tree - Always visible */}
          <div className="mb-6 bg-dark-surface border border-dark-border rounded-lg p-6">
            <div className="flex justify-between items-start">
              {STAGES.map((stage, idx) => {
                const isCompleted = stage.id < currentStage;
                const isActive = stage.id === currentStage;
                const isPending = stage.id > currentStage;
                
                return (
                  <div key={stage.id} className="flex flex-col items-center flex-1 relative">
                    {/* Node */}
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center mb-2 transition-all
                        ${isCompleted ? 'bg-green-500 border-green-400' : ''}
                        ${isActive ? 'bg-blue-600 border-blue-400 scale-110 node-active' : ''}
                        ${isPending ? 'bg-gray-700 border-gray-600' : ''}
                      `}
                    >
                      {isCompleted && <FaCheckCircle className="text-white text-lg" />}
                      {isActive && <FaSpinner className="text-white text-lg animate-spin" />}
                      {isPending && <span className="text-gray-500 text-sm">{stage.id}</span>}
                    </div>
                    
                    {/* Label */}
                    <div className={`text-xs sm:text-sm text-center ${isActive ? 'text-blue-400 font-semibold' : isCompleted ? 'text-green-400' : 'text-dark-muted'}`}>
                      {stage.name}
                    </div>

                    {/* Connector Line */}
                    {idx < STAGES.length - 1 && (
                      <div 
                        className={`absolute top-5 sm:top-6 left-[60%] w-full h-0.5 transition-colors
                          ${isCompleted ? 'bg-green-500' : 'bg-gray-700'}
                        `}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress Details */}
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark-text">{stageName}</h3>
              <span className="text-xl font-bold text-blue-400">{progress.toFixed(0)}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-dark-bg rounded-full h-3 mb-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Substep */}
            <p className="text-dark-muted text-sm">{substep}</p>
          </div>

          {/* What's Happening */}
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
            <h4 className="text-base font-semibold text-dark-text mb-3">What's Happening</h4>
            <div className="space-y-1 text-sm text-dark-muted">
              {currentStage === 1 && <p>• Setting up analysis environment</p>}
              {currentStage === 2 && <p>• Encrypting media and storing securely on Walrus</p>}
              {currentStage === 3 && <p>• Dispatching verification job to trusted enclaves</p>}
              {currentStage === 4 && (
                <>
                  <p>• Running AI detection models (7+ specialized models)</p>
                  <p>• Performing forensic analysis</p>
                  <p>• Conditionally running reverse search</p>
                </>
              )}
              {currentStage === 5 && <p>• Aggregating results from multiple enclaves</p>}
              {currentStage === 6 && <p>• Creating blockchain attestation on Sui</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results Display - Everything in ONE PAGE (Tree + Metrics)
  const suiTxHash = report.blockchainAttestation?.txHash;
  const analysisData = report.analysisData;
  const aiDetection = analysisData?.aiDetection;
  const reverseSearch = analysisData?.reverseSearch;
  const ensembleScore = aiDetection?.ensembleScore || 0;
  const scoreInfo = getScoreLabel(ensembleScore);

  return (
    <div className="min-h-screen bg-dark-bg p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-dark-text mb-2 text-center">✅ Analysis Complete</h1>
        <p className="text-dark-muted text-center mb-6 text-sm">Job ID: {jobId}</p>

        {/* Compact Completed Steps - Show at top */}
        <div className="mb-8 bg-dark-surface border border-dark-border rounded-lg p-4">
          <div className="flex justify-between items-start">
            {STAGES.map((stage, idx) => (
              <div key={stage.id} className="flex flex-col items-center flex-1 relative">
                {/* Completed Node */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 bg-green-500 border-green-400 flex items-center justify-center mb-2">
                  <FaCheckCircle className="text-white text-lg" />
                </div>
                
                {/* Label */}
                <div className="text-xs sm:text-sm text-center text-green-400 font-semibold">
                  {stage.name}
                </div>

                {/* Connector Line */}
                {idx < STAGES.length - 1 && (
                  <div className="absolute top-5 sm:top-6 left-[60%] w-full h-0.5 bg-green-500" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* All Metrics Below */}
        <div className="space-y-6">
          {/* Ensemble Score with Gauge */}
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-dark-text mb-4 text-center">AI Detection Score</h2>
            <EnsembleGauge score={ensembleScore} />
          </div>

          {/* File Information */}
          <FileInfoCard
            filename={analysisData?.forensicAnalysis?.filename}
            fileSize={analysisData?.forensicAnalysis?.fileSize}
            mimeType={analysisData?.forensicAnalysis?.mimeType}
            uploadedAt={analysisData?.forensicAnalysis?.uploadedAt}
            mediaHash={report.mediaHash}
            metadata={aiDetection?.metadata}
            forensicAnalysis={aiDetection?.forensicAnalysis}
          />

            {/* AI Detection Models Panel */}
            {aiDetection && (
              <div className="bg-dark-surface border border-dark-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('aiModels')}
                  className="w-full p-6 flex items-center justify-between hover:bg-dark-bg transition"
                >
                  <h3 className="text-xl font-bold text-dark-text">🤖 AI Detection Models</h3>
                  {expandedSections.aiModels ? <FaChevronUp className="text-dark-muted" /> : <FaChevronDown className="text-dark-muted" />}
                </button>
                
                {expandedSections.aiModels && (
                  <div className="p-6 pt-0 space-y-6">
                    {/* Bar Chart */}
                    {aiDetection.modelScores?.individual_models && (
                      <div>
                        <h4 className="font-semibold text-dark-text mb-4">Individual Model Scores:</h4>
                        <ModelScoresBar modelScores={aiDetection.modelScores} />
                      </div>
                    )}

                    {/* Aggregate Scores */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-dark-bg border border-blue-900 rounded">
                        <div className="text-xs text-dark-muted">AI Generated</div>
                        <div className="text-2xl font-bold text-blue-400">{(aiDetection.modelScores?.ai_generated_score * 100 || 0).toFixed(1)}%</div>
                      </div>
                      <div className="p-4 bg-dark-bg border border-purple-900 rounded">
                        <div className="text-xs text-dark-muted">Deepfake</div>
                        <div className="text-2xl font-bold text-purple-400">{(aiDetection.modelScores?.deepfake_score * 100 || 0).toFixed(1)}%</div>
                      </div>
                      <div className="p-4 bg-dark-bg border border-red-900 rounded">
                        <div className="text-xs text-dark-muted">Manipulation</div>
                        <div className="text-2xl font-bold text-red-400">{(aiDetection.modelScores?.manipulation_score * 100 || 0).toFixed(1)}%</div>
                      </div>
                      <div className="p-4 bg-dark-bg border border-green-900 rounded">
                        <div className="text-xs text-dark-muted">Authenticity</div>
                        <div className="text-2xl font-bold text-green-400">{(aiDetection.modelScores?.authenticity_score * 100 || 0).toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Forensic Analysis Panel */}
            {aiDetection?.forensicAnalysis && (
              <div className="bg-dark-surface border border-dark-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('forensics')}
                  className="w-full p-6 flex items-center justify-between hover:bg-dark-bg transition"
                >
                  <h3 className="text-xl font-bold text-dark-text">🔬 Forensic Analysis</h3>
                  {expandedSections.forensics ? <FaChevronUp className="text-dark-muted" /> : <FaChevronDown className="text-dark-muted" />}
                </button>
                
                {expandedSections.forensics && (
                  <div className="p-6 pt-0">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 bg-dark-bg border border-dark-border rounded">
                        <div className="text-sm text-dark-muted">Compression Artifacts</div>
                        <div className="text-xl font-bold text-dark-text">{(aiDetection.forensicAnalysis.compressionArtifacts || 0).toFixed(3)}</div>
                      </div>
                      {aiDetection.qualityMetrics && (
                        <>
                          <div className="p-4 bg-dark-bg border border-dark-border rounded">
                            <div className="text-sm text-dark-muted">Sharpness</div>
                            <div className="text-xl font-bold text-dark-text">{(aiDetection.qualityMetrics.sharpness || 0).toFixed(2)}</div>
                          </div>
                          <div className="p-4 bg-dark-bg border border-dark-border rounded">
                            <div className="text-sm text-dark-muted">Contrast</div>
                            <div className="text-xl font-bold text-dark-text">{(aiDetection.qualityMetrics.contrast || 0).toFixed(2)}</div>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Raw JSON expandable */}
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-dark-muted hover:text-dark-text">
                        View Raw Forensic Data (JSON)
                      </summary>
                      <pre className="mt-2 p-4 bg-dark-bg rounded text-xs text-green-400 overflow-auto max-h-64 border border-dark-border">
                        {JSON.stringify(aiDetection.forensicAnalysis, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            )}

            {/* Reverse Search Panel */}
            {reverseSearch && (
              <div className="bg-dark-surface border border-dark-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('reverseSearch')}
                  className="w-full p-6 flex items-center justify-between hover:bg-dark-bg transition"
                >
                  <h3 className="text-xl font-bold text-dark-text">
                    🔍 Reverse Search {reverseSearch.matches.length > 0 ? `(${reverseSearch.matches.length} matches)` : '(No matches)'}
                  </h3>
                  {expandedSections.reverseSearch ? <FaChevronUp className="text-dark-muted" /> : <FaChevronDown className="text-dark-muted" />}
                </button>
                
                {expandedSections.reverseSearch && (
                  <div className="p-6 pt-0">
                    {reverseSearch.matches.length > 0 ? (
                      <div className="space-y-3">
                        {reverseSearch.matches.map((match: any, idx: number) => (
                          <div key={idx} className="p-4 bg-dark-bg border border-dark-border rounded">
                            <a 
                              href={match.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline text-sm break-all"
                            >
                              {match.url}
                            </a>
                            <div className="mt-2 flex justify-between text-xs text-dark-muted">
                              <span>Similarity: {(match.similarity * 100).toFixed(1)}%</span>
                              <span>First Seen: {match.firstSeen?.substring(0, 10) || 'N/A'}</span>
                            </div>
                            {match.metadata?.title && (
                              <div className="mt-1 text-sm text-dark-text">{match.metadata.title}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-dark-muted text-center py-4">
                        No matches found. This could indicate the image has not been published online before.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Blockchain Attestation Panel */}
            {report.blockchainAttestation && (
              <div className="bg-dark-surface border border-dark-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('blockchain')}
                  className="w-full p-6 flex items-center justify-between hover:bg-dark-bg transition"
                >
                  <h3 className="text-xl font-bold text-dark-text">⛓️ Blockchain Attestation</h3>
                  {expandedSections.blockchain ? <FaChevronUp className="text-dark-muted" /> : <FaChevronDown className="text-dark-muted" />}
                </button>
                
                {expandedSections.blockchain && (
                  <div className="p-6 pt-0 space-y-4">
                    <div className="p-4 bg-dark-bg border border-dark-border rounded">
                      <p className="text-sm text-dark-muted mb-2">Transaction Hash:</p>
                      <p className="font-mono text-xs text-dark-text break-all">{suiTxHash}</p>
                    </div>
                    {report.reportStorageCID && (
                      <div className="p-4 bg-dark-bg border border-dark-border rounded">
                        <p className="text-sm text-dark-muted mb-2">Walrus Report CID:</p>
                        <p className="font-mono text-xs text-dark-text break-all">{report.reportStorageCID}</p>
                      </div>
                    )}
                    {suiTxHash && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <a
                          href={`https://suiscan.xyz/testnet/tx/${suiTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center px-4 py-2 border border-blue-600 rounded-lg text-blue-400 hover:bg-blue-900/20 transition"
                        >
                          SuiScan
                        </a>
                        <a
                          href={`https://testnet.suivision.xyz/txblock/${suiTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center px-4 py-2 border border-blue-600 rounded-lg text-blue-400 hover:bg-blue-900/20 transition"
                        >
                          SuiVision
                        </a>
                        <a
                          href={`https://explorer.sui.io/txblock/${suiTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center px-4 py-2 border border-blue-600 rounded-lg text-blue-400 hover:bg-blue-900/20 transition"
                        >
                          Sui Explorer
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          {/* Actions */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Analyze Another Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

