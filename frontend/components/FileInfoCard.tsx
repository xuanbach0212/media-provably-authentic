'use client';

interface FileInfoCardProps {
  filename?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: string;
  mediaHash?: string;
  metadata?: any;
  forensicAnalysis?: any;
}

export default function FileInfoCard({
  filename,
  fileSize,
  mimeType,
  uploadedAt,
  mediaHash,
  metadata,
  forensicAnalysis,
}: FileInfoCardProps) {
  const formatBytes = (bytes: number = 0) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const exifData = forensicAnalysis?.exifData || {};
  const hasExif = exifData && Object.keys(exifData).length > 0;

  return (
    <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
      <h3 className="text-xl font-bold text-dark-text mb-4">📄 File Information</h3>
      
      <div className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-dark-muted">Filename</div>
            <div className="text-dark-text font-mono text-sm break-all">{filename || 'N/A'}</div>
          </div>
          <div>
            <div className="text-sm text-dark-muted">Size</div>
            <div className="text-dark-text font-mono text-sm">{formatBytes(fileSize)}</div>
          </div>
          <div>
            <div className="text-sm text-dark-muted">Type</div>
            <div className="text-dark-text font-mono text-sm">{mimeType || 'N/A'}</div>
          </div>
          <div>
            <div className="text-sm text-dark-muted">Uploaded</div>
            <div className="text-dark-text font-mono text-sm">{formatDate(uploadedAt)}</div>
          </div>
        </div>

        {/* Hash */}
        {mediaHash && (
          <div>
            <div className="text-sm text-dark-muted mb-1">SHA256 Hash</div>
            <div className="text-dark-text font-mono text-xs break-all bg-dark-bg p-2 rounded">
              {mediaHash}
            </div>
          </div>
        )}

        {/* EXIF Data */}
        {hasExif && (
          <div>
            <div className="text-sm text-dark-muted mb-2">EXIF Metadata</div>
            <div className="bg-dark-bg rounded p-3 space-y-2">
              {exifData.Make && (
                <div className="flex justify-between text-sm">
                  <span className="text-dark-muted">Camera Make:</span>
                  <span className="text-dark-text font-mono">{exifData.Make}</span>
                </div>
              )}
              {exifData.Model && (
                <div className="flex justify-between text-sm">
                  <span className="text-dark-muted">Camera Model:</span>
                  <span className="text-dark-text font-mono">{exifData.Model}</span>
                </div>
              )}
              {exifData.DateTime && (
                <div className="flex justify-between text-sm">
                  <span className="text-dark-muted">Date Taken:</span>
                  <span className="text-dark-text font-mono">{exifData.DateTime}</span>
                </div>
              )}
              {exifData.Software && (
                <div className="flex justify-between text-sm">
                  <span className="text-dark-muted">Software:</span>
                  <span className="text-dark-text font-mono">{exifData.Software}</span>
                </div>
              )}
              {(exifData.GPSLatitude || exifData.GPSLongitude) && (
                <div className="flex justify-between text-sm">
                  <span className="text-dark-muted">GPS:</span>
                  <span className="text-dark-text font-mono">
                    {exifData.GPSLatitude}, {exifData.GPSLongitude}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {!hasExif && (
          <div className="text-sm text-dark-muted italic">
            No EXIF metadata found (common for AI-generated or edited images)
          </div>
        )}

        {/* Additional Metadata */}
        {metadata && Object.keys(metadata).length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer text-dark-muted hover:text-dark-text">
              View Additional Metadata
            </summary>
            <pre className="mt-2 p-3 bg-dark-bg rounded text-xs text-green-400 overflow-auto max-h-40">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

