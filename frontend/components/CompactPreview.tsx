'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { FaTimes, FaExpand } from 'react-icons/fa';

interface CompactPreviewProps {
  preview: string;
  filename: string;
  fileSize: number;
  fileType: string;
  status: 'processing' | 'completed' | 'error';
  onRemove?: () => void;
}

export default function CompactPreview({
  preview,
  filename,
  fileSize,
  fileType,
  status,
  onRemove,
}: CompactPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Compact Preview - Top Right Corner */}
      <motion.div
        initial={{ scale: 1, x: 0, y: 0 }}
        animate={{ scale: 0.8, x: 0, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="relative"
      >
        {/* Container */}
        <div className="relative rounded-lg overflow-hidden border-2 border-gray-700 bg-gray-900/50 backdrop-blur-sm">
          {/* Image/Video */}
          <motion.div
            className="relative w-32 h-32 cursor-pointer group"
            onClick={() => setIsExpanded(true)}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            {fileType.startsWith('image/') && (
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            )}
            {fileType.startsWith('video/') && (
              <video
                src={preview}
                className="w-full h-full object-cover"
                muted
              />
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <FaExpand className="text-white text-xl" />
            </div>

            {/* Status Indicator */}
            {status === 'processing' && (
              <motion.div
                className="absolute inset-0 border-2 border-blue-500"
                animate={{
                  boxShadow: [
                    '0 0 0px rgba(59, 130, 246, 0.5)',
                    '0 0 20px rgba(59, 130, 246, 0.8)',
                    '0 0 0px rgba(59, 130, 246, 0.5)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}

            {status === 'completed' && (
              <div className="absolute inset-0 border-2 border-green-500" />
            )}

            {status === 'error' && (
              <div className="absolute inset-0 border-2 border-red-500" />
            )}

            {/* Processing Spinner */}
            {status === 'processing' && (
              <motion.div
                className="absolute top-2 right-2 w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            )}

            {/* Completed Checkmark */}
            {status === 'completed' && (
              <motion.div
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}
          </motion.div>

          {/* File Info */}
          <div className="p-2 bg-gray-900/80 backdrop-blur-sm">
            <p className="text-xs text-white font-medium truncate">{filename}</p>
            <p className="text-xs text-gray-400">{(fileSize / 1024 / 1024).toFixed(2)} MB</p>
          </div>

          {/* Remove Button */}
          {onRemove && status !== 'processing' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-600 flex items-center justify-center transition-colors z-10"
            >
              <FaTimes className="text-white text-xs" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Expanded Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              className="relative max-w-4xl max-h-[90vh] p-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute top-2 right-2 w-10 h-10 rounded-full bg-gray-900/80 hover:bg-gray-800 flex items-center justify-center transition-colors z-10"
              >
                <FaTimes className="text-white text-xl" />
              </button>

              {/* Image/Video */}
              {fileType.startsWith('image/') && (
                <img
                  src={preview}
                  alt="Preview"
                  className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
                />
              )}
              {fileType.startsWith('video/') && (
                <video
                  src={preview}
                  className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
                  controls
                  autoPlay
                />
              )}

              {/* File Info */}
              <div className="mt-4 text-center">
                <p className="text-white font-semibold">{filename}</p>
                <p className="text-gray-400 text-sm">{(fileSize / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

