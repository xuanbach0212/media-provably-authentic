'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MediaUploader from '@/components/MediaUploader';
import VerificationResults from '@/components/VerificationResults';
import { WalletConnect } from '@/components/WalletConnect';
import ProcessTree3D from '@/components/ProcessTree3D';
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
import { mapProgressToNodes } from '@/lib/progressMapper';

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
      className="min-h-screen relative"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {/* Gradient overlay for depth - below content */}
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-gray-900/30 to-gray-900/60 pointer-events-none z-[5]"></div>
      
      <motion.div 
        className="relative z-10 container mx-auto px-4 py-8 sm:py-12 max-w-7xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Top Bar */}
        <motion.div 
          className="flex justify-between items-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <a href="/" className="text-[#4DA2FF] hover:text-[#6FBCFF] transition-colors font-semibold">
            ← Back to Home
          </a>
          <WalletConnect />
        </motion.div>

        {/* Header - Premium Design */}
        <motion.div 
          className="text-center mb-16"
          variants={itemVariants}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4DA2FF]/10 border border-[#4DA2FF]/30 mb-6"
          >
            <div className="w-2 h-2 rounded-full bg-[#4DA2FF] animate-pulse"></div>
            <span className="text-sm text-[#4DA2FF] font-medium">AI-Powered Verification</span>
          </motion.div>
          
          <motion.h1 
            className="text-5xl sm:text-6xl font-bold mb-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
          >
            <span className="bg-gradient-to-r from-[#4DA2FF] via-[#06B6D4] to-[#14B8A6] bg-clip-text text-transparent">
              Verify Media
            </span>
            <br />
            <span className="text-white">Authenticity</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Advanced AI detection • Blockchain attestation • Real-time analysis
          </motion.p>
        </motion.div>

        {/* 3D Process Tree - 33 Nodes - Always visible */}
        <motion.div 
          className="mb-12 w-full flex justify-center"
          variants={cardEntrance}
          initial="hidden"
          animate="visible"
        >
          <div className="w-full max-w-6xl">
            <ProcessTree3D
              currentStage={currentStage}
              substep={substep}
              progress={progress}
              status={status as any}
              activeNodeIds={mapProgressToNodes(currentStage, substep).active}
              completedNodeIds={mapProgressToNodes(currentStage, substep).completed}
            />
          </div>
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
              className="max-w-4xl mx-auto"
              variants={cardEntrance}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: 20 }}
            >
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

        {/* Technology Stack - Beautiful badges */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-sm text-gray-500 mb-4 uppercase tracking-wider">Powered by</p>
          <div className="flex justify-center gap-3 flex-wrap px-4">
            <motion.span 
              className="px-4 py-2 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-lg text-sm text-blue-300 font-medium backdrop-blur-sm hover:bg-blue-500/20 transition-all"
              whileHover={{ scale: 1.05, borderColor: 'rgba(59, 130, 246, 0.5)' }}
            >
              🗄️ Walrus Storage
            </motion.span>
            <motion.span 
              className="px-4 py-2 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-lg text-sm text-purple-300 font-medium backdrop-blur-sm hover:bg-purple-500/20 transition-all"
              whileHover={{ scale: 1.05, borderColor: 'rgba(168, 85, 247, 0.5)' }}
            >
              🔐 Seal KMS
            </motion.span>
            <motion.span 
              className="px-4 py-2 bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-lg text-sm text-green-300 font-medium backdrop-blur-sm hover:bg-green-500/20 transition-all"
              whileHover={{ scale: 1.05, borderColor: 'rgba(34, 197, 94, 0.5)' }}
            >
              🛡️ Nautilus TEE
            </motion.span>
            <motion.span 
              className="px-4 py-2 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/30 rounded-lg text-sm text-cyan-300 font-medium backdrop-blur-sm hover:bg-cyan-500/20 transition-all"
              whileHover={{ scale: 1.05, borderColor: 'rgba(6, 182, 212, 0.5)' }}
            >
              ⛓️ SUI Blockchain
            </motion.span>
          </div>
        </motion.div>
      </motion.div>
    </motion.main>
  );
}
