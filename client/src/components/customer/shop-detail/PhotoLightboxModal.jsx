import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export const PhotoLightboxModal = ({
  activePhotoIdx,
  setActivePhotoIdx,
  photos,
}) => {
  if (activePhotoIdx === null || !photos[activePhotoIdx]) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      onClick={() => setActivePhotoIdx(null)}
    >
      <button
        onClick={() => setActivePhotoIdx(null)}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors z-50 cursor-pointer"
        title="Close Lightbox"
      >
        <X className="w-5 h-5" />
      </button>

      {photos.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
          }}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors z-50 cursor-pointer"
          title="Previous Photo"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      <div
        className="max-w-4xl max-h-[85vh] flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photos[activePhotoIdx]}
          alt={`Shop photo ${activePhotoIdx + 1}`}
          className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-2xl"
        />
        <p className="text-white/80 text-xs font-medium mt-3">
          Photo {activePhotoIdx + 1} of {photos.length}
        </p>
      </div>

      {photos.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActivePhotoIdx((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
          }}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors z-50 cursor-pointer"
          title="Next Photo"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
