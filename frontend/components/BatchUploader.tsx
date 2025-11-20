'use client';

import { ApiClient } from '@/lib/api';
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaSpinner, FaUpload } from 'react-icons/fa';

interface BatchJob {
  id: string;
  fileName: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  jobId?: string;
  verdict?: string;
  confidence?: number;
  error?: string;
}

export default function BatchUploader() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signMessage } = useSignPersonalMessage();
  const router = useRouter();
  
  const [files, setFiles] = useState<File[]>([]);
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      
      // Initialize batch jobs
      const jobs: BatchJob[] = selectedFiles.map((file, index) => ({
        id: `batch_${Date.now()}_${index}`,
        fileName: file.name,
        status: 'pending',
      }));
      setBatchJobs(jobs);
    }
  };

  const handleBatchUpload = async () => {
    if (!currentAccount) {
      alert('Please connect your wallet first');
      return;
    }

    if (files.length === 0) {
      alert('Please select files to upload');
      return;
    }

    setIsProcessing(true);

    try {
      // Sign message for authentication
      const message = `Batch upload ${files.length} files for verification at ${new Date().toISOString()}`;
      const { signature } = await signMessage({ message: new TextEncoder().encode(message) });
      
      const signatureArray = Array.from(signature);
      const signatureBase64 = btoa(String.fromCharCode.apply(null, signatureArray as any));
      
      // Store auth info
      sessionStorage.setItem('walletAddress', currentAccount.address);
      sessionStorage.setItem('signature', signatureBase64);

      // Process files sequentially to avoid overwhelming the server
      let completed = 0;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const jobId = batchJobs[i].id;

        try {
          // Update status to uploading
          setBatchJobs(prev => 
            prev.map(job => 
              job.id === jobId ? { ...job, status: 'uploading' } : job
            )
          );

          // Upload file
          const response = await ApiClient.uploadMedia(
            file,
            currentAccount.address,
            signatureBase64
          );

          // Update status to processing
          setBatchJobs(prev => 
            prev.map(job => 
              job.id === jobId 
                ? { ...job, status: 'processing', jobId: response.jobId } 
                : job
            )
          );

          // Poll for results (simplified - in production, use WebSockets)
          const result = await pollForResult(response.jobId);

          // Update status to completed
          setBatchJobs(prev => 
            prev.map(job => 
              job.id === jobId 
                ? { 
                    ...job, 
                    status: 'completed',
                    verdict: result.verdict,
                    confidence: result.confidence
                  } 
                : job
            )
          );

        } catch (error: any) {
          console.error(`Error processing ${file.name}:`, error);
          
          // Update status to failed
          setBatchJobs(prev => 
            prev.map(job => 
              job.id === jobId 
                ? { ...job, status: 'failed', error: error.message } 
                : job
            )
          );
        }

        // Update overall progress
        completed++;
        setOverallProgress(Math.round((completed / files.length) * 100));
      }

      alert('Batch processing complete!');
    } catch (error: any) {
      console.error('Batch upload error:', error);
      alert(error.message || 'Failed to process batch upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const pollForResult = async (jobId: string): Promise<any> => {
    const maxAttempts = 60; // 5 minutes max
    const pollInterval = 5000; // 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
      try {
        const status = await ApiClient.getJobStatus(jobId);
        
        if (status.status === 'COMPLETED' && status.report) {
          return status.report;
        }
        
        if (status.status === 'FAILED') {
          throw new Error(status.message || 'Verification failed');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }

    throw new Error('Verification timeout');
  };

  const exportResults = (format: 'csv' | 'json') => {
    const completedJobs = batchJobs.filter(job => job.status === 'completed');
    
    if (completedJobs.length === 0) {
      alert('No completed results to export');
      return;
    }

    if (format === 'csv') {
      const csv = [
        ['File Name', 'Verdict', 'Confidence', 'Status'],
        ...completedJobs.map(job => [
          job.fileName,
          job.verdict || 'N/A',
          job.confidence ? `${(job.confidence * 100).toFixed(1)}%` : 'N/A',
          job.status
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch_results_${Date.now()}.csv`;
      a.click();
    } else {
      const json = JSON.stringify(completedJobs, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch_results_${Date.now()}.json`;
      a.click();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="text-gray-400">⏳</span>;
      case 'uploading':
      case 'processing':
        return <FaSpinner className="animate-spin text-blue-500" />;
      case 'completed':
        return <FaCheckCircle className="text-green-500" />;
      case 'failed':
        return <FaExclamationCircle className="text-red-500" />;
      default:
        return null;
    }
  };

  const getVerdictColor = (verdict?: string) => {
    switch (verdict) {
      case 'AUTHENTIC':
      case 'REAL':
        return 'text-green-700 bg-green-100';
      case 'AI_GENERATED':
        return 'text-orange-700 bg-orange-100';
      case 'MANIPULATED':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const completedCount = batchJobs.filter(j => j.status === 'completed').length;
  const failedCount = batchJobs.filter(j => j.status === 'failed').length;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-center">📁 Batch Upload</h2>
        
        {/* File Selection */}
        <div className="mb-6">
          <label className="block w-full">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition">
              <FaUpload className="text-4xl text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-700 mb-2">
                {files.length > 0 
                  ? `${files.length} file(s) selected` 
                  : 'Click to select multiple images'}
              </p>
              <p className="text-sm text-gray-500">Supports JPG, PNG (max 10MB each, up to 20 files)</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isProcessing}
                className="hidden"
              />
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        {files.length > 0 && (
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={handleBatchUpload}
              disabled={isProcessing || !currentAccount}
              className="bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <FaSpinner className="animate-spin" />
                  Processing ({overallProgress}%)
                </span>
              ) : (
                `Upload & Verify ${files.length} File(s)`
              )}
            </button>
            
            {!isProcessing && files.length > 0 && (
              <button
                onClick={() => {
                  setFiles([]);
                  setBatchJobs([]);
                  setOverallProgress(0);
                }}
                className="bg-gray-300 text-gray-700 py-3 px-8 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Overall Progress */}
        {isProcessing && overallProgress > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold">Overall Progress</span>
              <span>{overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Batch Results Table */}
        {batchJobs.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Batch Results</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => exportResults('csv')}
                  disabled={completedCount === 0}
                  className="bg-green-600 text-white py-2 px-4 rounded text-sm hover:bg-green-700 transition disabled:bg-gray-400"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => exportResults('json')}
                  disabled={completedCount === 0}
                  className="bg-purple-600 text-white py-2 px-4 rounded text-sm hover:bg-purple-700 transition disabled:bg-gray-400"
                >
                  Export JSON
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{batchJobs.length}</div>
                <div className="text-sm text-blue-600">Total</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{completedCount}</div>
                <div className="text-sm text-green-600">Completed</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded p-4 text-center">
                <div className="text-2xl font-bold text-red-700">{failedCount}</div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
            </div>

            {/* Results Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">File Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Verdict</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {batchJobs.map(job => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          <span className="text-sm capitalize">{job.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{job.fileName}</td>
                      <td className="px-4 py-3">
                        {job.verdict && (
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getVerdictColor(job.verdict)}`}>
                            {job.verdict}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {job.confidence !== undefined && `${(job.confidence * 100).toFixed(1)}%`}
                        {job.error && <span className="text-red-600 text-xs">{job.error}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

