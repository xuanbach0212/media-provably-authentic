'use client';

import { useEffect, useState } from 'react';
import { ApiClient } from '@/lib/api';

interface VerificationResultsProps {
  jobId: string;
}

export default function VerificationResults({ jobId }: VerificationResultsProps) {
  const [status, setStatus] = useState<string>('PENDING');
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

        if (response.report) {
          setReport(response.report);
        }

        if (response.status === 'COMPLETED' || response.status === 'FAILED') {
          setPolling(false);
          
          // Fetch attestations
          if (response.status === 'COMPLETED') {
            const attestationResponse = await ApiClient.getAttestationsByJobId(jobId);
            setAttestations(attestationResponse.attestations || []);
          }
        }
      } catch (err: any) {
        setError(err.message);
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

  const getStatusDisplay = () => {
    switch (status) {
      case 'PENDING':
        return (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-lg text-gray-600">Waiting to process...</p>
          </div>
        );
      case 'PROCESSING':
        return (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-lg text-gray-600">Analyzing media...</p>
            <p className="mt-2 text-sm text-gray-500">
              Running AI detection and provenance search
            </p>
          </div>
        );
      case 'FAILED':
        return (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-lg font-semibold text-red-700">Verification Failed</h3>
            <p className="mt-2 text-red-600">
              An error occurred during verification. Please try again.
            </p>
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

      {/* Blockchain Attestations */}
      {attestations.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-bold mb-4">Blockchain Attestation</h3>
          {attestations.map((attestation, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded border border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Attestation ID:</span>
                  <div className="font-mono text-xs mt-1">{attestation.attestationId}</div>
                </div>
                <div>
                  <span className="text-gray-600">Block Number:</span>
                  <div className="font-mono mt-1">{attestation.blockNumber}</div>
                </div>
                <div>
                  <span className="text-gray-600">Transaction Hash:</span>
                  <div className="font-mono text-xs mt-1 truncate">{attestation.txHash}</div>
                </div>
                <div>
                  <span className="text-gray-600">Timestamp:</span>
                  <div className="mt-1">
                    {new Date(attestation.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

