'use client';

import { useState } from 'react';
import VerificationResults from '@/components/VerificationResults';

export default function TestPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchMockReport = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/test/mock-report');
      const data = await response.json();
      console.log('[Test] Fetched mock report:', data);
      setReport(data);
    } catch (error) {
      console.error('[Test] Error fetching mock report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-dark-bg p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-dark-text mb-8">
          🧪 Test VerificationResults Component
        </h1>

        <div className="mb-8 p-6 bg-dark-surface border border-dark-border rounded-lg">
          <button
            onClick={fetchMockReport}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load Mock Report'}
          </button>
          
          {report && (
            <div className="mt-4 p-4 bg-dark-bg rounded">
              <p className="text-green-400 font-semibold">✅ Mock Report Loaded!</p>
              <p className="text-dark-muted text-sm mt-2">
                Check console for full data structure
              </p>
            </div>
          )}
        </div>

        {report && (
          <div>
            <h2 className="text-2xl font-bold text-dark-text mb-4">Results Preview:</h2>
            <VerificationResults report={report} />
          </div>
        )}

        {!report && !loading && (
          <div className="text-center text-dark-muted py-12">
            <p>Click "Load Mock Report" to test the component</p>
          </div>
        )}
      </div>
    </main>
  );
}

