import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Star, 
  MessageSquare, 
  Filter, 
  User, 
  Store, 
  ArrowUpDown, 
  Calendar,
  Sparkles,
  Scissors,
  CheckCircle2,
  ChevronDown,
  Search,
  Award,
  ThumbsUp,
  Inbox,
  MessageCircle
} from 'lucide-react';
import { fetchMyShop } from '../../redux/slices/shop.slice.js';
import { fetchShopBarbers } from '../../redux/slices/barber.slice.js';
import { fetchShopReviews } from '../../redux/slices/review.slice.js';
import { Skeleton } from '../../components/ui/Skeleton';
import { Pagination } from '../../components/ui/Pagination';

export const ReviewsPage = () => {
  const dispatch = useDispatch();
  const { myShop: shop, loading: shopLoading } = useSelector((state) => state.shop);
  const { barbers = [] } = useSelector((state) => state.barber);
  const { reviews = [], loading: reviewsLoading, lastFetchedShopId } = useSelector((state) => state.review);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState('ALL');
  const [selectedStar, setSelectedStar] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('NEWEST'); // 'NEWEST' | 'HIGHEST' | 'LOWEST'

  const loading = reviewsLoading && reviews.length === 0;

  useEffect(() => {
    if (!shop) {
      dispatch(fetchMyShop());
    }
  }, [dispatch, shop]);

  useEffect(() => {
    if (shop?._id) {
      if (barbers.length === 0) {
        dispatch(fetchShopBarbers(shop._id));
      }
      if (lastFetchedShopId !== shop._id || reviews.length === 0) {
        dispatch(fetchShopReviews({ shopId: shop._id }));
      }
    }
  }, [dispatch, shop?._id, barbers.length, lastFetchedShopId, reviews.length]);

  // Calculations for KPI Cards
  const totalReviewsCount = reviews.length;
  const avgShopRating = useMemo(() => {
    if (!reviews.length) return '0.0';
    const sum = reviews.reduce((acc, r) => acc + (Number(r.shopRating) || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const sortedBarbers = useMemo(() => {
    if (!barbers.length) return [];
    return [...barbers].sort((a, b) => {
      const aRating = Number(a.averageRating || a.avgRating || 0);
      const bRating = Number(b.averageRating || b.avgRating || 0);
      if (bRating !== aRating) {
        return bRating - aRating;
      }
      // Tie-breaker: Total reviews count (higher reviews wins)
      const aCount = Number(a.reviewCount || a.reviewsCount || 0);
      const bCount = Number(b.reviewCount || b.reviewsCount || 0);
      return bCount - aCount;
    });
  }, [barbers]);

  const topBarber = useMemo(() => {
    const ratedBarbers = sortedBarbers.filter(
      (b) => Number(b.reviewCount || b.reviewsCount || 0) > 0
    );
    return ratedBarbers[0] || null;
  }, [sortedBarbers]);

  const satisfactionRate = useMemo(() => {
    if (!reviews.length) return 0;
    const positive = reviews.filter((r) => (r.shopRating || 0) >= 4).length;
    return Math.round((positive / reviews.length) * 100);
  }, [reviews]);

  // Filtered & Sorted Reviews
  const filteredReviews = useMemo(() => {
    return reviews
      .filter((rev) => {
        if (selectedBarberId !== 'ALL') {
          const bId = rev.barberId?._id || rev.barberId;
          if (bId !== selectedBarberId) return false;
        }
        if (selectedStar !== 'ALL') {
          if (rev.shopRating !== Number(selectedStar)) return false;
        }
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          const custName = (rev.customerId?.name || '').toLowerCase();
          const comment = (rev.comment || '').toLowerCase();
          const barbName = (rev.barberId?.userId?.name || '').toLowerCase();
          if (!custName.includes(query) && !comment.includes(query) && !barbName.includes(query)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'HIGHEST') return b.shopRating - a.shopRating;
        if (sortOrder === 'LOWEST') return a.shopRating - b.shopRating;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [reviews, selectedBarberId, selectedStar, searchTerm, sortOrder]);

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBarberId, selectedStar, searchTerm, sortOrder]);

  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * 10;
    return filteredReviews.slice(start, start + 10);
  }, [filteredReviews, currentPage]);

  const renderStars = (rating) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${
            s <= Math.round(rating) 
              ? 'fill-amber-400 text-amber-400' 
              : 'fill-zinc-200 text-zinc-200'
          }`}
        />
      ))}
      <span className="text-xs font-black text-zinc-900 ml-1.5">{rating}/5</span>
    </div>
  );

  if (shopLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-zinc-200 text-center font-bold text-muted">
        No shop registered yet
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* 1. Header with Consistent Section Styling */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-card border border-zinc-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 transition-all">
        <div className="flex items-center gap-3.5">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">Reviews & Ratings</h2>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/70">
                {totalReviewsCount > 0 ? `⭐ ${avgShopRating} Average` : '⭐ No Reviews Yet'}
              </span>
            </div>
            <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-0.5">
              Customer feedback, ambience ratings, and individual staff performance
            </p>
          </div>
        </div>

        {/* Quick Summary Pill */}
        <div className="hidden sm:flex items-center gap-3 bg-zinc-50/90 border border-zinc-200/80 px-4 py-2.5 rounded-2xl self-start md:self-auto shadow-2xs">
          <div className="flex items-center gap-1.5 text-zinc-900 font-black text-sm">
            <Star className={`w-4 h-4 ${totalReviewsCount > 0 ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}`} />
            <span>{totalReviewsCount > 0 ? avgShopRating : '0.0'}</span>
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
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Overall Rating</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 flex items-center gap-1">
              {totalReviewsCount > 0 ? avgShopRating : '0.0'}{' '}
              <span className="text-sm font-semibold text-zinc-400">/ 5.0</span>
            </div>
            <p className="text-[11px] text-muted font-medium mt-0.5">
              {totalReviewsCount > 0 ? 'Shop ambience & service' : 'No ratings recorded yet'}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Total Feedback</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-zinc-900">{totalReviewsCount}</div>
            <p className="text-[11px] text-muted font-medium mt-0.5">Customer reviews</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Satisfaction</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ThumbsUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">
              {totalReviewsCount > 0 ? `${satisfactionRate}%` : '—'}
            </div>
            <p className="text-[11px] text-muted font-medium mt-0.5">
              {totalReviewsCount > 0 ? '4+ star reviews' : 'No ratings recorded yet'}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Top Specialist</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-base sm:text-lg font-black text-zinc-900 truncate">
              {topBarber ? (topBarber.userId?.name || 'Barber') : '—'}
            </div>
            <p className="text-[11px] text-muted font-medium mt-0.5">
              {topBarber && (topBarber.averageRating || topBarber.rating)
                ? `⭐ ${(topBarber.averageRating || topBarber.rating).toFixed(1)} rating`
                : 'No ratings yet'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Interactive Barber Filter Carousel / Grid */}
      {barbers.length > 0 && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/80">
                <Scissors className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Barber Ratings Breakdown</h3>
            </div>
            <span className="text-xs font-bold text-muted">{barbers.length} Barbers</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {sortedBarbers.map((b) => {
              const name = b.userId?.name || 'Barber';
              const rating = b.averageRating > 0 ? b.averageRating.toFixed(1) : '5.0';
              const isSelected = selectedBarberId === b._id;

              return (
                <div 
                  key={b._id} 
                  onClick={() => setSelectedBarberId(isSelected ? 'ALL' : b._id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected 
                      ? 'bg-zinc-900 border-zinc-900 text-white shadow-sm' 
                      : 'bg-zinc-50/70 border-zinc-200/80 hover:border-zinc-300 text-zinc-900 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {b.userId?.avatar ? (
                      <img
                        src={b.userId.avatar}
                        alt={name}
                        className="w-9 h-9 rounded-xl object-cover border border-zinc-200 shadow-2xs shrink-0"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-900 border border-zinc-200 shadow-2xs'
                      }`}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className={`font-bold text-sm leading-snug ${isSelected ? 'text-white' : 'text-zinc-900'}`}>{name}</p>
                      <p className={`text-[11px] ${isSelected ? 'text-zinc-300' : 'text-zinc-500'} font-medium`}>
                        {b.reviewCount || 0} reviews
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                    isSelected 
                      ? 'bg-white/20 text-amber-300' 
                      : 'bg-white text-zinc-900 border border-zinc-200 shadow-2xs'
                  }`}>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{rating}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Filter & Search Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-card border border-zinc-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text"
            placeholder="Search by customer, comment or barber..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all placeholder:text-zinc-400"
          />
        </div>

        {/* Minimal Select Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Barber Select */}
          <div className="relative">
            <select
              value={selectedBarberId}
              onChange={(e) => setSelectedBarberId(e.target.value)}
              className="appearance-none bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-bold text-xs pl-3 pr-7 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all cursor-pointer"
            >
              <option value="ALL">All Barbers</option>
              {barbers.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.userId?.name || 'Barber'} (⭐ {b.averageRating > 0 ? b.averageRating.toFixed(1) : '5.0'})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>

          {/* Star Filter Select */}
          <div className="relative">
            <select
              value={selectedStar}
              onChange={(e) => setSelectedStar(e.target.value)}
              className="appearance-none bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-bold text-xs pl-3 pr-7 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all cursor-pointer"
            >
              <option value="ALL">All Stars</option>
              <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
              <option value="4">⭐⭐⭐⭐ 4 Stars</option>
              <option value="3">⭐⭐⭐ 3 Stars</option>
              <option value="2">⭐⭐ 2 Stars</option>
              <option value="1">⭐ 1 Star</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>

          {/* Sort Order Select */}
          <div className="relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="appearance-none bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-bold text-xs pl-3 pr-7 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all cursor-pointer"
            >
              <option value="NEWEST">Newest First</option>
              <option value="HIGHEST">Highest Rating</option>
              <option value="LOWEST">Lowest Rating</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 5. Reviews List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-3xl" />
          ))}
        </div>
      ) : filteredReviews.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {paginatedReviews.map((rev) => {
              const customerName = rev.customerId?.name || 'Verified Customer';
              const barberName = rev.barberId?.userId?.name || 'Specialist Barber';
              const dateStr = new Date(rev.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={rev._id}
                  className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-card flex flex-col justify-between space-y-4 hover:border-zinc-300 hover:shadow-md transition-all"
                >
                  {/* Review Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {rev.customerId?.avatar ? (
                        <img
                          src={rev.customerId.avatar}
                          alt={customerName}
                          className="w-10 h-10 rounded-xl object-cover border border-zinc-200 shadow-2xs shrink-0"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200/80 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                          {customerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-zinc-900 text-sm sm:text-base leading-snug">
                          {customerName}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[11px] font-bold text-emerald-700">Verified Visit</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center text-xs font-semibold text-zinc-400 gap-1 shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{dateStr}</span>
                    </div>
                  </div>

                  {/* Streamlined Ratings Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-zinc-50/80 px-4 py-2.5 rounded-2xl border border-zinc-100">
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <span className="text-xs font-bold text-zinc-600 flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-indigo-500" />
                        Shop:
                      </span>
                      {renderStars(rev.shopRating)}
                    </div>

                    <div className="hidden sm:block h-3.5 w-px bg-zinc-200" />

                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <span className="text-xs font-bold text-zinc-600 flex items-center gap-1.5 truncate max-w-[140px]">
                        <Scissors className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        {barberName}:
                      </span>
                      {renderStars(rev.barberRating)}
                    </div>
                  </div>

                  {/* Customer Comment */}
                  {rev.comment && (
                    <div className="relative pl-3.5 border-l-2 border-indigo-200 py-0.5">
                      <p className="text-xs sm:text-sm text-zinc-700 font-medium leading-relaxed italic">
                        "{rev.comment}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/80 shadow-card">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredReviews.length}
              pageSize={10}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-zinc-200/80 shadow-card">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-3">
            <Star className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-zinc-900">No reviews found</h4>
          <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
            {searchTerm || selectedBarberId !== 'ALL' || selectedStar !== 'ALL'
              ? 'No reviews match your current filter settings.'
              : 'Customer reviews will show up here as clients rate their appointments.'}
          </p>
        </div>
      )}
    </div>
  );
};
