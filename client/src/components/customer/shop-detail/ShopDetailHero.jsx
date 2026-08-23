import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Clock, Share2, ExternalLink, ArrowRight } from 'lucide-react';

export const ShopDetailHero = ({
  shop,
  shopReviews,
  googleMapsUrl,
  handleShare,
  activeExistingAppt
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Back button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-1 transition-colors cursor-pointer"
        >
          ← Back
        </button>
      </div>

      {/* Shop Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">
                {shop.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  shop.isOpen
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-rose-50 text-rose-700 border border-rose-100'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    shop.isOpen ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
                {shop.isOpen ? 'Open' : 'Closed'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-zinc-500">
              <div className="flex items-center font-semibold text-zinc-900">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 mr-1" />
                <span>{shop.averageRating ? shop.averageRating.toFixed(1) : 'New'}</span>
                <span className="text-zinc-400 font-normal ml-0.5">
                  ({shop.reviewCount || shopReviews.length || 0})
                </span>
              </div>

              <div className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-zinc-400 shrink-0" />
                <span>
                  {shop.address || shop.city}, <span className="capitalize">{shop.city}</span>
                </span>
              </div>

              <div className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-zinc-400 shrink-0" />
                <span>
                  {shop.openingTime && shop.closingTime
                    ? `${shop.openingTime} — ${shop.closingTime}`
                    : '09:00 AM — 09:00 PM'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Right */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleShare}
              className="py-2 px-3.5 rounded-xl text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Share</span>
            </button>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3.5 rounded-xl text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>Directions</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>
        </div>
      </div>

      {/* Active Appointment Alert Card (if exists) */}
      {activeExistingAppt && (
        <div
          onClick={() => navigate(`/appointments/${activeExistingAppt._id}`)}
          className="bg-white rounded-2xl shadow-sm border border-amber-200 p-4 flex items-center justify-between cursor-pointer hover:border-amber-300 transition-all relative overflow-hidden group"
        >
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-amber-500" />
          <div className="pl-2 space-y-0.5">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Active booking exists
            </span>
            <h3 className="font-semibold text-zinc-900 text-sm">
              You have an ongoing appointment here
            </h3>
            <p className="text-xs text-zinc-500">
              Track your live queue turn instead of booking a new slot
            </p>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-amber-700 shrink-0 pr-1">
            <span>Track Turn</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      )}
    </div>
  );
};
