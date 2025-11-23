'use client';

import CompactPreview from '@/components/CompactPreview';
import ConsistentCard, { SectionHeader } from '@/components/ConsistentCard';
import MediaUploader from '@/components/MediaUploader';
import SimplifiedProgress from '@/components/SimplifiedProgress';
import VerificationResults from '@/components/VerificationResults';
import { WalletConnect } from '@/components/WalletConnect';
import { successConfetti } from '@/lib/confetti';
import { ErrorUpdate, ProgressUpdate, SocketClient } from '@/lib/socket';
import { DESIGN_TOKENS } from '@/styles/design-system';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useEffect, useState } from 'react';

export default function Home() {
  const account = useCurrentAccount();
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'ERROR'>('IDLE');
  const [error, setError] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [substep, setSubstep] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [finalReport, setFinalReport] = useState<any | null>(null);
  
  // File preview state
  const [uploadedFile, setUploadedFile] = useState<{
    preview: string;
    filename: string;
    fileSize: number;
    fileType: string;
    file?: File; // Store original File object
  } | null>(null);

  // Socket management
  const [socketClient] = useState(() => new SocketClient());

  useEffect(() => {
    console.log('[Page] Connecting socket with wallet:', account?.address || 'anonymous');
    socketClient.connect(account?.address, undefined);

    return () => {
      socketClient.disconnect();
    };
  }, [socketClient, account?.address]);

  const handleUploadStart = () => {
    console.log('[Page] 📤 Upload started');
    setStatus('UPLOADING');
    setCurrentStage(1);
    setSubstep('Preparing media...');
    setProgress(5); // Set initial progress
  };

  const handleUploadComplete = (uploadJobId: string, walletAddress?: string, signature?: string, initialProgress?: any) => {
    console.log('[Page] Upload complete, jobId:', uploadJobId);
    setJobId(uploadJobId);
    setStatus('PROCESSING');
    
    // Update with initial progress from upload response
    if (initialProgress) {
      setCurrentStage(initialProgress.stage || 2);
      setSubstep(initialProgress.substep || 'Processing...');
      setProgress(initialProgress.progress || 20);
    } else {
      setCurrentStage(2);
    }

    // Subscribe to job updates with callbacks
    socketClient.subscribeToJob(uploadJobId, {
      onProgress: handleProgressUpdate,
      onComplete: handleAnalysisComplete,
      onError: handleAnalysisError,
    });
  };

  const handleProgressUpdate = (update: ProgressUpdate) => {
    console.log('[Page] 📊 Progress update:', {
      stage: update.stage,
      stageName: update.stageName,
      substep: update.substep,
      progress: update.progress,
      timestamp: update.timestamp,
    });
    setCurrentStage(update.stage);
    setSubstep(update.substep);
    setProgress(update.progress);
  };

  const handleAnalysisComplete = (report: any) => {
    console.log('[Page] ✅ Analysis complete:', report);
    setStatus('COMPLETED');
    setProgress(100);
    setCurrentStage(5);
    setFinalReport(report);
    successConfetti();
  };

  const handleAnalysisError = (errorUpdate: ErrorUpdate) => {
    console.error('[Page] ❌ Analysis error:', errorUpdate);
    setStatus('ERROR');
    setError(errorUpdate.message);
  };

  const handleNewUpload = () => {
    setJobId(null);
    setStatus('IDLE');
    setError(null);
    setCurrentStage(0);
    setSubstep('');
    setProgress(0);
    setFinalReport(null);
    setUploadedFile(null);
  };

  const handleFileSelected = (fileInfo: { preview: string; filename: string; fileSize: number; fileType: string; file?: File }) => {
    setUploadedFile(fileInfo);
  };

  const { active: activeNodeIds, completed: completedNodeIds } = { active: [], completed: [] };

  return (
    <main className="min-h-screen w-full relative z-[10] py-6 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <a href="/" className="text-[#4DA2FF] hover:text-[#6FBCFF] transition-colors font-semibold text-sm">
            ← Back to Home
          </a>
          <WalletConnect />
        </div>

        {/* Header Card - More Compact */}
        <ConsistentCard accentColor={DESIGN_TOKENS.colors.accents.blue}>
          <div className="text-center py-4">
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-[#4DA2FF] via-[#06B6D4] to-[#14B8A6] bg-clip-text text-transparent">
                Verify Media Authenticity
              </span>
            </h1>
            <p className="text-sm text-gray-400">
              AI Detection • Blockchain Attestation • Real-time Analysis
            </p>
          </div>
        </ConsistentCard>

        {/* Split View Card - ALWAYS show when IDLE */}
        {status === 'IDLE' && (
          <ConsistentCard accentColor={DESIGN_TOKENS.colors.accents.indigo}>
            <SectionHeader accentColor={DESIGN_TOKENS.colors.accents.indigo} icon="🔄">
              Verification Pipeline
            </SectionHeader>
            <div className="flex items-start gap-6">
              {/* Left Side: Upload Zone (always visible, but MediaUploader manages its own display) */}
              <div className={uploadedFile ? "flex-shrink-0" : "flex-1"}>
                <MediaUploader
                  onUploadComplete={handleUploadComplete}
                  onProgressUpdate={handleProgressUpdate}
                  onAnalysisComplete={handleAnalysisComplete}
                  onAnalysisError={handleAnalysisError}
                  onUploadStart={handleUploadStart}
                  onFileSelected={handleFileSelected}
                />
              </div>
              
              {/* Right Side: Tree */}
              <div className="flex-1">
                <SimplifiedProgress
                  currentStage={0}
                  substep={uploadedFile ? "Ready to start" : "Waiting for media..."}
                  progress={0}
                  status="IDLE"
                />
              </div>
            </div>
          </ConsistentCard>
        )}

        {/* Compact Preview + Progress Card - Show when processing/completed */}
        {(status === 'PROCESSING' || status === 'UPLOADING' || status === 'COMPLETED') && uploadedFile && (
          <ConsistentCard accentColor={DESIGN_TOKENS.colors.accents.indigo}>
            <div className="flex items-start gap-4">
              {/* Compact Preview - Left Side */}
              <CompactPreview
                preview={uploadedFile.preview}
                filename={uploadedFile.filename}
                fileSize={uploadedFile.fileSize}
                fileType={uploadedFile.fileType}
                status={status === 'COMPLETED' ? 'completed' : 'processing'}
                onRemove={status === 'COMPLETED' ? handleNewUpload : undefined}
              />

              {/* Progress - Right Side */}
              <div className="flex-1">
                {(status === 'PROCESSING' || status === 'UPLOADING') && (
                  <>
                    <SectionHeader accentColor={DESIGN_TOKENS.colors.accents.indigo} icon="🔄">
                      Verification Progress
                    </SectionHeader>
                    <SimplifiedProgress
                      currentStage={currentStage}
                      substep={substep}
                      progress={progress}
                      status={status}
                    />
                  </>
                )}
              </div>
            </div>
          </ConsistentCard>
        )}

        {/* Error Display */}
        {error && (
          <ConsistentCard accentColor={DESIGN_TOKENS.colors.error} className="bg-red-900/20">
            <SectionHeader accentColor={DESIGN_TOKENS.colors.error} icon="⚠️">
              Verification Failed
            </SectionHeader>
            <p className="text-red-300 mb-4">{error}</p>
            <button
              onClick={handleNewUpload}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              Try Again
            </button>
          </ConsistentCard>
        )}

        {/* Results Card */}
        {status === 'COMPLETED' && finalReport && (
          <ConsistentCard accentColor={DESIGN_TOKENS.colors.accents.green}>
            <SectionHeader accentColor={DESIGN_TOKENS.colors.accents.green} icon="✅">
              Verification Complete
            </SectionHeader>
            <VerificationResults report={finalReport} />
            <div className="mt-6 text-center">
              <button
                onClick={handleNewUpload}
                className="px-8 py-3 bg-gradient-to-r from-[#4DA2FF] to-[#06B6D4] hover:from-[#6FBCFF] hover:to-[#14B8A6] text-white rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105"
              >
                Verify Another Media
              </button>
            </div>
          </ConsistentCard>
        )}

        {/* Tech Stack Footer - Single, Clean */}
        <ConsistentCard accentColor={DESIGN_TOKENS.colors.accents.purple}>
          <div className="text-center py-2">
            <div className="text-xs text-gray-500 mb-3">POWERED BY</div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/30 text-blue-400">
                🗄️ Walrus
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500/10 border border-purple-500/30 text-purple-400">
                🔐 Seal KMS
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                🛡️ Nautilus TEE
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                🔍 SerpAPI
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-green-500/10 border border-green-500/30 text-green-400">
                ⛓️ SUI
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-pink-500/10 border border-pink-500/30 text-pink-400">
                🤖 AI (7 Models)
              </span>
            </div>
          </div>
        </ConsistentCard>
      </div>
    </main>
  );
}
