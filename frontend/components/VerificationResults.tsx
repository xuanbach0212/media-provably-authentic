'use client';

import { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import EnsembleGauge from './charts/EnsembleGauge';
import ModelScoresBar from './charts/ModelScoresBar';
import FileInfoCard from './FileInfoCard';

interface VerificationResultsProps {
  report: any;
}

export default function VerificationResults({ report }: VerificationResultsProps) {
  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    aiModels: true,
    forensics: false,
    reverseSearch: false,
    blockchain: true,
    rawForensics: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const analysisData = report.analysisData;
  const ensembleScore = analysisData?.aiDetection?.ensembleScore || 0;

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return { text: 'High AI Likelihood', color: 'text-red-400' };
    if (score >= 0.5) return { text: 'Medium Likelihood', color: 'text-orange-400' };
    return { text: 'Low AI Likelihood', color: 'text-green-400' };
  };

  const scoreInfo = getScoreLabel(ensembleScore);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Ensemble Score Gauge */}
      <EnsembleGauge score={ensembleScore} />

      {/* File Information Card */}
      {analysisData?.aiDetection?.forensicAnalysis && (
        <FileInfoCard
          filename={report.metadata?.filename || 'N/A'}
          mimeType={report.metadata?.mimeType || 'N/A'}
          fileSize={report.metadata?.size || 0}
          mediaHash={report.mediaHash || 'N/A'}
          forensicAnalysis={analysisData.aiDetection.forensicAnalysis}
        />
      )}

      {/* AI Detection Models */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6 mb-6">
        <button
          onClick={() => toggleSection('aiModels')}
          className="flex justify-between items-center w-full text-dark-text hover:text-[#4DA2FF] transition-colors"
        >
          <h3 className="text-xl font-bold">🤖 AI Detection Models</h3>
          {expandedSections.aiModels ? <FaChevronUp /> : <FaChevronDown />}
        </button>
        {expandedSections.aiModels && analysisData?.aiDetection?.modelScores && (
          <div className="mt-4 pt-4 border-t border-dark-border">
            {analysisData.aiDetection.modelScores.individual_models && (
              <ModelScoresBar modelScores={analysisData.aiDetection.modelScores.individual_models} />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-dark-muted mt-4">
              <p><strong>Aggregate AI Score:</strong> {(analysisData.aiDetection.modelScores.ai_generated_score * 100).toFixed(1)}%</p>
              <p><strong>Aggregate Deepfake Score:</strong> {(analysisData.aiDetection.modelScores.deepfake_score * 100).toFixed(1)}%</p>
              <p><strong>Aggregate Manipulation Score:</strong> {(analysisData.aiDetection.modelScores.manipulation_score * 100).toFixed(1)}%</p>
              <p><strong>Aggregate Authenticity Score:</strong> {(analysisData.aiDetection.modelScores.authenticity_score * 100).toFixed(1)}%</p>
              <p><strong>Ensemble Model Count:</strong> {analysisData.aiDetection.modelScores.ensemble_model_count}</p>
            </div>
          </div>
        )}
      </div>

      {/* Forensic Analysis */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6 mb-6">
        <button
          onClick={() => toggleSection('forensics')}
          className="flex justify-between items-center w-full text-dark-text hover:text-[#4DA2FF] transition-colors"
        >
          <h3 className="text-xl font-bold">🔬 Forensic Analysis</h3>
          {expandedSections.forensics ? <FaChevronUp /> : <FaChevronDown />}
        </button>
        {expandedSections.forensics && analysisData?.aiDetection?.forensicAnalysis && (
          <div className="mt-4 pt-4 border-t border-dark-border text-sm text-dark-muted">
            <h4 className="font-semibold text-dark-text mb-2">Image Quality & Integrity:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <p><strong>Compression Artifacts:</strong> {analysisData.aiDetection.forensicAnalysis.compression_artifacts?.toFixed(2)}</p>
              <p><strong>Sharpness:</strong> {analysisData.aiDetection.forensicAnalysis.sharpness?.toFixed(2)}</p>
              <p><strong>Noise Level:</strong> {analysisData.aiDetection.forensicAnalysis.noise_level?.toFixed(2)}</p>
              <p><strong>Color Saturation:</strong> {analysisData.aiDetection.forensicAnalysis.color_saturation?.toFixed(2)}</p>
              <p><strong>Brightness:</strong> {analysisData.aiDetection.forensicAnalysis.brightness?.toFixed(2)}</p>
              <p><strong>Contrast:</strong> {analysisData.aiDetection.forensicAnalysis.contrast?.toFixed(2)}</p>
              <p><strong>EXIF Data Presence:</strong> {analysisData.aiDetection.forensicAnalysis.exif_data_present ? 'Yes' : 'No'}</p>
            </div>

            <h4 className="font-semibold text-dark-text mt-4 mb-2">Frequency Analysis:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <p><strong>DCT Anomaly Score:</strong> {analysisData.aiDetection.frequencyAnalysis?.dct_anomaly_score?.toFixed(2)}</p>
              <p><strong>FFT Anomaly Score:</strong> {analysisData.aiDetection.frequencyAnalysis?.fft_anomaly_score?.toFixed(2)}</p>
            </div>

            <h4 className="font-semibold text-dark-text mt-4 mb-2">Quality Assessment:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <p><strong>Blurriness:</strong> {analysisData.aiDetection.qualityAssessment?.blurriness?.toFixed(2)}</p>
              <p><strong>Exposure:</strong> {analysisData.aiDetection.qualityAssessment?.exposure?.toFixed(2)}</p>
              <p><strong>Colorfulness:</strong> {analysisData.aiDetection.qualityAssessment?.colorfulness?.toFixed(2)}</p>
            </div>

            {/* Raw Forensic Data */}
            <button
              onClick={() => toggleSection('rawForensics')}
              className="mt-4 text-[#4DA2FF] hover:underline flex items-center"
            >
              {expandedSections.rawForensics ? <FaChevronUp className="mr-2" /> : <FaChevronDown className="mr-2" />}
              {expandedSections.rawForensics ? 'Hide Raw Forensic Data' : 'Show Raw Forensic Data'}
            </button>
            {expandedSections.rawForensics && (
              <div className="bg-dark-bg p-4 rounded-md max-h-60 overflow-y-auto text-xs font-mono text-dark-muted mt-3">
                <pre>{JSON.stringify(analysisData.aiDetection.forensicAnalysis, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reverse Search Results */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6 mb-6">
        <button
          onClick={() => toggleSection('reverseSearch')}
          className="flex justify-between items-center w-full text-dark-text hover:text-[#4DA2FF] transition-colors"
        >
          <h3 className="text-xl font-bold">🔍 Reverse Search Results</h3>
          {expandedSections.reverseSearch ? <FaChevronUp /> : <FaChevronDown />}
        </button>
        {expandedSections.reverseSearch && (
          <div className="mt-4 pt-4 border-t border-dark-border text-sm text-dark-muted">
            {analysisData?.reverseSearch?.matches && analysisData.reverseSearch.matches.length > 0 ? (
              <ul className="space-y-3">
                {analysisData.reverseSearch.matches.map((match: any, index: number) => (
                  <li key={index} className="bg-dark-bg p-3 rounded-md border border-dark-border">
                    <a href={match.link} target="_blank" rel="noopener noreferrer" className="text-[#4DA2FF] hover:underline font-semibold block">
                      {match.title || 'No Title'}
                    </a>
                    <p className="text-xs text-dark-muted mt-1">{match.source}</p>
                    <p className="text-xs text-dark-muted">Similarity: {(match.similarity * 100).toFixed(1)}%</p>
                    {match.first_seen && <p className="text-xs text-dark-muted">First Seen: {new Date(match.first_seen).toLocaleDateString()}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-dark-muted">No significant matches found on Google Reverse Image Search.</p>
            )}
          </div>
        )}
      </div>

      {/* Blockchain Attestation */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6 mb-6">
        <button
          onClick={() => toggleSection('blockchain')}
          className="flex justify-between items-center w-full text-dark-text hover:text-[#4DA2FF] transition-colors"
        >
          <h3 className="text-xl font-bold">⛓️ Blockchain Attestation</h3>
          {expandedSections.blockchain ? <FaChevronUp /> : <FaChevronDown />}
        </button>
        {expandedSections.blockchain && report.blockchainAttestation && (
          <div className="mt-4 pt-4 border-t border-dark-border text-sm text-dark-muted space-y-3">
            <p><strong>Transaction Hash:</strong> <a href={`https://suiscan.xyz/mainnet/tx/${report.blockchainAttestation.transactionHash}`} target="_blank" rel="noopener noreferrer" className="text-[#4DA2FF] hover:underline font-mono break-all">{report.blockchainAttestation.transactionHash}</a></p>
            <p><strong>Walrus Report CID:</strong> <a href={`https://walrus.com/cid/${report.blockchainAttestation.reportCID}`} target="_blank" rel="noopener noreferrer" className="text-[#4DA2FF] hover:underline font-mono break-all">{report.blockchainAttestation.reportCID}</a></p>
            <p><strong>Enclave ID:</strong> <span className="font-mono">{report.blockchainAttestation.enclaveId}</span></p>
            <p><strong>Attested At:</strong> {new Date(report.blockchainAttestation.timestamp).toLocaleString()}</p>
          </div>
        )}
        {expandedSections.blockchain && !report.blockchainAttestation && (
          <div className="mt-4 pt-4 border-t border-dark-border text-sm text-dark-muted">
            <p>No blockchain attestation found for this job.</p>
          </div>
        )}
      </div>
    </div>
  );
}
