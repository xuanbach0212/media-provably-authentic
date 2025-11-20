'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MediaUploader from '@/components/MediaUploader';
import { WalletConnect } from '@/components/WalletConnect';

export default function Home() {
  const router = useRouter();

  const handleUploadComplete = (jobId: string, walletAddress: string, signature: string) => {
    // Store wallet info in session storage for VerificationResults
    sessionStorage.setItem('walletAddress', walletAddress);
    sessionStorage.setItem('signature', signature);
    router.push(`/verify/${jobId}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-end mb-4">
            <WalletConnect />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Media Provably Authentic
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Verify the authenticity of media using AI detection, provenance tracking,
            and blockchain attestations powered by SUI ecosystem
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="text-lg font-semibold mb-2">AI Detection</h3>
            <p className="text-sm text-gray-600">
              Advanced AI models detect deepfakes and AI-generated content
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">📜</div>
            <h3 className="text-lg font-semibold mb-2">Provenance Tracking</h3>
            <p className="text-sm text-gray-600">
              Trace media origins through reverse image search and metadata analysis
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">⛓️</div>
            <h3 className="text-lg font-semibold mb-2">Blockchain Proof</h3>
            <p className="text-sm text-gray-600">
              Immutable attestations stored on SUI blockchain with TEE verification
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-center mb-8">
            Upload Media to Verify
          </h2>
          <MediaUploader onUploadComplete={handleUploadComplete} />
        </div>

        {/* Technology Stack */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p className="mb-2">Powered by:</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <span className="px-3 py-1 bg-white rounded-full shadow">Walrus Storage</span>
            <span className="px-3 py-1 bg-white rounded-full shadow">Seal KMS</span>
            <span className="px-3 py-1 bg-white rounded-full shadow">Nautilus TEE</span>
            <span className="px-3 py-1 bg-white rounded-full shadow">SUI Blockchain</span>
          </div>
        </div>
      </div>
    </main>
  );
}
