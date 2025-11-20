'use client';

import { ApiClient } from '@/lib/api';
import { useEffect, useState } from 'react';

interface VerificationResultsProps {
  jobId: string;
}

export default function VerificationResults({ jobId }: VerificationResultsProps) {
  const [status, setStatus] = useState<string>('PENDING');
  const [progress, setProgress] = useState<number>(0);
  const [report, setReport] = useState<any>(null);
  const [attestations, setAttestations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const response = await ApiClient.getJobStatus(jobId);
        setStatus(response.status);
        setProgress(response.progress || 0);

        if (response.report) {
          setReport(response.report);
        }

        if (response.status === 'COMPLETED' || response.status === 'FAILED') {
          setPolling(false);
          setProgress(100);
          
          // Fetch attestations
          if (response.status === 'COMPLETED') {
            const attestationResponse = await ApiClient.getAttestationsByJobId(jobId);
            setAttestations(attestationResponse.attestations || []);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to check job status');
        setPolling(false);
      }
    };

    checkStatus();

    if (polling) {
      interval = setInterval(checkStatus, 3000); // Poll every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [jobId, polling]);

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'AUTHENTIC':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'AI_GENERATED':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'MANIPULATED':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getProgressMessage = () => {
    if (progress < 20) return 'Initializing verification...';
    if (progress < 40) return 'Decrypting media from Walrus...';
    if (progress < 60) return 'Running AI detection models...';
    if (progress < 80) return 'Searching for provenance...';
    if (progress < 95) return 'Computing consensus from 3 enclaves...';
    return 'Submitting attestation to Sui blockchain...';
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'PENDING':
        return (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-lg text-gray-600">Waiting in queue...</p>
            <div className="mt-4 w-full max-w-md mx-auto">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progress, 10)}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">{Math.round(progress)}%</p>
            </div>
          </div>
        );
      case 'PROCESSING':
        return (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-lg text-gray-600">{getProgressMessage()}</p>
            <div className="mt-4 w-full max-w-md mx-auto">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">{Math.round(progress)}% complete</p>
            </div>
            <div className="mt-6 space-y-2 text-sm text-gray-500">
              <p>✓ Media encrypted and stored on Walrus</p>
              {progress >= 40 && <p>✓ Decryption complete</p>}
              {progress >= 60 && <p>✓ AI models analyzing...</p>}
              {progress >= 80 && <p>✓ Provenance search complete</p>}
              {progress >= 90 && <p>✓ Consensus reached (3/3 enclaves)</p>}
            </div>
          </div>
        );
      case 'FAILED':
        return (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-red-700">Verification Failed</h3>
                <p className="mt-2 text-red-600">
                  {error || 'An error occurred during verification. This could be due to insufficient WAL tokens, network issues, or unsupported media format. Please try again.'}
                </p>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Try Another Image
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-700">Error</h3>
          <p className="mt-2 text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (status !== 'COMPLETED') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Verification in Progress</h2>
          <div className="mb-4 text-sm text-gray-500">Job ID: {jobId}</div>
          {getStatusDisplay()}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Verdict Card */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6">Verification Results</h2>
        
        <div className={`p-6 rounded-lg border-2 ${getVerdictColor(report?.verdict || 'UNKNOWN')}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">{report?.verdict || 'UNKNOWN'}</h3>
              <p className="mt-1 text-sm">
                Confidence: {((report?.confidence || 0) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-4xl">
              {report?.verdict === 'AUTHENTIC' && '✓'}
              {report?.verdict === 'AI_GENERATED' && '🤖'}
              {report?.verdict === 'MANIPULATED' && '⚠️'}
              {(!report?.verdict || report?.verdict === 'UNKNOWN') && '❓'}
            </div>
          </div>
        </div>
      </div>

      {/* AI Detection Results */}
      {report?.aiDetection && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-bold mb-4">AI Detection Analysis</h3>
          <div className="grid grid-cols-2 gap-4">
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
          
          {report.aiDetection.modelScores && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Model Scores:</h4>
              <div className="space-y-2">
                {Object.entries(report.aiDetection.modelScores).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{key}:</span>
                    <span className="font-medium">{(value * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Provenance Results */}
      {report?.provenance && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-bold mb-4">Provenance Analysis</h3>
          
          {report.provenance.matches && report.provenance.matches.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Found {report.provenance.matches.length} match(es) online
              </p>
              {report.provenance.matches.map((match: any, index: number) => (
                <div key={index} className="p-4 bg-gray-50 rounded border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <a
                        href={match.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {match.metadata?.title || 'View Source'}
                      </a>
                      <p className="text-sm text-gray-600 mt-1">
                        First seen: {new Date(match.firstSeen).toLocaleDateString()}
                      </p>
                      {match.metadata?.publisher && (
                        <p className="text-sm text-gray-600">
                          Publisher: {match.metadata.publisher}
                        </p>
                      )}
                    </div>
                    <div className="text-sm font-medium">
                      {(match.similarity * 100).toFixed(0)}% match
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No provenance matches found online.</p>
          )}
        </div>
      )}

      {/* Consensus Breakdown */}
      {report?.consensusMetadata && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-bold mb-4">Multi-Enclave Consensus</h3>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Agreement Rate</span>
              <span className="text-lg font-bold text-green-600">
                {(report.consensusMetadata.agreementRate * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${report.consensusMetadata.agreementRate * 100}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {report.consensusMetadata.participatingEnclaves} independent enclaves reached consensus
            </p>
          </div>

          {/* Individual Enclave Reports */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Individual Enclave Reports:</h4>
            {report.consensusMetadata.enclaveReports?.map((enclaveReport: any, index: number) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-mono text-sm font-medium">{enclaveReport.enclaveId}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    enclaveReport.verdict === report.verdict 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {enclaveReport.verdict}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Confidence:</span>
                    <div className="font-semibold mt-1">
                      {(enclaveReport.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Reputation:</span>
                    <div className="font-semibold mt-1">
                      {(enclaveReport.reputation * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Stake:</span>
                    <div className="font-semibold mt-1">
                      {enclaveReport.stake} tokens
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blockchain Attestation with Explorer Links */}
      {(report?.blockchainAttestation || attestations.length > 0) && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-bold mb-4">🔗 Blockchain Attestation</h3>
          
          {report?.blockchainAttestation && (
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 mb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Transaction Hash:</span>
                    <div className="font-mono text-sm mt-1 break-all">
                      {report.blockchainAttestation.txHash}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Report Storage (Walrus):</span>
                    <div className="font-mono text-xs mt-1 break-all text-gray-600">
                      {report.reportStorageCID || 'Storing...'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div>
                      <span className="text-gray-600">Network:</span>
                      <span className="ml-2 font-medium">Sui Testnet</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Timestamp:</span>
                      <span className="ml-2 font-medium">
                        {new Date(report.blockchainAttestation.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Explorer Links */}
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-sm font-medium text-gray-700 mb-2">View on Explorers:</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://suiscan.xyz/testnet/tx/${report.blockchainAttestation.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    SuiScan
                  </a>
                  <a
                    href={`https://testnet.suivision.xyz/txblock/${report.blockchainAttestation.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    SuiVision
                  </a>
                  <a
                    href={`https://explorer.sui.io/txblock/${report.blockchainAttestation.txHash}?network=testnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Sui Explorer
                  </a>
                </div>
              </div>
            </div>
          )}
          
          {/* Backwards compatibility with old format */}
          {!report?.blockchainAttestation && attestations.map((attestation, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded border border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Attestation ID:</span>
                  <div className="font-mono text-xs mt-1">{attestation.attestationId}</div>
                </div>
                <div>
                  <span className="text-gray-600">Transaction Hash:</span>
                  <div className="font-mono text-xs mt-1 truncate">{attestation.txHash}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security Info */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-semibold text-green-900">Verification Security</h4>
            <div className="mt-2 text-sm text-green-800 space-y-1">
              <p>✓ Media encrypted with Seal KMS (AES-256-GCM)</p>
              <p>✓ Processed in 3 independent Nautilus TEE enclaves</p>
              <p>✓ Results stored immutably on Walrus storage</p>
              <p>✓ Attestation recorded on Sui blockchain (testnet)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Verify Another Image
        </button>
        {report?.reportStorageCID && (
          <a
            href={`https://aggregator-testnet.walrus.space/v1/${report.reportStorageCID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
          >
            View Full Report (Walrus)
          </a>
        )}
      </div>
    </div>
  );
}

