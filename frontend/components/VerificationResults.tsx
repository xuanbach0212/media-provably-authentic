'use client';

import { ApiClient } from '@/lib/api';
import { ErrorUpdate, ProgressUpdate, SocketClient } from '@/lib/socket';
import { useEffect, useState } from 'react';
import { FaCheckCircle, FaSpinner, FaTimesCircle } from 'react-icons/fa';

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

  useEffect(() => {
    // Get wallet info from session storage
    const walletAddress = sessionStorage.getItem('walletAddress') || 'anonymous';
    const signature = sessionStorage.getItem('signature') || '';

    // Connect to socket
    socketClient.connect(walletAddress, signature);

    // Subscribe to job updates
    socketClient.subscribeToJob(jobId, {
      onProgress: (data: ProgressUpdate) => {
        console.log('[VerificationResults] Progress:', data);
        setCurrentStage(data.stage);
        setStageName(data.stageName);
        setSubstep(data.substep);
        setProgress(data.progress);
        setStatus('PROCESSING');
      },
      onError: (errorData: ErrorUpdate) => {
        console.error('[VerificationResults] Error:', errorData);
        setError(errorData.message);
        setRetryable(errorData.retryable);
        setStatus('FAILED');
      },
      onComplete: (finalReport: any) => {
        console.log('[VerificationResults] Complete:', finalReport);
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

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'AUTHENTIC':
      case 'REAL':
        return 'text-green-700 bg-green-100 border-green-300';
      case 'AI_GENERATED':
        return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'MANIPULATED':
        return 'text-red-700 bg-red-100 border-red-300';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return { label: 'High', color: 'text-green-700' };
    if (confidence >= 0.6) return { label: 'Medium', color: 'text-yellow-700' };
    return { label: 'Low - Review Recommended', color: 'text-orange-700' };
  };

  const isBorderlineCase = report && report.confidence < 0.7;

  // Error Display
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-4">
            <FaTimesCircle className="text-red-500 text-4xl mr-4" />
            <div>
              <h3 className="text-xl font-bold text-red-700">Verification Failed</h3>
              <p className="mt-1 text-red-600">{error}</p>
            </div>
          </div>
          {retryable && (
            <button
              onClick={handleRetry}
              className="mt-4 bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition"
            >
              Retry Verification
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
          <h2 className="text-2xl font-bold mb-6 text-center">Verification in Progress</h2>
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
                {index < STAGES.length - 1 && (
                  <div
                    className={`absolute h-0.5 ${
                      currentStage > stage.id ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    style={{
                      width: 'calc(100% / 6)',
                      top: '20px',
                      left: `calc((100% / 6) * ${index} + 50%)`,
                    }}
                  />
                )}
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

  // Results Display
  const suiTxHash = report.blockchainAttestation?.txHash;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Verdict Card */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Verification Complete</h2>

        <div className={`p-6 rounded-lg border-2 ${getVerdictColor(report.verdict)}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-2xl font-bold">{report.verdict}</h3>
              <p className="mt-1 text-lg">
                Confidence: {((report.confidence || 0) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-5xl">
              {(report.verdict === 'AUTHENTIC' || report.verdict === 'REAL') && '✅'}
              {report.verdict === 'AI_GENERATED' && '🤖'}
              {report.verdict === 'MANIPULATED' && '⚠️'}
              {report.verdict === 'UNKNOWN' && '❓'}
            </div>
          </div>
          
          {/* Confidence Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className={`font-semibold ${getConfidenceLabel(report.confidence).color}`}>
                {getConfidenceLabel(report.confidence).label}
              </span>
              <span className="text-gray-600">{((report.confidence || 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${getConfidenceColor(report.confidence)}`}
                style={{ width: `${(report.confidence * 100).toFixed(0)}%` }}
              />
            </div>
          </div>

          {/* Borderline Case Warning */}
          {isBorderlineCase && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm">
              <p className="font-semibold text-yellow-800">⚠️ Low Confidence Detection</p>
              <p className="text-yellow-700 mt-1">
                This result has relatively low confidence. Consider manual review or additional verification.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* AI Detection Results - Enhanced */}
      {report.aiDetection && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-bold mb-4">🤖 AI Detection Analysis</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Verdict</div>
              <div className="text-lg font-semibold">{report.aiDetection.verdict}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Confidence</div>
              <div className="text-lg font-semibold">
                {(report.aiDetection.confidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Model Scores Breakdown */}
          {report.aiDetection.modelScores && Object.keys(report.aiDetection.modelScores).length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-semibold mb-4 text-gray-700">Individual Model Scores</h4>
              <div className="space-y-3">
                {Object.entries(report.aiDetection.modelScores).map(([modelKey, scores]: [string, any]) => {
                  if (!Array.isArray(scores)) return null;
                  const aiScore = scores.find((s: any) => s.label?.toLowerCase().includes('ai') || s.label?.toLowerCase().includes('fake'))?.score || 0;
                  const modelName = modelKey.replace('_predictions', '').toUpperCase();
                  
                  return (
                    <div key={modelKey} className="bg-gray-50 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{modelName}</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {(aiScore * 100).toFixed(1)}% AI
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${aiScore > 0.6 ? 'bg-orange-500' : 'bg-green-500'}`}
                          style={{ width: `${(aiScore * 100).toFixed(0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quality & Forensics Summary */}
          {(report.aiDetection.qualityReport || report.aiDetection.forensicAnalysis) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-semibold mb-4 text-gray-700">Additional Analysis</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {report.aiDetection.qualityReport && (
                  <div className="p-4 bg-blue-50 rounded border border-blue-200">
                    <div className="text-sm font-semibold text-blue-800 mb-2">Image Quality</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {(report.aiDetection.qualityReport.overall_quality * 100).toFixed(0)}%
                    </div>
                    {report.aiDetection.qualityReport.enhancement_applied && (
                      <div className="text-xs text-blue-700 mt-1">
                        Enhancement: {report.aiDetection.qualityReport.enhancement_applied}
                      </div>
                    )}
                  </div>
                )}
                {report.aiDetection.forensicAnalysis && (
                  <div className="p-4 bg-purple-50 rounded border border-purple-200">
                    <div className="text-sm font-semibold text-purple-800 mb-2">Manipulation Likelihood</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {(report.aiDetection.forensicAnalysis.manipulation_likelihood * 100).toFixed(0)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multi-Enclave Consensus */}
      {report.consensusMetadata && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-bold mb-4">Multi-Enclave Consensus</h3>
          <p className="text-sm text-gray-600 mb-4">
            Consensus reached among {report.consensusMetadata.participatingEnclaves} independent enclaves
          </p>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-purple-600 h-3 rounded-full"
              style={{ width: `${(report.consensusMetadata.agreementRate * 100).toFixed(0)}%` }}
            />
          </div>
          <p className="text-sm font-semibold mb-6">
            Agreement Rate: {(report.consensusMetadata.agreementRate * 100).toFixed(1)}%
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {report.consensusMetadata.enclaveReports.map((enclaveReport: any, index: number) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  enclaveReport.verdict === report.verdict
                    ? 'border-green-300 bg-green-50'
                    : 'border-yellow-300 bg-yellow-50'
                }`}
              >
                <h4 className="font-semibold text-gray-800">Enclave {enclaveReport.enclaveId.split('_')[1]}</h4>
                <p className="text-sm text-gray-600">
                  Verdict: <span className="font-medium">{enclaveReport.verdict}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Confidence: <span className="font-medium">{(enclaveReport.confidence * 100).toFixed(1)}%</span>
                </p>
                <p className="text-sm text-gray-600">
                  Reputation: <span className="font-medium">{enclaveReport.reputation.toFixed(2)}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blockchain Attestation */}
      {report.blockchainAttestation && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-bold mb-4">Blockchain Attestation</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded border border-gray-200">
              <p className="text-sm text-gray-600">Transaction Hash:</p>
              <p className="font-mono text-xs break-all mt-1">{suiTxHash}</p>
            </div>
            {report.reportStorageCID && (
              <div className="p-4 bg-gray-50 rounded border border-gray-200">
                <p className="text-sm text-gray-600">Walrus Report CID:</p>
                <p className="font-mono text-xs break-all mt-1">{report.reportStorageCID}</p>
              </div>
            )}
          </div>

          {suiTxHash && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Actions */}
      <div className="flex justify-center gap-4">
        {isBorderlineCase && (
          <button
            onClick={() => {
              alert(
                `Review Recommended:\n\n` +
                `Verdict: ${report.verdict}\n` +
                `Confidence: ${(report.confidence * 100).toFixed(1)}%\n\n` +
                `Due to low confidence, this result should be manually reviewed by a human expert.\n` +
                `Consider factors like image context, source credibility, and visual artifacts.`
              );
            }}
            className="bg-yellow-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-yellow-700 transition flex items-center gap-2"
          >
            <span>⚠️</span>
            <span>Flag for Review</span>
          </button>
        )}
        <button
          onClick={() => window.location.href = '/'}
          className="bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Verify Another Image
        </button>
      </div>
    </div>
  );
}
