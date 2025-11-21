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
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 sm:p-8 text-center ${
          dragActive ? 'border-blue-500 bg-blue-900/20' : 'border-dark-border'
        } ${file ? 'border-green-500' : ''}`}
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
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="space-y-4">
              <svg
                className="mx-auto h-12 w-12 text-dark-muted"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="text-gray-600">
                <span className="font-semibold text-blue-600 hover:text-blue-500">
                  Click to upload
                </span>{' '}
                or drag and drop
              </div>
              <p className="text-sm text-gray-500">
                Image or video up to 100MB
              </p>
            </div>
          </label>
        ) : (
          <div className="space-y-4">
            {file?.type.startsWith('image/') && (
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 mx-auto rounded border border-dark-border"
              />
            )}
            {file?.type.startsWith('video/') && (
              <video
                src={preview}
                className="max-h-64 mx-auto rounded border border-dark-border"
                controls
              />
            )}
            <div className="text-sm text-dark-text">
              {file?.name} ({(file!.size / 1024 / 1024).toFixed(2)} MB)
            </div>
            <button
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
              className="text-sm text-red-400 hover:text-red-300"
              disabled={uploading}
            >
              Remove
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
        <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-900 rounded-lg text-center">
          <p className="text-sm text-yellow-400">
            Please connect your Sui wallet to upload and verify media
          </p>
        </div>
      )}

      {file && !uploading && account && (
        <button
          onClick={handleUpload}
          className="mt-6 w-full btn-sui text-white py-3 px-6 rounded-lg font-semibold shadow-lg"
        >
          Sign & Verify Authenticity
        </button>
      )}

      {uploading && (
        <div className="mt-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-dark-muted">Uploading and encrypting...</p>
        </div>
      )}
    </div>
  );
}

