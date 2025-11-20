'use client';

import { ApiClient } from '@/lib/api';
import { ErrorUpdate, ProgressUpdate, SocketClient } from '@/lib/socket';
import { useEffect, useState } from 'react';
import { FaCheckCircle, FaSpinner, FaTimesCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';

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
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-4">
            <FaTimesCircle className="text-red-500 text-4xl mr-4" />
            <div>
              <h3 className="text-xl font-bold text-red-700">Analysis Failed</h3>
              <p className="mt-1 text-red-600">{error}</p>
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

  // Processing Display
  if (status !== 'COMPLETED' || !report) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Analysis in Progress</h2>
          <div className="mb-4 text-sm text-gray-500 text-center">Job ID: {jobId}</div>

          {/* Stage Indicators */}
          <div className="flex justify-between items-center mb-8">
            {STAGES.map((stage, index) => (
              <div key={stage.id} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStage > stage.id
                      ? 'bg-green-500 text-white'
                      : currentStage === stage.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {currentStage > stage.id ? (
                    <FaCheckCircle />
                  ) : currentStage === stage.id ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    stage.id
                  )}
                </div>
                <div className="mt-2 text-xs text-center text-gray-600">{stage.name}</div>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{stageName}</span>
              <span className="text-sm font-medium text-gray-700">{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-600">{substep}</p>
          </div>

          {/* Loading Animation */}
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  // Results Display - Technical Metrics Dashboard
  const suiTxHash = report.blockchainAttestation?.txHash;
  const analysisData = report.analysisData;
  const aiDetection = analysisData?.aiDetection;
  const reverseSearch = analysisData?.reverseSearch;
  const ensembleScore = aiDetection?.ensembleScore || 0;
  const scoreInfo = getScoreLabel(ensembleScore);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header - Ensemble Score */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-2 text-center">Analysis Complete</h2>
        <p className="text-center text-gray-600 mb-6">Technical Metrics Dashboard</p>
        
        {/* Ensemble Score Card */}
        <div className="p-6 bg-gray-50 rounded-lg border-2 border-gray-300">
          <div className="text-center mb-4">
            <div className="text-sm text-gray-600 mb-2">AI Detection Ensemble Score</div>
            <div className="text-6xl font-bold font-mono mb-2">{(ensembleScore * 100).toFixed(1)}%</div>
            <div className={`text-lg font-semibold ${scoreInfo.color}`}>{scoreInfo.text}</div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${getScoreColor(ensembleScore)}`}
              style={{ width: `${(ensembleScore * 100).toFixed(0)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            Score represents likelihood of AI generation (0-100%). Higher = more likely AI-generated.
          </p>
        </div>
      </div>

      {/* AI Detection Models Panel */}
      {aiDetection && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={() => toggleSection('aiModels')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition"
          >
            <h3 className="text-xl font-bold">🤖 AI Detection Models</h3>
            {expandedSections.aiModels ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          
          {expandedSections.aiModels && (
            <div className="p-6 pt-0 space-y-4">
              {/* Model Scores */}
              {aiDetection.modelScores?.individual_models && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">Individual Model Scores:</h4>
                  {Object.entries(aiDetection.modelScores.individual_models).map(([model, scores]: [string, any]) => (
                    <div key={model} className="bg-gray-50 rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm text-gray-700">{model}</span>
                        <span className="font-mono font-bold">{(scores.ai_score * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={getScoreColor(scores.ai_score)}
                          style={{ width: `${(scores.ai_score * 100).toFixed(0)}%` }}
                        />
                      </div>
                      <div className="mt-2 text-xs text-gray-500 flex justify-between">
                        <span>Deepfake: {(scores.deepfake_score * 100).toFixed(1)}%</span>
                        <span>Confidence: {(scores.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Aggregate Scores */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="p-4 bg-blue-50 rounded">
                  <div className="text-xs text-gray-600">AI Generated</div>
                  <div className="text-2xl font-bold">{(aiDetection.modelScores?.ai_generated_score * 100 || 0).toFixed(1)}%</div>
                </div>
                <div className="p-4 bg-purple-50 rounded">
                  <div className="text-xs text-gray-600">Deepfake</div>
                  <div className="text-2xl font-bold">{(aiDetection.modelScores?.deepfake_score * 100 || 0).toFixed(1)}%</div>
                </div>
                <div className="p-4 bg-red-50 rounded">
                  <div className="text-xs text-gray-600">Manipulation</div>
                  <div className="text-2xl font-bold">{(aiDetection.modelScores?.manipulation_score * 100 || 0).toFixed(1)}%</div>
                </div>
                <div className="p-4 bg-green-50 rounded">
                  <div className="text-xs text-gray-600">Authenticity</div>
                  <div className="text-2xl font-bold">{(aiDetection.modelScores?.authenticity_score * 100 || 0).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Forensic Analysis Panel */}
      {aiDetection?.forensicAnalysis && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={() => toggleSection('forensics')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition"
          >
            <h3 className="text-xl font-bold">🔬 Forensic Analysis</h3>
            {expandedSections.forensics ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          
          {expandedSections.forensics && (
            <div className="p-6 pt-0">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded">
                  <div className="text-sm text-gray-600">Compression Artifacts</div>
                  <div className="text-xl font-bold">{(aiDetection.forensicAnalysis.compressionArtifacts || 0).toFixed(3)}</div>
                </div>
                {aiDetection.qualityMetrics && (
                  <>
                    <div className="p-4 bg-gray-50 rounded">
                      <div className="text-sm text-gray-600">Sharpness</div>
                      <div className="text-xl font-bold">{(aiDetection.qualityMetrics.sharpness || 0).toFixed(2)}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded">
                      <div className="text-sm text-gray-600">Contrast</div>
                      <div className="text-xl font-bold">{(aiDetection.qualityMetrics.contrast || 0).toFixed(2)}</div>
                    </div>
                  </>
                )}
              </div>
              
              {/* Raw JSON expandable */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                  View Raw Forensic Data (JSON)
                </summary>
                <pre className="mt-2 p-4 bg-gray-900 text-green-400 rounded text-xs overflow-auto max-h-64">
                  {JSON.stringify(aiDetection.forensicAnalysis, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}

      {/* Reverse Search Panel */}
      {reverseSearch && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={() => toggleSection('reverseSearch')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition"
          >
            <h3 className="text-xl font-bold">
              🔍 Reverse Search {reverseSearch.matches.length > 0 ? `(${reverseSearch.matches.length} matches)` : '(No matches)'}
            </h3>
            {expandedSections.reverseSearch ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          
          {expandedSections.reverseSearch && (
            <div className="p-6 pt-0">
              {reverseSearch.matches.length > 0 ? (
                <div className="space-y-3">
                  {reverseSearch.matches.map((match: any, idx: number) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded border border-gray-200">
                      <a 
                        href={match.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm break-all"
                      >
                        {match.url}
                      </a>
                      <div className="mt-2 flex justify-between text-xs text-gray-600">
                        <span>Similarity: {(match.similarity * 100).toFixed(1)}%</span>
                        <span>First Seen: {match.firstSeen?.substring(0, 10) || 'N/A'}</span>
                      </div>
                      {match.metadata?.title && (
                        <div className="mt-1 text-sm text-gray-700">{match.metadata.title}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">
                  No matches found. This could indicate the image has not been published online before.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Blockchain Attestation Panel */}
      {report.blockchainAttestation && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={() => toggleSection('blockchain')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition"
          >
            <h3 className="text-xl font-bold">⛓️ Blockchain Attestation</h3>
            {expandedSections.blockchain ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          
          {expandedSections.blockchain && (
            <div className="p-6 pt-0 space-y-4">
              <div className="p-4 bg-gray-50 rounded border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Transaction Hash:</p>
                <p className="font-mono text-xs break-all">{suiTxHash}</p>
              </div>
              {report.reportStorageCID && (
                <div className="p-4 bg-gray-50 rounded border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Walrus Report CID:</p>
                  <p className="font-mono text-xs break-all">{report.reportStorageCID}</p>
                </div>
              )}
              {suiTxHash && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <a
                    href={`https://suiscan.xyz/testnet/tx/${suiTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-4 py-2 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-50 transition"
                  >
                    SuiScan
                  </a>
                  <a
                    href={`https://testnet.suivision.xyz/txblock/${suiTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-4 py-2 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-50 transition"
                  >
                    SuiVision
                  </a>
                  <a
                    href={`https://explorer.sui.io/txblock/${suiTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-4 py-2 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-50 transition"
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
      <div className="flex justify-center gap-4">
        <button
          onClick={() => window.location.href = '/'}
          className="bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Analyze Another Image
        </button>
      </div>
    </div>
  );
}

