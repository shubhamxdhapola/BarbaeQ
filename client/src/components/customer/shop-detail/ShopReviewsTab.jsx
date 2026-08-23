import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ChevronRight } from 'lucide-react';
import { Skeleton } from '../../ui/Skeleton';

const getInitials = (name) =>
  name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'C';

export const ShopReviewsTab = ({
  shopReviews,
  reviewsLoading,
  averageRating,
  shopId
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-zinc-100 space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            Customer Reviews ({shopReviews.length})
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">Verified customer feedback</p>
        </div>
        {averageRating > 0 && (
          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
            ⭐ {averageRating.toFixed(1)} / 5
          </span>
        )}
      </div>

      {reviewsLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : shopReviews.length > 0 ? (
        <div className="space-y-3">
          {shopReviews.map((rev) => (
            <div
              key={rev._id}
              className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {rev.customerId?.avatar ? (
                    <img
                      src={rev.customerId.avatar}
                      alt={rev.customerId.name}
                      className="w-7 h-7 rounded-lg object-cover border border-zinc-200"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200/80 flex items-center justify-center font-bold text-[10px]">
                      {getInitials(rev.customerId?.name || 'C')}
                    </div>
                  )}
                  <span className="font-semibold text-zinc-900 text-xs sm:text-sm">
                    {rev.customerId?.name || 'Verified Customer'}
                  </span>
                </div>
                <div className="flex items-center space-x-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3 h-3 ${
                        s <= rev.shopRating ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {rev.barberId?.userId?.name && (
                <p className="text-xs text-zinc-600 font-medium">
                  Barber: <span className="text-zinc-900">{rev.barberId.userId.name}</span> (⭐{' '}
                  {rev.barberRating}/5)
                </p>
              )}

              {rev.comment && (
                <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed italic bg-white p-2.5 rounded-lg border border-zinc-100">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              )}

              <p className="text-[10px] text-zinc-400">
                {new Date(rev.createdAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          ))}

          <div className="pt-1">
            <button
              onClick={() => navigate(`/shops/${shopId}/reviews`)}
              className="w-full py-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-semibold text-xs rounded-xl border border-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View All Reviews</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-zinc-400 text-xs">
          No reviews yet. Be the first customer to rate this shop after your service!
        </div>
      )}
    </div>
  );
};
