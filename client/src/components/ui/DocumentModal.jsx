import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { ExternalLink, FileText, AlertCircle } from 'lucide-react';

export const DocumentModal = ({ isOpen, onClose, url, title = 'Document Preview', isPdf: isPdfProp }) => {
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setLoadError(false);
  }, [url, isOpen]);

  if (!isOpen || !url) return null;

  const isPdf = isPdfProp || (typeof url === 'string' && (
    url.toLowerCase().endsWith('.pdf') ||
    url.toLowerCase().includes('.pdf') ||
    url.startsWith('data:application/pdf')
  ));

  const isCloudinaryUrl = typeof url === 'string' && url.includes('cloudinary.com');

  // Cloudinary PDF under /image/upload/ renders page 1 as PNG when extension is .png
  const cloudinaryPngPreviewUrl = (isCloudinaryUrl && isPdf && url.includes('/image/upload/'))
    ? url.replace(/\.pdf$/i, '.png')
    : null;

  // Direct view link for opening in a new tab
  const directViewUrl = (isCloudinaryUrl && isPdf && url.includes('/image/upload/'))
    ? url.replace(/\.pdf$/i, '.png')
    : url;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="flex flex-col items-center justify-center space-y-4">
        {/* Top Action Header */}
        <div className="w-full flex items-center justify-between bg-surface-50 p-3.5 rounded-2xl border border-surface-200 text-xs gap-2">
          <div className="flex items-center gap-2 text-ink font-semibold truncate">
            <FileText className="w-4 h-4 text-surface-600 flex-shrink-0" />
            <span className="truncate">{title}</span>
          </div>

          <a
            href={directViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 font-bold flex-shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
          </a>
        </div>

        {/* Main Document Display Container */}
        <div className="w-full min-h-[50vh] max-h-[65vh] flex items-center justify-center bg-surface-100 rounded-2xl overflow-hidden border border-surface-200 p-2 relative">
          {loadError ? (
            /* Load Error Fallback Card */
            <div className="p-8 text-center flex flex-col items-center justify-center h-full space-y-3 bg-white rounded-2xl w-full">
              <AlertCircle className="w-12 h-12 text-amber-500" />
              <p className="text-sm font-bold text-ink">Document Preview Notice</p>
              <p className="text-xs text-muted max-w-sm">
                Click below to view the full document in a new browser tab.
              </p>
              <a
                href={directViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-xs flex items-center gap-2 px-5 py-2"
              >
                <ExternalLink className="w-4 h-4" /> Open Document
              </a>
            </div>
          ) : cloudinaryPngPreviewUrl ? (
            /* Cloudinary PDF rendered as high-res PNG preview */
            <img
              src={cloudinaryPngPreviewUrl}
              alt={title}
              className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-sm"
              onError={() => setLoadError(true)}
            />
          ) : isPdf ? (
            /* Blob / Data / Direct PDF iframe embed */
            <div className="w-full h-[60vh] flex flex-col items-center justify-center">
              <iframe
                src={url}
                title={title}
                className="w-full h-full rounded-xl border-0"
                onError={() => setLoadError(true)}
              />
            </div>
          ) : (
            /* Standard Image Display */
            <img
              src={url}
              alt={title}
              className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-sm"
              onError={() => setLoadError(true)}
            />
          )}
        </div>

        {/* Footer Close Button */}
        <div className="w-full flex justify-end pt-2">
          <button
            onClick={onClose}
            className="btn-secondary text-xs px-5 py-2 rounded-xl"
          >
            Close Preview
          </button>
        </div>
      </div>
    </Modal>
  );
};
