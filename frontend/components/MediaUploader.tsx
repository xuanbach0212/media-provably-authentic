'use client';

import { useState, useCallback } from 'react';
import { ApiClient } from '@/lib/api';
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';

interface MediaUploaderProps {
  onUploadComplete: (jobId: string, walletAddress: string, signature: string, initialProgress?: any) => void;
  onProgressUpdate?: (update: any) => void;
  onAnalysisComplete?: (report: any) => void;
  onAnalysisError?: (error: any) => void;
  onUploadStart?: () => void;
  onFileSelected?: (fileInfo: { preview: string; filename: string; fileSize: number; fileType: string }) => void;
}

export default function MediaUploader({ 
  onUploadComplete, 
  onUploadStart,
  onProgressUpdate,
  onAnalysisComplete,
  onAnalysisError,
  onFileSelected
}: MediaUploaderProps) {
  const account = useCurrentAccount();
  const { mutate: signMessage } = useSignPersonalMessage();
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setError('Please upload an image or video file');
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError('File size must be less than 100MB');
      return;
    }

    setFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const previewUrl = reader.result as string;
      setPreview(previewUrl);
      
      // Notify parent with file info
      if (onFileSelected) {
        onFileSelected({
          preview: previewUrl,
          filename: file.name,
          fileSize: file.size,
          fileType: file.type,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!file) return;

    // Check wallet connection
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

    setUploading(true);
    setError(null);
    
    // Notify parent that upload is starting
    if (onUploadStart) {
      onUploadStart();
    }

    try {
      // Sign message with wallet
      const message = `Upload media for verification: ${file.name} (${new Date().toISOString()})`;
      const messageBytes = new TextEncoder().encode(message);

      signMessage(
        { message: messageBytes },
        {
          onSuccess: async (result) => {
            try {
              console.log('[MediaUploader] Message signed successfully');
              
              // Upload with signature
              const response = await ApiClient.uploadMedia(
                file,
                account.address,
                result.signature
              );
              
              console.log('[MediaUploader] Upload successful:', response);
              onUploadComplete(response.jobId, account.address, result.signature, response.progress);
            } catch (err: any) {
              setError(err.message || 'Upload failed');
              console.error('[MediaUploader] Upload error:', err);
              setUploading(false);
            }
          },
          onError: (err) => {
            setError('Failed to sign message: ' + err.message);
            console.error('[MediaUploader] Signing error:', err);
            setUploading(false);
          },
        }
      );
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      console.error('[MediaUploader] Upload error:', err);
      setUploading(false);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`relative rounded-xl p-6 text-center transition-all duration-300 border-2 ${
          dragActive 
            ? 'border-[#4DA2FF] bg-[#4DA2FF]/10' 
            : file 
            ? 'border-[#22C55E] bg-[#22C55E]/10' 
            : 'border-gray-700 bg-gray-900/30 hover:border-gray-600'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept="image/*,video/*"
          onChange={handleChange}
          disabled={uploading}
          multiple
        />

        {!preview ? (
          <label htmlFor="file-upload" className="cursor-pointer block">
            <div className="space-y-4">
              {/* Compact Icon */}
              <div className="relative mx-auto w-16 h-16">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#4DA2FF] to-[#06B6D4] flex items-center justify-center shadow-lg">
                  <svg
                    className="h-8 w-8 text-white"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-base font-semibold text-white mb-1">
                  Drop your media here
                </p>
                <p className="text-sm text-gray-400">
                  or <span className="text-[#4DA2FF] underline">browse files</span>
                </p>
              </div>
              <p className="text-xs text-gray-500">
                📸 Images & 🎬 Videos • Max 100MB
              </p>
            </div>
          </label>
        ) : (
          <div className="space-y-3">
            {file?.type.startsWith('image/') && (
              <img
                src={preview}
                alt="Preview"
                className="max-h-48 mx-auto rounded-lg border-2 border-[#22C55E]/50"
              />
            )}
            {file?.type.startsWith('video/') && (
              <video
                src={preview}
                className="max-h-48 mx-auto rounded-lg border-2 border-[#22C55E]/50"
                controls
              />
            )}
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-white font-medium">{file?.name}</span>
              <span className="text-gray-500">•</span>
              <span className="text-[#4DA2FF]">{(file!.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
              disabled={uploading}
            >
              ✕ Remove
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-2.5 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-xs">
          ⚠️ {error}
        </div>
      )}

      {!account && (
        <div className="mt-3 p-2.5 bg-yellow-900/20 border border-yellow-500/30 rounded-lg text-yellow-400 text-xs text-center">
          ⚠️ Connect your Sui wallet to verify media authenticity
        </div>
      )}

      {file && !uploading && account && (
        <button
          onClick={handleUpload}
          className="mt-3 w-full bg-gradient-to-r from-[#4DA2FF] to-[#06B6D4] hover:from-[#6FBCFF] hover:to-[#14B8A6] text-white py-2.5 px-4 rounded-lg font-semibold text-sm shadow-lg transform hover:scale-[1.02] transition-all"
        >
          🔐 Sign & Verify Authenticity
        </button>
      )}

      {uploading && (
        <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-center justify-center gap-2 text-blue-400 text-sm">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Uploading and encrypting...</span>
          </div>
          <p className="text-xs text-gray-400 text-center mt-1">Please wait while we secure your media</p>
        </div>
      )}
    </div>
  );
}

