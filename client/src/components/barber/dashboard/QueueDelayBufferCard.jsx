import React from 'react';
import { Clock, X, Star } from 'lucide-react';

export const QueueDelayBufferCard = ({
  delayMinutes,
  handleAdjustDelay,
  isDeactivatedByShop,
  isShopClosed,
  isAvailable,
  myProfile,
  pendingCount,
  waitingCount,
}) => {
  const isControlsDisabled = isDeactivatedByShop || isShopClosed || !isAvailable;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Timing & Delay Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-card border border-zinc-200/80 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-900">
                Queue Delay Buffer
              </h3>
              <p className="text-[10px] text-zinc-500 font-medium">
                Add buffer to all upcoming queues
              </p>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
              delayMinutes > 0
                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
            }`}
          >
            {delayMinutes > 0 ? `+${delayMinutes}m delay` : 'On Schedule'}
          </span>
        </div>

        <p className="text-xs text-zinc-500 font-medium leading-relaxed">
          If the current service is taking longer, add extra buffer time to update estimated wait
          times for all waiting customers in real-time.
        </p>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleAdjustDelay(5)}
            disabled={isControlsDisabled}
            className={`py-2 px-1 rounded-xl border text-xs font-bold transition-colors shadow-2xs text-center ${
              isControlsDisabled
                ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed opacity-60'
                : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200/80 text-zinc-800 cursor-pointer'
            }`}
          >
            +5 min
          </button>
          <button
            onClick={() => handleAdjustDelay(10)}
            disabled={isControlsDisabled}
            className={`py-2 px-1 rounded-xl border text-xs font-bold transition-colors shadow-2xs text-center ${
              isControlsDisabled
                ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed opacity-60'
                : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200/80 text-zinc-800 cursor-pointer'
            }`}
          >
            +10 min
          </button>
          <button
            onClick={() => handleAdjustDelay(15)}
            disabled={isControlsDisabled}
            className={`py-2 px-1 rounded-xl border text-xs font-bold transition-colors shadow-2xs text-center ${
              isControlsDisabled
                ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed opacity-60'
                : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200/80 text-zinc-800 cursor-pointer'
            }`}
          >
            +15 min
          </button>
        </div>

        {delayMinutes > 0 && (
          <button
            onClick={() => handleAdjustDelay(0)}
            disabled={isControlsDisabled}
            className={`w-full py-2 rounded-xl border text-xs font-bold transition-colors text-center flex items-center justify-center gap-1.5 shadow-2xs ${
              isControlsDisabled
                ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed opacity-60'
                : 'bg-rose-50 hover:bg-rose-100 border-rose-200/80 text-rose-700 cursor-pointer'
            }`}
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset Delay (0 min)</span>
          </button>
        )}
      </div>

      {/* Station Summary Widget */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-card border border-zinc-200/80 space-y-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-900 border-b border-zinc-100 pb-3">
          Station Summary
        </h3>
        <div className="space-y-3 text-xs">
          <div className="flex justify-between items-center py-1">
            <span className="text-zinc-500 font-medium">Barber Rating:</span>
            <span className="font-bold text-zinc-900 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" />
              <span>
                {Number(myProfile?.averageRating || myProfile?.rating || 0) > 0
                  ? Number(myProfile.averageRating || myProfile.rating).toFixed(1)
                  : '0.0'}
              </span>
              <span className="text-zinc-400 text-[10px]">
                ({myProfile?.reviewCount || 0} reviews)
              </span>
            </span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-zinc-500 font-medium">Approval Requests:</span>
            <span className="font-bold text-zinc-900">{pendingCount}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-zinc-500 font-medium">People Waiting:</span>
            <span className="font-bold text-zinc-900">{waitingCount}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-zinc-500 font-medium">Station Mode:</span>
            <span className={`font-bold ${isAvailable ? 'text-emerald-700' : 'text-amber-700'}`}>
              {isAvailable ? 'Online & Available' : 'On Break'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
