'use client';

import { useState } from 'react';
import MediaUploader from '@/components/MediaUploader';
import { WalletConnect } from '@/components/WalletConnect';
import VerificationResults from '@/components/VerificationResults';
import { FaCheckCircle, FaSpinner } from 'react-icons/fa';

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

  const handleUploadComplete = (jobId: string, walletAddress: string, signature: string) => {
    // Store wallet info in session storage
    sessionStorage.setItem('walletAddress', walletAddress);
    sessionStorage.setItem('signature', signature);
    // Set job ID to show results in the same page
    setCurrentJobId(jobId);
  };

  return (
    <main className="min-h-screen bg-dark-bg">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-end items-center mb-6">
            <WalletConnect />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-dark-text mb-4">
            Media Provably Authentic
          </h1>
          <p className="text-lg sm:text-xl text-dark-muted max-w-2xl mx-auto px-4">
            Verify the authenticity of media using AI detection, provenance tracking,
            and blockchain attestations powered by SUI ecosystem
          </p>
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 max-w-5xl mx-auto">
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

        {/* Process Tree - Always visible */}
        <div className="mb-8 bg-dark-surface border border-dark-border rounded-lg p-6 max-w-5xl mx-auto">
          <h3 className="text-lg font-bold text-dark-text mb-4 text-center">Verification Process</h3>
          <div className="flex justify-between items-start">
            {STAGES.map((stage, idx) => (
              <div key={stage.id} className="flex flex-col items-center flex-1 relative">
                {/* Node - Default state (pending) */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 bg-gray-700 border-gray-600 flex items-center justify-center mb-2">
                  <span className="text-gray-500 text-sm">{stage.id}</span>
                </div>
                
                {/* Label */}
                <div className="text-xs sm:text-sm text-center text-dark-muted">
                  {stage.name}
                </div>

                {/* Connector Line */}
                {idx < STAGES.length - 1 && (
                  <div className="absolute top-5 sm:top-6 left-[60%] w-full h-0.5 bg-gray-700" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upload Section - OR Results if job started */}
        {!currentJobId ? (
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6 sm:p-8 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8 text-dark-text">
              Upload Media to Verify
            </h2>
            <MediaUploader onUploadComplete={handleUploadComplete} />
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <VerificationResults jobId={currentJobId} />
          </div>
        )}

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
      </div>
    </main>
  );
}
