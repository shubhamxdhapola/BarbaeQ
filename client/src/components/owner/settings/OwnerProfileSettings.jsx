import React from 'react';
import { User, Camera, Trash2, Save } from 'lucide-react';

export const OwnerProfileSettings = ({
  ownerData,
  setOwnerData,
  ownerAvatarPreview,
  user,
  ownerFileInputRef,
  handleOwnerAvatarChange,
  handleRemoveOwnerAvatar,
  savingOwnerProfile,
  handleSaveOwnerProfile
}) => {
  return (
    <form
      onSubmit={handleSaveOwnerProfile}
      className="bg-white p-5 sm:p-7 rounded-3xl shadow-card border border-zinc-200/80 space-y-6 animate-fade-in"
    >
      <div className="border-b border-zinc-100 pb-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <User className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-black text-zinc-900 tracking-tight">
            Owner Account Profile
          </h3>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            Personal display name, contact phone and profile picture
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* Avatar with Camera Trigger & Remove Below */}
        <div className="flex flex-col items-center shrink-0">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-zinc-100 border-2 border-zinc-200 overflow-hidden shadow-2xs flex items-center justify-center">
              {ownerAvatarPreview || user?.avatar ? (
                <img
                  src={ownerAvatarPreview || user?.avatar}
                  alt="Owner Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-zinc-800">
                  {user?.name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase() || 'SO'}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => ownerFileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-md border-2 border-white transition-transform group-hover:scale-110 cursor-pointer"
              title="Upload Profile Picture"
            >
              <Camera className="w-4 h-4" />
            </button>

            <input
              ref={ownerFileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleOwnerAvatarChange}
              className="hidden"
            />
          </div>

          {/* Remove Capsule Button Below Avatar */}
          {ownerAvatarPreview && (
            <button
              type="button"
              onClick={handleRemoveOwnerAvatar}
              disabled={savingOwnerProfile}
              className="mt-2.5 px-3 py-1 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              title="Remove Profile Picture"
            >
              <Trash2 className="w-3 h-3" />
              <span>Remove</span>
            </button>
          )}
        </div>

        {/* Input Fields */}
        <div className="flex-1 w-full space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
              Owner Full Name
            </label>
            <input
              type="text"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
              value={ownerData.name}
              onChange={(e) =>
                setOwnerData({ ...ownerData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                Owner Contact Phone
              </label>
              <input
                type="tel"
                maxLength={10}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
                value={ownerData.phone}
                onChange={(e) =>
                  setOwnerData({ ...ownerData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
                }
                placeholder="10-digit mobile number"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                Owner Email
              </label>
              <input
                type="email"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
                value={ownerData.email}
                onChange={(e) =>
                  setOwnerData({ ...ownerData, email: e.target.value })
                }
                placeholder="owner@example.com"
                required
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-zinc-100 flex justify-end">
        <button
          type="submit"
          disabled={savingOwnerProfile}
          className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-40"
        >
          <Save className="w-4 h-4" />
          {savingOwnerProfile ? 'Saving...' : 'Update Profile'}
        </button>
      </div>
    </form>
  );
};
