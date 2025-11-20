'use client';

import { useRouter } from 'next/navigation';
import { WalletConnect } from '@/components/WalletConnect';

export default function BatchLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div>
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                ← Back to Single Upload
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900">
                Media Provably Authentic
              </h1>
            </div>
            <WalletConnect />
          </div>
        </div>
      </div>
      
      {children}
    </div>
  );
}

