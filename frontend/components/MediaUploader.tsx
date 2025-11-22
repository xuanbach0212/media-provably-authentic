'use client';

import { useState, useCallback } from 'react';
import { ApiClient } from '@/lib/api';
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';

interface MediaUploaderProps {
  onUploadComplete: (jobId: string, walletAddress: string, signature: string, initialProgress?: any) => void;
  onUploadStart?: () => void; // Notify parent when upload starts
}

export default function MediaUploader({ onUploadComplete, onUploadStart }: MediaUploaderProps) {
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
      setPreview(reader.result as string);
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
        className={`relative rounded-xl p-10 text-center transition-all duration-500 border-2 ${
          dragActive 
            ? 'border-[#4DA2FF] bg-[#4DA2FF]/10' 
            : file 
            ? 'border-[#22C55E] bg-[#22C55E]/10' 
            : 'border-gray-700 bg-gray-900/30 hover:border-gray-600 hover:bg-gray-900/50'
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
            <div className="space-y-7">
              {/* Icon with pulse animation */}
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#4DA2FF] to-[#06B6D4] animate-pulse opacity-30"></div>
                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-[#4DA2FF] to-[#06B6D4] flex items-center justify-center shadow-2xl shadow-[#4DA2FF]/50">
                  <svg
                    className="h-12 w-12 text-white"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-[#4DA2FF] to-[#06B6D4] bg-clip-text text-transparent">
                  Drop your media here
                </p>
                <p className="text-base text-gray-300">
                  or <span className="text-[#4DA2FF] font-semibold hover:text-[#6FBCFF] transition-colors cursor-pointer underline decoration-dotted">browse files</span>
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700/50">
                <span className="text-sm text-gray-400 font-medium">📸 Images & 🎬 Videos</span>
                <span className="text-gray-600">•</span>
                <span className="text-sm text-gray-400 font-medium">Max 100MB</span>
              </div>
            </div>
          </label>
        ) : (
          <div className="space-y-4">
            {file?.type.startsWith('image/') && (
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 mx-auto rounded-lg border-2 border-[#14B8A6]/50 shadow-xl"
              />
            )}
            {file?.type.startsWith('video/') && (
              <video
                src={preview}
                className="max-h-64 mx-auto rounded-lg border-2 border-[#14B8A6]/50 shadow-xl"
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
              className="text-sm text-red-400 hover:text-red-300 transition-colors font-medium"
              disabled={uploading}
            >
              ✕ Remove
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-900 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      {!account && (
        <div className="mt-6 p-5 bg-gradient-to-r from-yellow-900/10 to-orange-900/10 border border-yellow-700/50 rounded-xl text-center backdrop-blur-sm">
          <p className="text-sm text-yellow-300 font-medium">
            ⚠️ Connect your Sui wallet to verify media authenticity
          </p>
        </div>
      )}

      {file && !uploading && account && (
        <button
          onClick={handleUpload}
          className="mt-6 w-full btn-sui text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-2xl transform hover:scale-[1.02] transition-all"
        >
          🔐 Sign & Verify Authenticity
        </button>
      )}

      {uploading && (
        <div className="mt-6 text-center p-6 bg-[#4DA2FF]/10 rounded-xl border border-[#4DA2FF]/30">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#4DA2FF] border-t-transparent"></div>
          <p className="mt-3 text-white font-medium">Uploading and encrypting...</p>
          <p className="mt-1 text-xs text-gray-400">Please wait while we secure your media</p>
        </div>
      )}
    </div>
  );
}

