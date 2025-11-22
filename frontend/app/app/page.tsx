'use client';

import ConsistentCard, { SectionHeader } from '@/components/ConsistentCard';
import MediaUploader from '@/components/MediaUploader';
import ProcessTree3D from '@/components/ProcessTree3D';
import VerificationResults from '@/components/VerificationResults';
import { WalletConnect } from '@/components/WalletConnect';
import { successConfetti } from '@/lib/confetti';
import { mapProgressToNodes } from '@/lib/progressMapper';
import { ErrorUpdate, ProgressUpdate, SocketClient } from '@/lib/socket';
import { DESIGN_TOKENS } from '@/styles/design-system';
import { useEffect, useState } from 'react';

export default function Home() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'ERROR'>('IDLE');
  const [error, setError] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [substep, setSubstep] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [finalReport, setFinalReport] = useState<any | null>(null);

  // Socket management
  const [socketClient] = useState(() => new SocketClient());

  useEffect(() => {
    console.log('[Page] Connecting socket early...');
    socketClient.connect();

    return () => {
      socketClient.disconnect();
    };
  }, [socketClient]);

  const handleUploadStart = () => {
    console.log('[Page] Upload started');
    setStatus('UPLOADING');
    setCurrentStage(1);
    setSubstep('Preparing media...');
  };

  const handleUploadComplete = (uploadJobId: string, walletAddress?: string, signature?: string) => {
    console.log('[Page] Upload complete, jobId:', uploadJobId);
    setJobId(uploadJobId);
    setStatus('PROCESSING');
    setCurrentStage(2);

    if (walletAddress && signature) {
      socketClient.subscribeToJob(uploadJobId, walletAddress, signature);
    } else {
      socketClient.subscribeToJob(uploadJobId);
    }
  };

  const handleProgressUpdate = (update: ProgressUpdate) => {
    console.log('[Page] Progress update:', update);
    setCurrentStage(update.stage);
    setSubstep(update.substep);
    setProgress(update.progress);
  };

  const handleAnalysisComplete = (report: any) => {
    console.log('[Page] Analysis complete:', report);
    setStatus('COMPLETED');
    setFinalReport(report);
    successConfetti();
  };

  const handleAnalysisError = (errorUpdate: ErrorUpdate) => {
    console.error('[Page] Analysis error:', errorUpdate);
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
  };

  const { active: activeNodeIds, completed: completedNodeIds } = mapProgressToNodes(currentStage, substep);

  return (
    <main className="min-in-h-screen w-full relative z-[10] py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <a href="/" className="text-[#4DA2FF] hover:text-[#6FBCFF] transition-colors font-semibold text-sm">
            ← Back to Home
          </a>
          <WalletConnect />
        </div>

        {/* Header Card */}
        <ConsistentCard accentColor={DESIGN_TOKENS.colors.accents.blue}>
          <div className="text-center">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#4DA2FF]/15 border border-[#4DA2FF]/40 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-[#4DA2FF] animate-pulse"></div>
              <span className="text-sm text-[#4DA2FF] font-semibold">AI-Powered Verification</span>
            </div>
            
            <h1 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#4DA2FF] via-[#06B6D4] to-[#14B8A6] bg-clip-text text-transparent">
                Verify Media Authenticity
              </span>
            </h1>
            
            <p className="text-lg text-gray-300">
              Advanced AI detection • Blockchain attestation • Real-time analysis
            </p>
          </div>
        </ConsistentCard>

        {/* Process Pipeline Card */}
        <ConsistentCard accentColor={DESIGN_TOKENS.colors.accents.indigo}>
          <SectionHeader accentColor={DESIGN_TOKENS.colors.accents.indigo} icon="🛡️">
            Multi-Oracle Verification Pipeline
          </SectionHeader>
          <ProcessTree3D
            currentStage={currentStage}
            substep={substep}
            progress={progress}
            status={status}
            activeNodeIds={activeNodeIds}
            completedNodeIds={completedNodeIds}
          />
        </ConsistentCard>

        {/* Error Display */}
        {error && (
          <ConsistentCard accentColor={DESIGN_TOKENS.colors.error} className="bg-red-900/20">
            <SectionHeader accentColor={DESIGN_TOKENS.colors.error} icon="⚠️">
              Analysis Failed
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

        {/* Upload Card - only show when not completed */}
        {status !== 'COMPLETED' && !error && (
          <ConsistentCard accentColor={DESIGN_TOKENS.colors.accents.cyan}>
            <SectionHeader accentColor={DESIGN_TOKENS.colors.accents.cyan} icon="📤">
              Upload Media
            </SectionHeader>
            <MediaUploader
              onUploadComplete={handleUploadComplete}
              onProgressUpdate={handleProgressUpdate}
              onAnalysisComplete={handleAnalysisComplete}
              onAnalysisError={handleAnalysisError}
              onUploadStart={handleUploadStart}
            />
          </ConsistentCard>
        )}

        {/* Results Card */}
        {status === 'COMPLETED' && finalReport && (
          <ConsistentCard accentColor={DESIGN_TOKENS.colors.accents.green}>
            <SectionHeader accentColor={DESIGN_TOKENS.colors.accents.green} icon="✅">
              Analysis Results
            </SectionHeader>
            <VerificationResults report={finalReport} />
            <div className="mt-6 text-center">
              <button
                onClick={handleNewUpload}
                className="px-8 py-3 bg-gradient-to-r from-[#4DA2FF] to-[#06B6D4] hover:from-[#6FBCFF] hover:to-[#14B8A6] text-white rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105"
              >
                Analyze Another Image
              </button>
            </div>
          </ConsistentCard>
        )}

        {/* Tech Stack Footer */}
        <ConsistentCard accentColor={DESIGN_TOKENS.colors.accents.purple} className="text-center">
          <div className="text-sm text-gray-400 mb-3">POWERED BY</div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="px-4 py-2 rounded-full text-sm font-medium" style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60A5FA'
            }}>🗄️ Walrus Storage</span>
            <span className="px-4 py-2 rounded-full text-sm font-medium" style={{
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              color: '#C084FC'
            }}>🔐 Seal KMS</span>
            <span className="px-4 py-2 rounded-full text-sm font-medium" style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#818CF8'
            }}>🛡️ Nautilus TEE</span>
            <span className="px-4 py-2 rounded-full text-sm font-medium" style={{
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: '#22D3EE'
            }}>🔍 SerpAPI</span>
            <span className="px-4 py-2 rounded-full text-sm font-medium" style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: '#4ADE80'
            }}>⛓️ SUI Blockchain</span>
            <span className="px-4 py-2 rounded-full text-sm font-medium" style={{
              background: 'rgba(236, 72, 153, 0.1)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              color: '#F472B6'
            }}>🤖 AI (7 Models)</span>
          </div>
        </ConsistentCard>
      </div>
    </main>
  );
}
