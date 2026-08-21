import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Star, 
  MessageSquare, 
  Calendar, 
  Store, 
  ArrowUpDown, 
  ThumbsUp, 
  Award,
  Search,
  Scissors,
  CheckCircle2,
  Filter,
  ChevronDown
} from 'lucide-react';
import { fetchMyBarberReviews } from '../../redux/slices/review.slice.js';
import { Skeleton } from '../../components/ui/Skeleton';
import { Pagination } from '../../components/ui/Pagination';

export const ReviewsPage = () => {
  const dispatch = useDispatch();
  const { barberReviews: reviews, barberProfile, barberLoading: loading } = useSelector((state) => state.review);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStar, setSelectedStar] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(fetchMyBarberReviews());
  }, [dispatch]);

  // KPI Calculations
  const totalReviewsCount = reviews.length > 0 ? reviews.length : (barberProfile?.reviewCount || 0);
  const avgRating = useMemo(() => {
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + (Number(r.barberRating) || 0), 0);
      return (sum / reviews.length).toFixed(1);
    }
    if (barberProfile?.averageRating || barberProfile?.rating) {
      return Number(barberProfile.averageRating || barberProfile.rating).toFixed(1);
    }
    return '0.0';
  }, [reviews, barberProfile]);

  const satisfactionRate = useMemo(() => {
    if (!reviews.length) return 0;
    const positive = reviews.filter(r => (r.barberRating || 0) >= 4).length;
    return Math.round((positive / reviews.length) * 100);
  }, [reviews]);

  const fiveStarCount = useMemo(() => {
    return reviews.filter(r => (r.barberRating || 0) === 5).length;
  }, [reviews]);

  // Filtered & Sorted Reviews
  const filteredReviews = useMemo(() => {
    return reviews
      .filter((rev) => {
        if (selectedStar !== 'ALL') {
          if (rev.barberRating !== Number(selectedStar)) return false;
        }
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          const custName = (rev.customerId?.name || '').toLowerCase();
          const comment = (rev.comment || '').toLowerCase();
          if (!custName.includes(query) && !comment.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'HIGHEST') return b.barberRating - a.barberRating;
        if (sortOrder === 'LOWEST') return a.barberRating - b.barberRating;
        return new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt);
      });
  }, [reviews, selectedStar, searchTerm, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage) || 1;
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReviews.slice(start, start + itemsPerPage);
  }, [filteredReviews, currentPage, itemsPerPage]);

  const renderStars = (rating) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${
            s <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'
          }`}
        />
      ))}
      <span className="text-xs font-black text-zinc-900 ml-1">{rating}/5</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 1. Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-card border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-3.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-2xl font-bold text-zinc-900 tracking-tight">Customer Ratings & Reviews</h2>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/70 shrink-0">
                {totalReviewsCount > 0 ? `⭐ ${avgRating} Average` : '⭐ No Reviews Yet'}
              </span>
            </div>
            <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-0.5">Your Queue, Simplified. Direct customer ratings and feedback for your haircut cuts.</p>
          </div>
        </div>

        {/* Quick Summary Pill matching Owner Header Pill */}
        <div className="hidden sm:flex items-center gap-3 bg-zinc-50/90 border border-zinc-200/80 px-4 py-2.5 rounded-2xl self-start sm:self-auto shadow-2xs shrink-0">
          <div className="flex items-center gap-1.5 text-zinc-900 font-black text-sm">
            <Star className={`w-4 h-4 ${totalReviewsCount > 0 ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}`} />
            <span>{totalReviewsCount > 0 ? avgRating : '0.0'}</span>
          </div>
          <div className="h-4 w-px bg-zinc-200" />
          <span className="text-xs font-bold text-zinc-600">
            {totalReviewsCount} Review{totalReviewsCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* 2. Top Metric KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Barber Rating</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 flex items-center gap-1">
              {totalReviewsCount > 0 ? avgRating : '0.0'}{' '}
              <span className="text-sm font-semibold text-zinc-400">/ 5.0</span>
            </div>
            <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
              {totalReviewsCount > 0 ? 'Skill & service quality' : 'No ratings recorded yet'}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Feedback</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-zinc-900">{totalReviewsCount}</div>
            <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Verified customer reviews</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Satisfaction</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ThumbsUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">
              {totalReviewsCount > 0 ? `${satisfactionRate}%` : '—'}
            </div>
            <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
              {totalReviewsCount > 0 ? '4+ star ratings' : 'No ratings recorded yet'}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">5-Star Reviews</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-zinc-900">{fiveStarCount}</div>
            <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Top-tier ratings</p>
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-card border border-zinc-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer or comment..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all placeholder:text-zinc-400"
          />
        </div>

        {/* Minimal Select Dropdowns matching Owner Reviews */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Star Filter Select */}
          <div className="relative">
            <select
              value={selectedStar}
              onChange={(e) => {
                setSelectedStar(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-bold text-xs pl-3.5 pr-8 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Stars</option>
              <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
              <option value="4">⭐⭐⭐⭐ 4 Stars</option>
              <option value="3">⭐⭐⭐ 3 Stars</option>
              <option value="2">⭐⭐ 2 Stars</option>
              <option value="1">⭐ 1 Star</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>

          {/* Sort Order Select */}
          <div className="relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="appearance-none bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-bold text-xs pl-3.5 pr-8 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all cursor-pointer shadow-2xs"
            >
              <option value="NEWEST">Newest First</option>
              <option value="HIGHEST">Highest Rating</option>
              <option value="LOWEST">Lowest Rating</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 4. Reviews Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-3xl" />
          ))}
        </div>
      ) : paginatedReviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedReviews.map((rev) => {
            const customerName = rev.customerId?.name || 'Verified Customer';
            const dateStr = new Date(rev.createdAt || rev.updatedAt).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={rev._id}
                className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-card hover:border-zinc-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-3 mb-3">
                    <div className="flex items-center gap-3">
                      {rev.customerId?.avatar ? (
                        <img
                          src={rev.customerId.avatar}
                          alt={customerName}
                          className="w-10 h-10 rounded-xl object-cover border border-zinc-200 shadow-2xs shrink-0"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200/80 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {customerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-zinc-900 text-sm leading-snug">{customerName}</p>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200/60 inline-flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed Service
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-zinc-400 font-semibold flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      {dateStr}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-zinc-50/70 p-3 rounded-2xl border border-zinc-200/80">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                        Barber Rating
                      </p>
                      {renderStars(rev.barberRating)}
                    </div>
                    <div className="bg-zinc-50/70 p-3 rounded-2xl border border-zinc-200/80">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                        Shop Ambience
                      </p>
                      {renderStars(rev.shopRating)}
                    </div>
                  </div>

                  {rev.comment && (
                    <div className="bg-zinc-50/50 p-3.5 rounded-2xl border border-zinc-100 mt-2">
                      <p className="text-xs sm:text-sm text-zinc-700 font-medium italic leading-relaxed">
                        "{rev.comment}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-16 text-center border border-zinc-200/80 shadow-card">
          <Star className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-900">No Reviews Found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Customer feedback matching your search and filter criteria will show here.
          </p>
        </div>
      )}

      {/* 5. Standalone Pagination Card */}
      {filteredReviews.length > 0 && (
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/80 shadow-card">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            totalItems={filteredReviews.length}
            pageSize={itemsPerPage}
          />
        </div>
      )}
    </div>
  );
};
