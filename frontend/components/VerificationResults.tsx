'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import EnsembleGauge from './charts/EnsembleGauge';
import ModelScoresBar from './charts/ModelScoresBar';
import FileInfoCard from './FileInfoCard';
import Card3D from './Card3D';
import TransactionHistory from './TransactionHistory';
import { staggerContainer, cardEntrance, itemVariants, expandCollapse, iconRotate } from '@/lib/animations';
import { blockchainConfetti } from '@/lib/confetti';
import { getSuiTxUrlAuto } from '@/lib/explorers';

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
    const newState = !expandedSections[section];
    setExpandedSections(prev => ({ ...prev, [section]: newState }));
    
    // Trigger confetti when blockchain section is expanded
    if (section === 'blockchain' && newState && report.blockchainAttestation) {
      setTimeout(() => blockchainConfetti(), 200);
    }
  };

  const analysisData = report.analysisData;
  const ensembleScore = analysisData?.aiDetection?.ensembleScore || 0;
  
  // Initial animation on mount
  useEffect(() => {
    // Component mounted, stagger animations will play
  }, []);

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return { text: 'High AI Likelihood', color: 'text-red-400' };
    if (score >= 0.5) return { text: 'Medium Likelihood', color: 'text-orange-400' };
    return { text: 'Low AI Likelihood', color: 'text-green-400' };
  };

  const scoreInfo = getScoreLabel(ensembleScore);

  return (
    <motion.div 
      className="max-w-5xl mx-auto"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Analysis Summary */}
      <Card3D intensity={0.3}>
        <motion.div 
          className="bg-dark-surface border border-dark-border rounded-lg p-6 mb-6 text-center"
          variants={cardEntrance}
        >
          <motion.h2 
            className="text-2xl font-bold text-dark-text mb-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Analysis Result
          </motion.h2>
          <motion.p 
            className="text-3xl font-bold mb-2" 
            style={{ 
              color: ensembleScore >= 0.8 ? '#EF4444' : ensembleScore >= 0.5 ? '#F97316' : '#22C55E' 
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
          >
            {ensembleScore >= 0.8 ? '🤖 Likely AI-Generated' :
             ensembleScore >= 0.5 ? '⚠️ Possibly AI-Generated' :
             '✓ Likely Authentic'}
          </motion.p>
          <motion.p 
            className="text-dark-muted text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            AI Score: <span className="font-mono font-bold">{(ensembleScore * 100).toFixed(1)}%</span>
          </motion.p>
        </motion.div>
      </Card3D>

      {/* Ensemble Score Gauge */}
      <EnsembleGauge score={ensembleScore} />

      {/* Transaction History */}
      <TransactionHistory report={report} />

      {/* File Information Card */}
      {analysisData?.forensicAnalysis && (
        <FileInfoCard
          filename={analysisData.forensicAnalysis.filename}
          mimeType={analysisData.forensicAnalysis.mimeType}
          fileSize={analysisData.forensicAnalysis.fileSize}
          uploadedAt={analysisData.forensicAnalysis.uploadedAt}
          mediaHash={report.mediaHash}
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
              <p><strong>DCT AI Score:</strong> {(analysisData.aiDetection.frequencyAnalysis?.dct_ai_score !== undefined 
                ? (analysisData.aiDetection.frequencyAnalysis.dct_ai_score * 100).toFixed(1) + '%' 
                : 'N/A')}</p>
              <p><strong>FFT AI Score:</strong> {(analysisData.aiDetection.frequencyAnalysis?.fft_ai_score !== undefined 
                ? (analysisData.aiDetection.frequencyAnalysis.fft_ai_score * 100).toFixed(1) + '%' 
                : 'N/A')}</p>
              <p><strong>Frequency AI Score:</strong> {(analysisData.aiDetection.frequencyAnalysis?.frequency_ai_score !== undefined 
                ? (analysisData.aiDetection.frequencyAnalysis.frequency_ai_score * 100).toFixed(1) + '%' 
                : 'N/A')}</p>
            </div>

            <h4 className="font-semibold text-dark-text mt-4 mb-2">Quality Assessment:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <p><strong>Sharpness:</strong> {(analysisData.aiDetection.qualityMetrics?.sharpness?.score !== undefined 
                ? (analysisData.aiDetection.qualityMetrics.sharpness.score * 100).toFixed(1) + '% - ' + analysisData.aiDetection.qualityMetrics.sharpness.quality 
                : 'N/A')}</p>
              <p><strong>Contrast:</strong> {(analysisData.aiDetection.qualityMetrics?.contrast?.score !== undefined 
                ? (analysisData.aiDetection.qualityMetrics.contrast.score * 100).toFixed(1) + '% - ' + analysisData.aiDetection.qualityMetrics.contrast.quality 
                : 'N/A')}</p>
              <p><strong>Brightness:</strong> {(analysisData.aiDetection.qualityMetrics?.brightness?.score !== undefined 
                ? (analysisData.aiDetection.qualityMetrics.brightness.score * 100).toFixed(1) + '% - ' + analysisData.aiDetection.qualityMetrics.brightness.quality 
                : 'N/A')}</p>
              <p><strong>Noise Level:</strong> {(analysisData.aiDetection.qualityMetrics?.noise?.score !== undefined 
                ? (analysisData.aiDetection.qualityMetrics.noise.score * 100).toFixed(1) + '% - ' + analysisData.aiDetection.qualityMetrics.noise.quality 
                : 'N/A')}</p>
              <p><strong>Resolution:</strong> {(analysisData.aiDetection.qualityMetrics?.resolution?.quality 
                ? analysisData.aiDetection.qualityMetrics.resolution.quality + ' (' + analysisData.aiDetection.qualityMetrics.resolution.width + 'x' + analysisData.aiDetection.qualityMetrics.resolution.height + ')' 
                : 'N/A')}</p>
              <p><strong>Overall Quality:</strong> {(analysisData.aiDetection.qualityMetrics?.overall_quality !== undefined 
                ? (analysisData.aiDetection.qualityMetrics.overall_quality * 100).toFixed(1) + '%' 
                : 'N/A')}</p>
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
              <div>
                <p className="text-green-400 mb-3 font-semibold">
                  ✅ Found {analysisData.reverseSearch.matches.length} similar {analysisData.reverseSearch.matches.length === 1 ? 'result' : 'results'} on Google
                </p>
                <ul className="space-y-3">
                  {analysisData.reverseSearch.matches.map((match: any, index: number) => (
                    <li key={index} className="bg-dark-bg p-3 rounded-md border border-dark-border">
                      <a href={match.link || match.url} target="_blank" rel="noopener noreferrer" className="text-[#4DA2FF] hover:underline font-semibold block">
                        {match.title || match.metadata?.title || 'Untitled'}
                      </a>
                      <p className="text-xs text-dark-muted mt-1">Source: {match.source || match.metadata?.publisher || 'N/A'}</p>
                      <p className="text-xs text-dark-muted">Similarity: {(match.similarity * 100).toFixed(1)}%</p>
                      {(match.first_seen || match.firstSeen) && (
                        <p className="text-xs text-dark-muted">
                          First seen: {new Date(match.first_seen || match.firstSeen).toLocaleDateString('en-US')}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : analysisData?.reverseSearch === null ? (
              <p className="text-yellow-400">⚠️ Reverse search skipped (AI score between 50-80%)</p>
            ) : (
              <p className="text-dark-muted">❌ No similar results found on Google</p>
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
            <p><strong>Transaction Hash:</strong> <a href={getSuiTxUrlAuto(report.blockchainAttestation.txHash || report.blockchainAttestation.transactionHash)} target="_blank" rel="noopener noreferrer" className="text-[#4DA2FF] hover:underline font-mono break-all" title="View on Sui Explorer">{report.blockchainAttestation.txHash || report.blockchainAttestation.transactionHash}</a></p>
            <p><strong>Walrus Report CID:</strong> <a href={`https://walrus.com/cid/${report.blockchainAttestation.reportCID}`} target="_blank" rel="noopener noreferrer" className="text-[#4DA2FF] hover:underline font-mono break-all">{report.blockchainAttestation.reportCID}</a></p>
            <p><strong>Enclave ID:</strong> <span className="font-mono">{report.blockchainAttestation.enclaveId}</span></p>
            <p><strong>Attested At:</strong> {new Date(report.blockchainAttestation.timestamp).toLocaleString()}</p>
            
            {/* TEE Attestation Details */}
            {report.enclaveAttestation?.attestationDocument && (
              <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-cyan-500/30">
                <h4 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                  🔒 TEE Attestation Proof
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex flex-col">
                    <span className="text-gray-400 mb-1">Enclave ID:</span>
                    <span className="text-white font-mono bg-gray-900/50 px-2 py-1 rounded">
                      {report.enclaveAttestation.enclaveId}
                    </span>
                  </div>
                  {report.enclaveAttestation.publicKey && (
                    <div className="flex flex-col">
                      <span className="text-gray-400 mb-1">Public Key:</span>
                      <span className="text-white font-mono text-[10px] bg-gray-900/50 px-2 py-1 rounded break-all">
                        {report.enclaveAttestation.publicKey.substring(0, 64)}...
                      </span>
                    </div>
                  )}
                  {report.enclaveAttestation.pcrs && report.enclaveAttestation.pcrs.PCR0 && (
                    <div className="flex flex-col">
                      <span className="text-gray-400 mb-1">PCR0 (Platform Configuration):</span>
                      <span className="text-white font-mono text-[10px] bg-gray-900/50 px-2 py-1 rounded break-all">
                        {report.enclaveAttestation.pcrs.PCR0.substring(0, 64)}...
                      </span>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <a
                      href="https://docs.sui.io/concepts/cryptography/nautilus"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 text-xs inline-flex items-center gap-1"
                    >
                      Learn about Nautilus TEE →
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {expandedSections.blockchain && !report.blockchainAttestation && (
          <div className="mt-4 pt-4 border-t border-dark-border text-sm text-dark-muted">
            <p>No blockchain attestation found for this job.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
