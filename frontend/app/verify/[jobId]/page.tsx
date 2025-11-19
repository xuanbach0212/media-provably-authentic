'use client';

import { use } from 'react';
import Link from 'next/link';
import VerificationResults from '@/components/VerificationResults';

export default function VerifyPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">
            Media Verification
          </h1>
        </div>

        {/* Results */}
        <VerificationResults jobId={jobId} />
      </div>
    </main>
  );
}

