import React from 'react';
import { Image as ImageIcon, Trash2, Plus, Upload } from 'lucide-react';

export const ShopPhotosSettings = ({
  photos,
  setPreviewModal,
  handleDeletePhoto,
  handleFileChange,
  handleUploadPhotos,
  uploadingPhotos,
  selectedFiles,
  filePreviews,
  isDeactivatedByAdmin
}) => {
  return (
    <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-card border border-zinc-200/80 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-zinc-900 tracking-tight">
              Shop Photos Gallery ({photos.length}/5)
            </h3>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              Showcase high quality pictures of your chairs, styling stations and exterior storefront
            </p>
          </div>
        </div>
        <span className="text-xs font-bold px-3 py-1 bg-zinc-100 text-zinc-700 rounded-xl self-start sm:self-auto border border-zinc-200/60">
          Max 5 Photos
        </span>
      </div>

      {/* Photos Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        {photos.map((photoUrl, idx) => (
          <div
            key={idx}
            className="relative group rounded-2xl overflow-hidden border border-zinc-200/80 aspect-square bg-zinc-100 shadow-2xs"
          >
            <img
              src={photoUrl}
              alt={`Shop photo ${idx + 1}`}
              className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
              onClick={() =>
                setPreviewModal({
                  isOpen: true,
                  url: photoUrl,
                  title: `Shop Photo ${idx + 1}`,
                })
              }
            />
            <button
              type="button"
              onClick={() => handleDeletePhoto(photoUrl)}
              className="absolute top-2 right-2 p-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-xl shadow-md transition-transform hover:scale-110 cursor-pointer"
              title="Delete Photo"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <div className="absolute bottom-2 left-2">
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-lg shadow-xs ${
                  idx === 0
                    ? 'bg-zinc-900 text-white border border-white/20'
                    : 'bg-black/75 text-white backdrop-blur-xs'
                }`}
              >
                {idx === 0 ? '★ Front Cover' : `#${idx + 1}`}
              </span>
            </div>
          </div>
        ))}

        {/* Empty Slots */}
        {Array.from({ length: Math.max(0, 5 - photos.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="border-2 border-dashed border-zinc-200 rounded-2xl aspect-square flex flex-col items-center justify-center text-zinc-400 p-2 text-center bg-zinc-50/50"
          >
            <Plus className="w-5 h-5 mb-1 text-zinc-300" />
            <span className="text-[11px] font-bold text-zinc-400">
              Slot {photos.length + i + 1}
            </span>
          </div>
        ))}
      </div>

      {/* Upload Controls */}
      {photos.length < 5 && (
        <div className="bg-zinc-50/80 p-4 sm:p-5 rounded-2xl border border-zinc-200/70 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <label className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-zinc-100 text-zinc-800 font-bold text-xs rounded-xl border border-zinc-200 shadow-2xs cursor-pointer flex items-center justify-center gap-2 transition-all">
              <Upload className="w-4 h-4 text-zinc-600" />
              <span>Select Photos to Upload</span>
              <input
                type="file"
                multiple
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleFileChange}
                className="hidden"
                disabled={isDeactivatedByAdmin || uploadingPhotos}
              />
            </label>

            {selectedFiles.length > 0 && (
              <button
                type="button"
                onClick={handleUploadPhotos}
                disabled={uploadingPhotos}
                className="w-full sm:w-auto px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all disabled:opacity-40"
              >
                {uploadingPhotos
                  ? 'Uploading Photos...'
                  : `Upload ${selectedFiles.length} Photo(s)`}
              </button>
            )}
          </div>

          {/* Previews */}
          {filePreviews.length > 0 && (
            <div className="pt-2">
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                Ready to Upload:
              </p>
              <div className="flex gap-2.5 flex-wrap">
                {filePreviews.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative w-16 h-16 rounded-xl overflow-hidden border border-zinc-300 shadow-2xs"
                  >
                    <img
                      src={src}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
