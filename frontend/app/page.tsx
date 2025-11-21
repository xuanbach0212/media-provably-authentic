'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MediaUploader from '@/components/MediaUploader';
import { WalletConnect } from '@/components/WalletConnect';
import VerificationResults from '@/components/VerificationResults';
import { FaCheckCircle, FaSpinner, FaTimesCircle } from 'react-icons/fa';
import { SocketClient, ProgressUpdate, ErrorUpdate } from '@/lib/socket';
import { 
  pageVariants, 
  containerVariants, 
  itemVariants,
  staggerContainer,
  cardEntrance 
} from '@/lib/animations';
import { successConfetti } from '@/lib/confetti';

const STAGES = [
  { id: 1, name: 'Initializing' },
  { id: 2, name: 'Encrypting & Storing' },
  { id: 3, name: 'Dispatching to Enclaves' },
  { id: 4, name: 'Enclave Processing' },
  { id: 5, name: 'Computing Consensus' },
  { id: 6, name: 'Blockchain Attestation' },
];

export default function Home() {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('IDLE'); // IDLE, PROCESSING, COMPLETED, FAILED
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [substep, setSubstep] = useState<string>('Ready to upload');
  const [error, setError] = useState<string | null>(null);
  const [socketClient] = useState(() => new SocketClient());
  const [finalReport, setFinalReport] = useState<any>(null);

  // Connect socket on component mount (early connection)
  useEffect(() => {
    const walletAddress = sessionStorage.getItem('walletAddress') || 'anonymous';
    const signature = sessionStorage.getItem('signature') || '';
    
    console.log('[Page] Connecting socket early...');
    socketClient.connect(walletAddress, signature);

    return () => {
      console.log('[Page] Disconnecting socket on unmount');
      socketClient.disconnect();
    };
  }, [socketClient]);

  // Subscribe to job updates when jobId is available
  useEffect(() => {
    if (!currentJobId) return;

    console.log('[Page] Subscribing to job:', currentJobId);

    // Subscribe to job updates
    socketClient.subscribeToJob(currentJobId, {
      onProgress: (data: ProgressUpdate) => {
        console.log('[Page] Progress:', data.progress, data.substep);
        setCurrentStage(data.stage);
        setProgress(data.progress);
        setSubstep(data.substep);
        setStatus('PROCESSING');
      },
      onError: (errorData: ErrorUpdate) => {
        console.error('[Page] Error:', errorData.message);
        setError(errorData.message);
        setStatus('FAILED');
      },
      onComplete: (report: any) => {
        console.log('[Page] Job completed! Report:', report);
        console.log('[Page] Report has analysisData:', !!report.analysisData);
        console.log('[Page] Report has aiDetection:', !!report.analysisData?.aiDetection);
        setFinalReport(report);
        setStatus('COMPLETED');
        setProgress(100);
        setCurrentStage(STAGES.length);
        
        // Trigger success confetti
        setTimeout(() => successConfetti(), 300);
      },
    });

    // Cleanup - unsubscribe from job
    return () => {
      console.log('[Page] Unsubscribing from job:', currentJobId);
      socketClient.unsubscribeFromJob(currentJobId);
    };
  }, [currentJobId, socketClient]);

  const handleUploadStart = () => {
    // Show Stage 1 immediately when upload starts
    setStatus('PROCESSING');
    setCurrentStage(1);
    setProgress(0);
    setSubstep('Starting upload...');
    setError(null);
    setFinalReport(null);
  };

  const handleUploadComplete = (jobId: string, walletAddress: string, signature: string, initialProgress?: any) => {
    // Store wallet info
    sessionStorage.setItem('walletAddress', walletAddress);
    sessionStorage.setItem('signature', signature);
    
    // Set initial progress from upload response if available
    const stage = initialProgress?.stage || 2;
    const progress = initialProgress?.progress || 20;
    const substep = initialProgress?.substep || 'Upload complete! Preparing verification...';
    
    // Set jobId and update progress
    setCurrentJobId(jobId);
    setStatus('PROCESSING');
    setCurrentStage(stage);
    setProgress(progress);
    setSubstep(substep);
  };

  const handleNewUpload = () => {
    // Reset everything
    setCurrentJobId(null);
    setStatus('IDLE');
    setCurrentStage(0);
    setProgress(0);
    setSubstep('Ready to upload');
    setError(null);
    setFinalReport(null);
  };

  const getStageStatus = (stageId: number) => {
    if (status === 'FAILED' && stageId === currentStage) return 'failed';
    if (stageId < currentStage) return 'completed';
    if (stageId === currentStage && status === 'PROCESSING') return 'in_progress';
    if (status === 'COMPLETED') return 'completed';
    return 'pending';
  };

  return (
    <motion.main 
      className="min-h-screen"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      <motion.div 
        className="container mx-auto px-4 py-8 sm:py-12 max-w-5xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div 
          className="text-center mb-8 sm:mb-12"
          variants={itemVariants}
        >
          <motion.div 
            className="flex justify-end items-center mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <WalletConnect />
          </motion.div>
          <motion.h1 
            className="text-4xl sm:text-5xl font-bold text-dark-text mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          >
            <span className="bg-gradient-to-r from-[#4DA2FF] to-[#06B6D4] bg-clip-text text-transparent">
              Media Provably Authentic
            </span>
          </motion.h1>
          <motion.p 
            className="text-lg sm:text-xl text-dark-muted max-w-2xl mx-auto px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Verify the authenticity of media using AI detection, provenance tracking,
            and blockchain attestations powered by <span className="text-[#4DA2FF] font-semibold">SUI</span> ecosystem
          </motion.p>
        </motion.div>

        {/* Features */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="bg-dark-surface border border-dark-border p-6 rounded-lg">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="text-lg font-semibold mb-2 text-dark-text">AI Detection</h3>
            <p className="text-sm text-dark-muted">
              Advanced AI models detect deepfakes and AI-generated content
            </p>
          </div>
          <div className="bg-dark-surface border border-dark-border p-6 rounded-lg">
            <div className="text-3xl mb-3">📜</div>
            <h3 className="text-lg font-semibold mb-2 text-dark-text">Provenance Tracking</h3>
            <p className="text-sm text-dark-muted">
              Trace media origins through reverse image search and metadata analysis
            </p>
          </div>
          <div className="bg-dark-surface border border-dark-border p-6 rounded-lg sm:col-span-2 md:col-span-1">
            <div className="text-3xl mb-3">⛓️</div>
            <h3 className="text-lg font-semibold mb-2 text-dark-text">Blockchain Proof</h3>
            <p className="text-sm text-dark-muted">
              Immutable attestations stored on SUI blockchain with TEE verification
            </p>
          </div>
        </div>

        {/* Process Tree - Always visible - Sui Style */}
        <motion.div 
          className="mb-8 glass-premium rounded-lg p-6 relative overflow-hidden hover-lift"
          variants={cardEntrance}
          whileHover={{ scale: 1.005 }}
        >
          {/* Sui Glow Background */}
          <motion.div 
            className="absolute inset-0 bg-sui-glow opacity-50 pointer-events-none"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          ></motion.div>
          
          <h3 className="text-lg font-bold text-dark-text mb-4 text-center relative z-10">
            <span className="bg-gradient-to-r from-[#4DA2FF] to-[#06B6D4] bg-clip-text text-transparent">
              Verification Process
            </span>
          </h3>
          
          <div className="flex justify-between items-start relative z-10">
            {STAGES.map((stage, idx) => {
              const stageStatus = getStageStatus(stage.id);
              const isCompleted = stageStatus === 'completed';
              const isActive = stageStatus === 'in_progress';
              const isFailed = stageStatus === 'failed';
              const isPending = stageStatus === 'pending';

              return (
                <div key={stage.id} className="flex flex-col items-center flex-1 relative">
                  {/* Node */}
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center mb-2 transition-all
                      ${isCompleted ? 'bg-[#14B8A6] border-[#06B6D4] shadow-lg' : ''}
                      ${isActive ? 'border-[#4DA2FF] scale-110 node-active' : ''}
                      ${isFailed ? 'bg-red-600 border-red-400' : ''}
                      ${isPending ? 'bg-gray-700 border-gray-600' : ''}
                    `}
                  >
                    {isCompleted && <FaCheckCircle className="text-white text-lg" />}
                    {isActive && <FaSpinner className="text-white text-lg animate-spin" />}
                    {isFailed && <FaTimesCircle className="text-white text-lg" />}
                    {isPending && <span className="text-gray-500 text-sm">{stage.id}</span>}
                  </div>
                  
                  {/* Label */}
                  <div className={`text-xs sm:text-sm text-center ${isActive ? 'text-[#4DA2FF] font-semibold' : isCompleted ? 'text-[#06B6D4]' : isFailed ? 'text-red-400' : 'text-dark-muted'}`}>
                    {stage.name}
                  </div>

                  {/* Connector Line */}
                  {idx < STAGES.length - 1 && (
                    <div 
                      className={`absolute top-5 sm:top-6 left-[60%] w-full h-0.5 transition-colors
                        ${isCompleted ? 'bg-gradient-to-r from-[#14B8A6] to-[#06B6D4]' : 'bg-gray-700'}
                      `}
                      style={isCompleted ? {
                        boxShadow: '0 0 8px rgba(20, 184, 166, 0.6)'
                      } : {}}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress Bar (only show during processing) */}
          {(status === 'PROCESSING' || status === 'FAILED') && (
            <motion.div 
              className="mt-6 pt-4 border-t border-dark-border relative z-10"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-dark-text">Current Progress</h4>
                <span className="text-xl font-bold text-[#4DA2FF]">{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-dark-bg rounded-full h-3 mb-3 overflow-hidden">
                <motion.div
                  className="bg-sui-gradient h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
                  style={{ 
                    width: `${progress}%`,
                    boxShadow: '0 0 10px rgba(77, 162, 255, 0.6)'
                  }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-dark-muted text-sm">{substep}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-6 bg-red-900/20 border border-red-900 rounded-lg">
            <div className="flex items-center mb-4">
              <FaTimesCircle className="text-red-500 text-3xl mr-4" />
              <div>
                <h3 className="text-xl font-bold text-red-400">Analysis Failed</h3>
                <p className="mt-1 text-dark-text">{error}</p>
              </div>
            </div>
            <button
              onClick={handleNewUpload}
              className="bg-gray-600 text-white py-2 px-6 rounded-lg hover:bg-gray-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Upload Section - OR Results if job started */}
        <AnimatePresence mode="wait">
          {!currentJobId ? (
            <motion.div 
              key="upload"
              className="bg-dark-surface border border-dark-border rounded-lg p-6 sm:p-8 max-w-3xl mx-auto hover-lift"
              variants={cardEntrance}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: 20 }}
              whileHover={{ scale: 1.01 }}
            >
              <motion.h2 
                className="text-2xl font-bold text-center mb-8 text-dark-text"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Upload Media to Verify
              </motion.h2>
              <MediaUploader 
                onUploadComplete={handleUploadComplete}
                onUploadStart={handleUploadStart}
              />
            </motion.div>
          ) : (status === 'COMPLETED' && finalReport) ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            >
              <VerificationResults report={finalReport} />
              <motion.div 
                className="text-center mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  onClick={handleNewUpload}
                  className="btn-sui text-white py-3 px-8 rounded-lg font-semibold shadow-lg"
                  whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(77, 162, 255, 0.5)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  Analyze Another Image
                </motion.button>
              </motion.div>
            </motion.div>
          ) : (status === 'PROCESSING') ? (
            <motion.div 
              key="processing"
              className="text-center mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="inline-block rounded-full h-12 w-12 border-4 border-[#4DA2FF] border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <motion.p 
                className="mt-4 text-dark-muted"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Processing...
              </motion.p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Technology Stack */}
        <div className="mt-12 text-center text-sm text-dark-muted">
          <p className="mb-3">Powered by:</p>
          <div className="flex justify-center gap-3 flex-wrap px-4">
            <span className="px-3 py-1 bg-dark-surface border border-dark-border rounded-full">Walrus Storage</span>
            <span className="px-3 py-1 bg-dark-surface border border-dark-border rounded-full">Seal KMS</span>
            <span className="px-3 py-1 bg-dark-surface border border-dark-border rounded-full">Nautilus TEE</span>
            <span className="px-3 py-1 bg-dark-surface border border-dark-border rounded-full">SUI Blockchain</span>
          </div>
        </div>
      </motion.div>
    </motion.main>
  );
}
